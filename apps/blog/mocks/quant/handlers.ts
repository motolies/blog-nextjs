import { HttpResponse, http } from 'msw';
import { ADVISOR_JOB_META, COLLECT_JOB_META } from '../../src/lib/quant/jobCatalog';
import { kstDateOf, todayKst } from '../../src/lib/quant/kstDate';
import {
  ADVISOR_JOB_TYPES,
  type AdviceHeader,
  type AdvisorJobType,
  type AdvisorRunResponse,
  type BackfillRequest,
  COLLECT_JOB_TYPES,
  type CollectJobType,
  type CollectRunResponse,
  type KisTokenStatus,
  type LessonRow,
  type WeightSet,
} from '../../src/types/quant';
import { count } from '../counters';
import { fail, ok } from '../envelope';
import {
  CHECKPOINT_SUMMARY,
  GATE_BLOCKED_REASON,
  seedAdvices,
  seedAdvisorRuns,
  seedCheckpoints,
  seedCollectRuns,
  seedGate,
  seedHealth,
  seedIc,
  seedLessons,
  seedScoreSummary,
  seedToken,
  seedWeightSets,
} from './fixtures';

/**
 * Quant 관리 API 목 — `/api/stock/admin/collect/**` · `/api/advisor/admin/**` · `/api/stats/admin/health`.
 *
 * 다른 목과 달리 **상태를 가진다**: 트리거가 run 을 만들고, 같은 잡이 RUNNING 이면 409, 취소가 CANCELED 로 닫는다 —
 * 화면의 409 토스트·취소·재실행 흐름을 백엔드 없이 검증하려면 이 상태 기계가 필요하다(PLAN 검증 절 4).
 * 상태는 globalThis 에 두고(HMR 재평가 대비) 날짜가 바뀌면 자동 재시드한다. 테스트는 `resetQuantMockState()` 로 초기화한다.
 *
 * advisor 404 토글: `MOCK_ADVISOR_DISABLED=true` 면 `/api/advisor/admin/**` 전체가 404 — 위젯 "비활성" 빈 상태 확인용.
 *
 * 실 백엔드와 다른 점: RUNNING run 은 백그라운드가 없으므로 타이머로 60초 뒤 SUCCESS 로 닫는다(ADVISE 게이트 불통은 3초 뒤 SKIPPED).
 */

type QuantState = {
  today: string;
  collectRuns: CollectRunResponse[];
  advisorRuns: AdvisorRunResponse[];
  advices: AdviceHeader[];
  token: KisTokenStatus;
  weightSets: WeightSet[];
  lessons: LessonRow[];
  nextRunId: number;
};

type QuantGlobal = typeof globalThis & { __hvyQuantMock?: QuantState };
const store = globalThis as QuantGlobal;

function seed(today: string): QuantState {
  return {
    today,
    collectRuns: seedCollectRuns(today),
    advisorRuns: seedAdvisorRuns(today),
    advices: seedAdvices(today),
    token: seedToken(today),
    weightSets: seedWeightSets(today),
    lessons: seedLessons(today),
    nextRunId: 2000,
  };
}

function state(): QuantState {
  const today = todayKst();
  if (!store.__hvyQuantMock || store.__hvyQuantMock.today !== today) {
    store.__hvyQuantMock = seed(today);
  }
  return store.__hvyQuantMock;
}

/** 테스트·개발 리셋 — 트리거로 쌓인 run 을 버리고 시드로 되돌린다. */
export function resetQuantMockState(): void {
  store.__hvyQuantMock = undefined;
}

export function isAdvisorMockDisabled(): boolean {
  return process.env.MOCK_ADVISOR_DISABLED === 'true';
}

/** 실서버 409 봉투 — `data` 가 배열이 아니라 `{jobType, runningRunId}` 라 `fail()` 을 쓰지 않는다. runningRunId 는 문자열. */
function conflict(jobType: string, runningRunId: number) {
  return HttpResponse.json(
    {
      timestamp: '2026-01-01T00:00:00Z',
      status: 'FAIL',
      message: `${jobType} 가 이미 실행 중입니다 (run ${runningRunId})`,
      data: { jobType, runningRunId: String(runningRunId) },
    },
    { status: 409 },
  );
}

/** advisor 컨트롤러 부재(advisor.enabled=false) — Spring 기본 404 는 ApiResponse 봉투가 아니지만 프론트는 status 만 본다. */
function advisorNotFound() {
  return HttpResponse.json(
    {
      timestamp: '2026-01-01T00:00:00Z',
      status: 404,
      error: 'Not Found',
      path: '/api/advisor/admin',
    },
    { status: 404 },
  );
}

function clampLimit(raw: string | null): number {
  const value = Number(raw ?? 50);
  if (!Number.isFinite(value) || value <= 0) return 50;
  return Math.min(value, 500);
}

/** `GET /runs?jobType&status&from&to&limit` 필터 — from/to 는 startedAt 의 KST 날짜 기준 [from, to]. */
function filterRuns<T extends { jobType: string; status: string; startedAt: string }>(
  runs: readonly T[],
  url: URL,
): T[] {
  const jobType = url.searchParams.get('jobType');
  const status = url.searchParams.get('status');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = clampLimit(url.searchParams.get('limit'));
  return runs
    .filter((run) => (jobType ? run.jobType === jobType : true))
    .filter((run) => (status ? run.status === status : true))
    .filter((run) => {
      const day = kstDateOf(run.startedAt) ?? '';
      return (!from || day >= from) && (!to || day <= to);
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

/** 백엔드 `BackfillRequest.toMetadata()` 재현 — tickers 는 20개까지만 남고 tickerCount 로 원 개수를 남긴다. */
function toMetadata(body: BackfillRequest | null): Record<string, unknown> | null {
  if (!body) return null;
  const map: Record<string, unknown> = {};
  if (body.startDate) map.startDate = body.startDate;
  if (body.endDate) map.endDate = body.endDate;
  if (body.tickerFrom) map.tickerFrom = body.tickerFrom;
  if (body.tickerTo) map.tickerTo = body.tickerTo;
  if (body.tickers && body.tickers.length > 0) {
    map.tickerCount = body.tickers.length;
    map.tickers = body.tickers.slice(0, 20);
  }
  if (body.indexCodes && body.indexCodes.length > 0) map.indexCodes = body.indexCodes;
  if (body.resetCheckpoint) map.resetCheckpoint = true;
  if (body.force) map.force = true;
  return Object.keys(map).length > 0 ? map : null;
}

/** 백그라운드 흉내 — 프로세스를 잡아두지 않도록 unref. */
function later(ms: number, fn: () => void): void {
  const timer = setTimeout(fn, ms);
  (timer as { unref?: () => void }).unref?.();
}

function finishCollect(runId: number, status: CollectRunResponse['status']): void {
  const run = state().collectRuns.find((r) => r.runId === runId);
  if (run?.status !== 'RUNNING') return;
  const finishedAt = new Date().toISOString();
  run.status = status;
  run.finishedAt = finishedAt;
  run.durationMs = new Date(finishedAt).getTime() - new Date(run.startedAt).getTime();
  run.rowsUpserted = 1_234;
  run.apiCallCount = 56;
}

function finishAdvisor(
  runId: number,
  status: AdvisorRunResponse['status'],
  errorMessage: string | null,
): void {
  const run = state().advisorRuns.find((r) => r.runId === runId);
  if (run?.status !== 'RUNNING') return;
  const finishedAt = new Date().toISOString();
  run.status = status;
  run.finishedAt = finishedAt;
  run.durationMs = new Date(finishedAt).getTime() - new Date(run.startedAt).getTime();
  run.errorMessage = errorMessage;
  if (status === 'SUCCESS' && run.jobType === 'ADVISE') {
    run.llmCalls = 4;
    run.promptTokens = 47_000;
    run.completionTokens = 6_000;
    run.reasoningTokens = 12_000;
    run.cachedTokens = 19_000;
  }
}

function triggerCollect(request: Request, jobType: CollectJobType, body: BackfillRequest | null) {
  const s = state();
  const running = s.collectRuns.find((r) => r.jobType === jobType && r.status === 'RUNNING');
  if (running) return conflict(jobType, running.runId);

  const meta = COLLECT_JOB_META[jobType];
  const startedAt = new Date().toISOString();
  const runId = s.nextRunId++;
  const run: CollectRunResponse = {
    runId,
    jobType,
    jobDescription: meta.desc,
    triggerType: 'API',
    targetDate: s.today,
    rangeStart: body?.startDate ?? null,
    rangeEnd: body?.endDate ?? null,
    status: meta.longRunning ? 'RUNNING' : 'SUCCESS',
    startedAt,
    finishedAt: meta.longRunning ? null : startedAt,
    durationMs: meta.longRunning ? null : 1_800,
    rowsUpserted: meta.longRunning ? 0 : 2_731,
    apiCallCount: meta.longRunning ? 0 : 2,
    apiFailCount: 0,
    errorMessage: null,
    metadata: toMetadata(body),
  };
  s.collectRuns.unshift(run);
  if (meta.longRunning) later(60_000, () => finishCollect(runId, 'SUCCESS'));
  return ok(request, run, { status: meta.longRunning ? 202 : 200 });
}

function triggerAdvisor(request: Request, jobType: AdvisorJobType, baseDate: string | null) {
  const s = state();
  const running = s.advisorRuns.find((r) => r.jobType === jobType && r.status === 'RUNNING');
  if (running) return conflict(jobType, running.runId);

  const meta = ADVISOR_JOB_META[jobType];
  const startedAt = new Date().toISOString();
  const runId = s.nextRunId++;
  const effectiveBase = baseDate ?? s.today;
  const run: AdvisorRunResponse = {
    runId,
    jobType,
    jobDescription: meta.desc,
    triggerType: 'API',
    status: meta.longRunning ? 'RUNNING' : 'SUCCESS',
    baseDate: effectiveBase,
    model: null,
    promptVersion: null,
    llmCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    costUsd: 0,
    startedAt,
    finishedAt: meta.longRunning ? null : startedAt,
    durationMs: meta.longRunning ? null : 4_200,
    errorMessage: null,
    metadata: { requested: baseDate !== null },
  };
  s.advisorRuns.unshift(run);

  if (meta.longRunning) {
    if (jobType === 'ADVISE') {
      // 게이트 판정을 흉내낸다 — 오늘은 DAILY 결손, 과거 날짜는 LIVE 판단 존재 → 둘 다 SKIPPED
      const liveExists = s.advices.some(
        (a) => a.baseDate === effectiveBase && a.variant === 'LIVE',
      );
      const reason = liveExists ? '이미 판단이 있습니다' : GATE_BLOCKED_REASON;
      later(3_000, () => finishAdvisor(runId, 'SKIPPED', reason));
    } else {
      later(30_000, () => finishAdvisor(runId, 'SUCCESS', null));
    }
  }
  return ok(request, run, { status: meta.longRunning ? 202 : 200 });
}

const STOCK = '*/api/stock/admin/collect';
const ADVISOR = '*/api/advisor/admin';

/**
 * advisor 핸들러 공통 전처리 — 비활성 토글이면 404. `count` 도 여기서 한 번만.
 */
function advisorGuard<T>(handler: () => T): T | ReturnType<typeof advisorNotFound> {
  count('advisor');
  if (isAdvisorMockDisabled()) return advisorNotFound();
  return handler();
}

export const quantHandlers = [
  // ── stats health (schedulers[].manualTrigger 포함) ─────────────────────────
  http.get('*/api/stats/admin/health', ({ request }) => {
    count('stats');
    return ok(request, seedHealth(state().today));
  }),

  // ── stock: 트리거 (구체 경로 cancel·token → :jobType 순). `/reload` 별칭은 두지 않는다 — 화면은 `/RELOAD` 한 경로만 쓴다 ──
  http.post(`${STOCK}/runs/:runId/cancel`, ({ request, params }) => {
    count('stock');
    const run = state().collectRuns.find((r) => String(r.runId) === String(params.runId));
    if (!run) return fail(`run 을 찾을 수 없습니다: ${String(params.runId)}`, 404);
    if (run.status === 'RUNNING') {
      run.status = 'CANCELED';
      run.finishedAt = new Date().toISOString();
      run.durationMs = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
      run.errorMessage = '관리자 취소';
    }
    return ok(request, run);
  }),

  http.post(`${STOCK}/token/refresh`, ({ request }) => {
    count('stock');
    const s = state();
    const issued = s.token.issuedAt ? new Date(s.token.issuedAt).getTime() : 0;
    // 60초 게이트 — 걸리면 기존 토큰 그대로(오류 아님)
    if (Date.now() - issued >= 60_000) {
      const now = new Date();
      s.token = {
        configured: true,
        present: true,
        issuedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
        remainingMinutes: 1_440,
      };
    }
    return ok(request, s.token);
  }),

  http.post(`${STOCK}/:jobType`, async ({ request, params }) => {
    count('stock');
    const jobType = String(params.jobType);
    if (!(COLLECT_JOB_TYPES as readonly string[]).includes(jobType)) {
      return fail(`알 수 없는 잡 유형: ${jobType}`, 400);
    }
    const body = (await request.json().catch(() => null)) as BackfillRequest | null;
    // PriceReloadJob 의 400 — RELOAD 는 tickers 가 필수(프론트 검증이 먼저 막지만 목도 같은 규칙을 지킨다)
    if (jobType === 'RELOAD' && (!body?.tickers || body.tickers.length === 0)) {
      return fail('RELOAD 는 tickers 가 필수입니다', 400);
    }
    return triggerCollect(request, jobType as CollectJobType, body);
  }),

  // ── stock: 조회 ────────────────────────────────────────────────────────────
  http.get(`${STOCK}/runs`, ({ request }) => {
    count('stock');
    return ok(request, filterRuns(state().collectRuns, new URL(request.url)));
  }),

  http.get(`${STOCK}/runs/:runId`, ({ request, params }) => {
    count('stock');
    const run = state().collectRuns.find((r) => String(r.runId) === String(params.runId));
    if (!run) return fail(`run 을 찾을 수 없습니다: ${String(params.runId)}`, 404);
    return ok(request, run);
  }),

  http.get(`${STOCK}/checkpoints/summary`, ({ request }) => {
    count('stock');
    const jobType = new URL(request.url).searchParams.get('jobType');
    return ok(request, jobType === 'PRICE_BACKFILL' ? CHECKPOINT_SUMMARY : {});
  }),

  http.get(`${STOCK}/checkpoints`, ({ request }) => {
    count('stock');
    const url = new URL(request.url);
    const jobType = url.searchParams.get('jobType');
    if (!jobType) return fail('jobType 은 필수입니다', 400);
    const status = url.searchParams.get('status');
    const rows = jobType === 'PRICE_BACKFILL' ? seedCheckpoints(state().today) : [];
    return ok(
      request,
      rows
        .filter((row) => (status ? row.status === status : true))
        .slice(0, clampLimit(url.searchParams.get('limit'))),
    );
  }),

  http.get(`${STOCK}/token`, ({ request }) => {
    count('stock');
    return ok(request, state().token);
  }),

  // ── advisor ───────────────────────────────────────────────────────────────
  http.post(`${ADVISOR}/jobs/:jobType`, ({ request, params }) =>
    advisorGuard(() => {
      const jobType = String(params.jobType);
      if (!(ADVISOR_JOB_TYPES as readonly string[]).includes(jobType)) {
        return fail(`알 수 없는 잡 유형: ${jobType}`, 400);
      }
      const baseDate = new URL(request.url).searchParams.get('baseDate');
      return triggerAdvisor(request, jobType as AdvisorJobType, baseDate);
    }),
  ),

  http.post(`${ADVISOR}/runs/:runId/cancel`, ({ request, params }) =>
    advisorGuard(() => {
      const run = state().advisorRuns.find((r) => String(r.runId) === String(params.runId));
      if (!run) return fail(`run 을 찾을 수 없습니다: ${String(params.runId)}`, 404);
      if (run.status === 'RUNNING') {
        run.status = 'CANCELED';
        run.finishedAt = new Date().toISOString();
        run.durationMs = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
        run.errorMessage = '관리자 취소';
      }
      return ok(request, run);
    }),
  ),

  http.get(`${ADVISOR}/runs`, ({ request }) =>
    advisorGuard(() => ok(request, filterRuns(state().advisorRuns, new URL(request.url)))),
  ),

  http.get(`${ADVISOR}/runs/:runId`, ({ request, params }) =>
    advisorGuard(() => {
      const run = state().advisorRuns.find((r) => String(r.runId) === String(params.runId));
      if (!run) return fail(`run 을 찾을 수 없습니다: ${String(params.runId)}`, 404);
      return ok(request, run);
    }),
  ),

  http.get(`${ADVISOR}/gate`, ({ request }) =>
    advisorGuard(() => {
      const s = state();
      const baseDate = new URL(request.url).searchParams.get('baseDate') ?? s.today;
      if (baseDate === s.today) return ok(request, seedGate(s.today));
      const done = s.advices.some((a) => a.baseDate === baseDate && a.variant === 'LIVE');
      return ok(request, {
        baseDate,
        tradingDay: true,
        alreadyDone: done,
        dataReady: true,
        pastDeadline: true,
        quality: 'OK',
        reason: done ? '이미 판단이 있습니다' : 'DAILY 완료',
        ready: !done,
        waitQuietly: done,
      });
    }),
  ),

  http.get(`${ADVISOR}/advices/:adviceId/prompt`, ({ request, params }) =>
    advisorGuard(() => {
      const advice = state().advices.find((a) => String(a.adviceId) === String(params.adviceId));
      if (!advice) return fail(`판단을 찾을 수 없습니다: ${String(params.adviceId)}`, 404);
      const row = (variant: 'LIVE' | 'LLM_NOMEM') => ({
        runId: advice.runId,
        variant,
        promptVersion: 'advice-v5',
        systemSha256: 'mock-sha256',
        userPayload: JSON.stringify({ baseDate: advice.baseDate, candidates: 30, variant }),
        optionsJson: JSON.stringify({ model: 'gpt-5.6-luna', reasoning: { effort: 'medium' } }),
        rawOutput: JSON.stringify({ summary: advice.summary, picks: [] }),
      });
      return ok(request, { LIVE: row('LIVE'), LLM_NOMEM: row('LLM_NOMEM') });
    }),
  ),

  http.get(`${ADVISOR}/advices/:adviceId`, ({ request, params }) =>
    advisorGuard(() => {
      const advice = state().advices.find((a) => String(a.adviceId) === String(params.adviceId));
      if (!advice) return fail(`판단을 찾을 수 없습니다: ${String(params.adviceId)}`, 404);
      return ok(request, {
        header: advice,
        candidates: [],
        picks: [],
        candidateScores: [],
        callScores: [],
        intradayChecks: [],
        morningCheck: null,
      });
    }),
  ),

  http.delete(`${ADVISOR}/advices/:adviceId`, ({ request, params }) =>
    advisorGuard(() => {
      const s = state();
      const index = s.advices.findIndex((a) => String(a.adviceId) === String(params.adviceId));
      if (index < 0) return fail(`판단을 찾을 수 없습니다: ${String(params.adviceId)}`, 404);
      s.advices.splice(index, 1);
      return ok(request, { adviceId: Number(params.adviceId), deleted: 1 });
    }),
  ),

  http.get(`${ADVISOR}/advices`, ({ request }) =>
    advisorGuard(() => {
      const url = new URL(request.url);
      const s = state();
      const to = url.searchParams.get('to') ?? s.today;
      const from =
        url.searchParams.get('from') ??
        new Date(new Date(`${to}T12:00:00Z`).getTime() - 30 * 86_400_000)
          .toISOString()
          .slice(0, 10);
      const variant = url.searchParams.get('variant');
      const limit = clampLimit(url.searchParams.get('limit'));
      return ok(
        request,
        s.advices
          .filter((a) => a.baseDate >= from && a.baseDate <= to)
          .filter((a) => (variant ? a.variant === variant : true))
          .slice(0, limit),
      );
    }),
  ),

  http.get(`${ADVISOR}/scores/summary`, ({ request }) =>
    advisorGuard(() => ok(request, seedScoreSummary(state().today))),
  ),

  http.get(`${ADVISOR}/scores/calibration`, ({ request }) =>
    advisorGuard(() => ok(request, seedScoreSummary(state().today).calibration)),
  ),

  http.get(`${ADVISOR}/scores/ic`, ({ request }) => advisorGuard(() => ok(request, seedIc()))),

  http.post(`${ADVISOR}/weights/sets/:weightSetId/activate`, ({ request, params }) =>
    advisorGuard(() => {
      const s = state();
      const target = s.weightSets.find((w) => String(w.weightSetId) === String(params.weightSetId));
      if (!target)
        return fail(`가중치 세트를 찾을 수 없습니다: ${String(params.weightSetId)}`, 404);
      for (const set of s.weightSets) set.active = set === target;
      target.source = 'MANUAL';
      return ok(request, target);
    }),
  ),

  http.get(`${ADVISOR}/weights/sets`, ({ request }) =>
    advisorGuard(() =>
      ok(
        request,
        state().weightSets.slice(0, clampLimit(new URL(request.url).searchParams.get('limit'))),
      ),
    ),
  ),

  http.get(`${ADVISOR}/weights`, ({ request }) =>
    advisorGuard(() => {
      const active = state().weightSets.find((w) => w.active);
      return active
        ? ok(request, active)
        : fail('활성 가중치 세트가 없습니다 (advisor-seed.sql 적용 필요)', 404);
    }),
  ),

  http.get(`${ADVISOR}/chats`, ({ request }) =>
    advisorGuard(() =>
      ok(request, [
        {
          chatId: 1,
          eventId: 'Ev01',
          channelId: 'C0HVYADV',
          threadTs: '1758300000.000100',
          messageTs: '1758300000.000100',
          slackUserId: 'U01ADMIN',
          question: '오늘 판단 왜 안 나왔어?',
          answer: 'DAILY 수집의 VALUATION 단계가 실패해 ADVISE 게이트가 닫혔습니다(run 1201).',
          status: 'SUCCESS',
          model: 'gpt-5.6-luna',
          promptVersion: 'chat-v1',
          historyMessages: 0,
          toolCalls: 2,
          toolCallNames: ['collect_runs', 'gate'],
          promptTokens: 3_200,
          completionTokens: 180,
          reasoningTokens: 600,
          cachedTokens: 0,
          costUsd: 0,
          dataAsOf: state().today,
          durationMs: 8_400,
          errorMessage: null,
          createdAt: new Date(`${state().today}T10:12:00+09:00`).toISOString(),
          updatedAt: null,
        },
      ]),
    ),
  ),

  http.post(`${ADVISOR}/lessons/:lessonId/retire`, ({ request, params }) =>
    advisorGuard(() => {
      const lesson = state().lessons.find((l) => String(l.lessonId) === String(params.lessonId));
      if (!lesson) return fail(`교훈을 찾을 수 없습니다: ${String(params.lessonId)}`, 404);
      lesson.status = 'RETIRED';
      lesson.retiredAt = new Date().toISOString();
      lesson.retiredReason = new URL(request.url).searchParams.get('reason') ?? '관리자 수동 폐기';
      return ok(request, lesson);
    }),
  ),

  http.get(`${ADVISOR}/lessons`, ({ request }) =>
    advisorGuard(() => {
      const status = new URL(request.url).searchParams.get('status');
      return ok(
        request,
        state().lessons.filter((l) => (status ? l.status === status : true)),
      );
    }),
  ),
];
