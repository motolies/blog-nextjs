/**
 * Quant(주식 수집·AI 어드바이저) 관리 API 결정론 픽스처.
 *
 * 다른 픽스처와 달리 **오늘(KST)의 함수**다 — 운영 현황 화면의 "오늘 파이프라인"·"게이트"는 `targetDate == 오늘` 을 보므로
 * 고정 날짜로는 화면이 늘 비어 있다. `seedQuant(today)` 는 `today` 가 같으면 항상 같은 값을 돌려준다(하루 안에서 결정론).
 * Math.random()/Date.now() 는 여기서 쓰지 않는다 — 시각은 전부 `today` 에서 산술 파생한다.
 *
 * 시나리오(PLAN 검증 절 4 항목):
 *   · 오늘 DAILY FAILED(run 1201) — steps 중 VALUATION FAILED·DERIVED SKIPPED → 상세에서 VALUATION 재실행 가능·PRICE 는 안내
 *   · PRICE_BACKFILL RUNNING(run 1202) — 같은 잡 두 번째 트리거 → 409 `{jobType, runningRunId:'1202'}`
 *   · 게이트 ready:false 사유 = DAILY 단계 실패 · 오늘 ADVISE SKIPPED(run 501)
 *   · RELOAD run 1196 은 tickerCount 25 → 재실행 버튼 비활성(20개 절단)
 *   · advisor 404 토글: 핸들러가 `MOCK_ADVISOR_DISABLED=true` 를 읽는다(여기가 아니라 handlers.ts)
 *   · 멀티 호라이즌: 어제 MORNING(#90, 저녁 #77 의 재판정 — 유지·추가·제외 + 갭 트리거) · 지난주 H20(#95) · H60(#96, 판정 불가)
 */

import type {
  AdviceHeader,
  AdviceKind,
  AdviceVariant,
  AdvisorGateResponse,
  AdvisorRunResponse,
  CollectCheckpointResponse,
  CollectRunResponse,
  KisTokenStatus,
  LessonRow,
  ManualTrigger,
  MarketRegime,
  MorningDiff,
  MorningVsDailyResponse,
  PickRow,
  RunStep,
  ScoreSummaryResponse,
  WeightSet,
} from '../../src/types/quant';
import type { HealthStats, SchedulerHealthState, SchedulerStatus } from '../../src/types/stats';

// ── 날짜 산술 ─────────────────────────────────────────────────────────────

/** `YYYY-MM-DD` ± n일 — UTC 정오 기준으로 계산해 DST·타임존 경계를 피한다. */
export function shiftDate(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** KST 벽시계 `date HH:mm` → Instant ISO. 백엔드 Instant 직렬화(Z)와 같은 꼴. */
export function atKst(date: string, time: string): string {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

function plusMs(instant: string, ms: number): string {
  return new Date(new Date(instant).getTime() + ms).toISOString();
}

const MIN = 60_000;

// ── stock runs ────────────────────────────────────────────────────────────

const DAILY_OK_STEPS: RunStep[] = [
  { step: 'INDEX', status: 'OK', ms: 1800, processed: 3, failures: 0 },
  { step: 'PRICE', status: 'OK', ms: 610_000, processed: 2731, failures: 0 },
  { step: 'VALUATION', status: 'OK', ms: 240_000, processed: 2731, failures: 0 },
  { step: 'INVESTOR', status: 'OK', ms: 180_000, processed: 2731, failures: 0 },
  { step: 'MARKET_INVESTOR', status: 'OK', ms: 4_000, processed: 2, failures: 0 },
  { step: 'ETF_NAV', status: 'OK', ms: 90_000, processed: 812, failures: 0 },
  { step: 'STATS', status: 'OK', ms: 120_000, processed: 2731, failures: 0 },
  { step: 'CA_HINT', status: 'OK', ms: 2_500, processed: 14, failures: 0 },
  { step: 'VALIDATE', status: 'OK', ms: 6_000, processed: 12, failures: 0 },
  { step: 'DERIVED', status: 'OK', ms: 215_000, processed: 2731, failures: 0 },
];

const DAILY_FAILED_STEPS: RunStep[] = DAILY_OK_STEPS.map((step) => {
  if (step.step === 'VALUATION') {
    return {
      ...step,
      status: 'FAILED',
      ms: 3_200,
      processed: 41,
      failures: 1,
      reason: 'KIS 500 (EGW00201) 3회 연속',
    };
  }
  if (step.step === 'DERIVED') {
    return { step: 'DERIVED', status: 'SKIPPED', reason: 'VALUATION 실패 — 파생 지표 계산 건너뜀' };
  }
  return step;
});

const WEEKLY_STEPS: RunStep[] = [
  { step: 'CORP_ACTION', status: 'OK', ms: 900_000, processed: 2731, failures: 0 },
  { step: 'STOCK_INFO', status: 'OK', ms: 1_500_000, processed: 2731, failures: 0 },
  { step: 'ADJUST_FACTOR', status: 'OK', ms: 120_000, processed: 2731, failures: 0 },
  { step: 'FINANCIAL', status: 'OK', ms: 1_800_000, processed: 2731, failures: 0 },
  { step: 'DERIVED_FULL', status: 'OK', ms: 240_000, processed: 2731, failures: 0 },
];

type RunSeed = Partial<CollectRunResponse> &
  Pick<CollectRunResponse, 'runId' | 'jobType' | 'jobDescription' | 'status' | 'startedAt'>;

function collectRun(seed: RunSeed, durationMs: number | null): CollectRunResponse {
  const finished = seed.status === 'RUNNING' || durationMs === null;
  return {
    triggerType: 'SCHEDULER',
    targetDate: seed.startedAt.slice(0, 10),
    rangeStart: null,
    rangeEnd: null,
    finishedAt: finished ? null : plusMs(seed.startedAt, durationMs),
    durationMs: finished ? null : durationMs,
    rowsUpserted: 0,
    apiCallCount: 0,
    apiFailCount: 0,
    errorMessage: null,
    metadata: null,
    ...seed,
  };
}

/** `targetDate` 는 KST 날짜여야 한다 — startedAt 은 UTC 로 직렬화되니 slice 로 얻지 않고 명시한다. */
export function seedCollectRuns(today: string): CollectRunResponse[] {
  const d = (n: number) => shiftDate(today, -n);
  const runs: CollectRunResponse[] = [
    collectRun(
      {
        runId: 1201,
        jobType: 'DAILY',
        jobDescription: '일일 증분 수집',
        status: 'FAILED',
        startedAt: atKst(today, '18:30'),
        targetDate: today,
        rowsUpserted: 48_210,
        apiCallCount: 3_120,
        apiFailCount: 3,
        errorMessage: '단계 결손: VALUATION 실패 · DERIVED 건너뜀',
        metadata: { steps: DAILY_FAILED_STEPS },
      },
      21 * MIN,
    ),
    collectRun(
      {
        runId: 1202,
        jobType: 'PRICE_BACKFILL',
        jobDescription: '종목 일봉 백필',
        triggerType: 'API',
        status: 'RUNNING',
        startedAt: atKst(today, '09:00'),
        targetDate: today,
        rowsUpserted: 120_400,
        apiCallCount: 4_012,
        apiFailCount: 2,
        metadata: {
          startDate: '2016-01-01',
          tickerFrom: '000020',
          tickerTo: '099999',
        },
      },
      null,
    ),
    collectRun(
      {
        runId: 1203,
        jobType: 'MASTER',
        jobDescription: '종목 마스터 갱신',
        status: 'SUCCESS',
        startedAt: atKst(today, '05:30'),
        targetDate: today,
        rowsUpserted: 2_731,
        apiCallCount: 2,
      },
      45_000,
    ),
    collectRun(
      {
        runId: 1204,
        jobType: 'HOLIDAY',
        jobDescription: '휴장일 수집',
        status: 'SUCCESS',
        startedAt: atKst(today, '05:31'),
        targetDate: today,
        rowsUpserted: 12,
        apiCallCount: 1,
      },
      3_000,
    ),
    collectRun(
      {
        runId: 1205,
        jobType: 'OVERSEAS_DAILY',
        jobDescription: '해외 일일 증분',
        status: 'SUCCESS',
        startedAt: atKst(today, '06:30'),
        targetDate: today,
        rowsUpserted: 640,
        apiCallCount: 16,
      },
      2 * MIN,
    ),
    collectRun(
      {
        runId: 1206,
        jobType: 'MACRO',
        jobDescription: '거시 위험 지표 수집',
        status: 'PARTIAL',
        startedAt: atKst(today, '06:35'),
        targetDate: today,
        rowsUpserted: 30,
        apiCallCount: 4,
        apiFailCount: 1,
        errorMessage: 'FRED DGS10 타임아웃 1건 (T-2 지연 정상)',
      },
      40_000,
    ),
    collectRun(
      {
        runId: 1207,
        jobType: 'NEWS',
        jobDescription: '사건 피드·헤드라인 수집',
        status: 'SUCCESS',
        startedAt: atKst(today, '06:40'),
        targetDate: today,
        rowsUpserted: 1_512,
        apiCallCount: 12,
      },
      95_000,
    ),
    collectRun(
      {
        runId: 1198,
        jobType: 'DAILY',
        jobDescription: '일일 증분 수집',
        status: 'SUCCESS',
        startedAt: atKst(d(1), '18:30'),
        targetDate: d(1),
        rowsUpserted: 51_002,
        apiCallCount: 3_140,
        metadata: { steps: DAILY_OK_STEPS },
      },
      23 * MIN,
    ),
    collectRun(
      {
        runId: 1197,
        jobType: 'VALUATION',
        jobDescription: '밸류에이션 스냅샷',
        triggerType: 'API',
        status: 'CANCELED',
        startedAt: atKst(d(1), '10:00'),
        targetDate: d(1),
        rowsUpserted: 410,
        apiCallCount: 412,
        errorMessage: '관리자 취소',
        metadata: { endDate: d(1) },
      },
      3 * MIN,
    ),
    collectRun(
      {
        runId: 1196,
        jobType: 'RELOAD',
        jobDescription: '부분 재적재',
        triggerType: 'API',
        status: 'FAILED',
        startedAt: atKst(d(1), '11:00'),
        targetDate: d(1),
        rowsUpserted: 2_200,
        apiCallCount: 25,
        apiFailCount: 3,
        errorMessage: '종목 3건 KIS 오류 (005930, 000660, 035420)',
        metadata: {
          startDate: d(10),
          tickerCount: 25,
          tickers: Array.from({ length: 20 }, (_, i) => String(100 + i).padStart(6, '0')),
        },
      },
      4 * MIN,
    ),
    collectRun(
      {
        runId: 1195,
        jobType: 'WEEKLY',
        jobDescription: '주간 수집',
        status: 'SUCCESS',
        startedAt: atKst(d(3), '03:00'),
        targetDate: d(3),
        rowsUpserted: 9_850,
        apiCallCount: 8_200,
        apiFailCount: 4,
        metadata: { steps: WEEKLY_STEPS },
      },
      76 * MIN,
    ),
  ];

  // 과거 DAILY·OVERSEAS_DAILY — 이력 그리드가 페이징·정렬을 검증할 만큼의 행
  for (let k = 2; k <= 16; k += 1) {
    runs.push(
      collectRun(
        {
          runId: 1200 - 20 - k,
          jobType: 'DAILY',
          jobDescription: '일일 증분 수집',
          status: k % 7 === 0 ? 'PARTIAL' : 'SUCCESS',
          startedAt: atKst(d(k), '18:30'),
          targetDate: d(k),
          rowsUpserted: 50_000 + k * 37,
          apiCallCount: 3_100 + k,
          apiFailCount: k % 7 === 0 ? 5 : 0,
          errorMessage: k % 7 === 0 ? 'ETF NAV 5종목 응답 없음 (임계 1% 미만)' : null,
          metadata: { steps: DAILY_OK_STEPS },
        },
        (20 + (k % 5)) * MIN,
      ),
    );
    runs.push(
      collectRun(
        {
          runId: 1200 - 40 - k,
          jobType: 'OVERSEAS_DAILY',
          jobDescription: '해외 일일 증분',
          status: 'SUCCESS',
          startedAt: atKst(d(k), '06:30'),
          targetDate: d(k),
          rowsUpserted: 600 + k,
          apiCallCount: 16,
        },
        2 * MIN,
      ),
    );
  }

  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// ── advisor runs ──────────────────────────────────────────────────────────

export const GATE_BLOCKED_REASON = 'DAILY 의 PRICE·DERIVED 단계가 실패했습니다: run=1201';

type AdvisorSeed = Partial<AdvisorRunResponse> &
  Pick<
    AdvisorRunResponse,
    'runId' | 'jobType' | 'jobDescription' | 'status' | 'startedAt' | 'baseDate'
  >;

function advisorRun(seed: AdvisorSeed, durationMs: number | null): AdvisorRunResponse {
  const finished = seed.status === 'RUNNING' || durationMs === null;
  return {
    triggerType: 'SCHEDULER',
    model: null,
    promptVersion: null,
    llmCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    costUsd: 0,
    finishedAt: finished ? null : plusMs(seed.startedAt, durationMs),
    durationMs: finished ? null : durationMs,
    errorMessage: null,
    metadata: { requested: false },
    ...seed,
  };
}

const MODEL = 'gpt-5.6-luna';

export function seedAdvisorRuns(today: string): AdvisorRunResponse[] {
  const d = (n: number) => shiftDate(today, -n);
  const runs: AdvisorRunResponse[] = [
    advisorRun(
      {
        runId: 501,
        jobType: 'ADVISE',
        jobDescription: '일일 시장 판단·추천',
        status: 'SKIPPED',
        startedAt: atKst(today, '19:30'),
        baseDate: today,
        errorMessage: GATE_BLOCKED_REASON,
        metadata: { requested: false, reason: GATE_BLOCKED_REASON },
      },
      1_200,
    ),
    advisorRun(
      {
        runId: 502,
        jobType: 'INTRADAY',
        jobDescription: '장중 점검',
        status: 'SUCCESS',
        startedAt: atKst(today, '12:00'),
        baseDate: today,
        metadata: { requested: false, adviceId: 77 },
      },
      8_000,
    ),
    advisorRun(
      {
        runId: 503,
        jobType: 'MORNING_CHECK',
        jobDescription: '아침 해외 반영 점검',
        status: 'SUCCESS',
        startedAt: atKst(today, '07:30'),
        baseDate: today,
        metadata: { requested: false, adviceId: 77, verdict: 'HOLD' },
      },
      5_000,
    ),
    advisorRun(
      {
        runId: 491,
        jobType: 'SCORE',
        jobDescription: '채점·IC 계산 (보충 실행)',
        triggerType: 'API',
        status: 'SUCCESS',
        startedAt: atKst(d(1), '20:10'),
        baseDate: d(1),
        metadata: { requested: true, scored: 12 },
      },
      42_000,
    ),
    advisorRun(
      {
        runId: 492,
        jobType: 'IC_BACKFILL',
        jobDescription: '시그널 IC 사전 추정',
        triggerType: 'API',
        status: 'FAILED',
        startedAt: atKst(d(9), '14:00'),
        baseDate: d(9),
        errorMessage: '영업일 캘린더가 비어 있습니다 — HOLIDAY 수집 선행 필요',
        metadata: { requested: true },
      },
      2_000,
    ),
    advisorRun(
      {
        runId: 485,
        jobType: 'WEEKLY_REVIEW',
        jobDescription: '주간 검토 (가중치·보정·교훈·보고)',
        status: 'SUCCESS',
        startedAt: atKst(d(6), '08:00'),
        baseDate: d(6),
        model: MODEL,
        promptVersion: 'review-v2',
        llmCalls: 1,
        promptTokens: 22_000,
        completionTokens: 3_100,
        reasoningTokens: 6_000,
        cachedTokens: 0,
        metadata: { requested: false, weightSetId: 12, lessons: 0 },
      },
      6 * MIN,
    ),
  ];

  // 과거 ADVISE 성공 run (T-1 … T-11) — LIVE 판단 1건씩 대응(adviceId = 78 - k)
  for (let k = 1; k <= 11; k += 1) {
    runs.push(
      advisorRun(
        {
          runId: 490 - k + 1 - (k > 1 ? 1 : 0),
          jobType: 'ADVISE',
          jobDescription: '일일 시장 판단·추천',
          status: 'SUCCESS',
          startedAt: atKst(d(k), '19:30'),
          baseDate: d(k),
          model: MODEL,
          promptVersion: 'advice-v5',
          llmCalls: 4,
          promptTokens: 46_000 + k * 120,
          completionTokens: 5_800 + k * 15,
          reasoningTokens: 11_000 + k * 40,
          cachedTokens: 19_000,
          metadata: { requested: false, adviceId: 78 - k, variants: 4 },
        },
        (4 + (k % 3)) * MIN,
      ),
    );
  }

  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// ── advices ───────────────────────────────────────────────────────────────

/** 합성 국면 — 상승 추세 × 보통 변동, 정책 표 v1. */
const REGIME: MarketRegime = {
  indexCode: '0001',
  tradeDate: null,
  trend: 'BULL',
  trendScore: 3,
  vol: 'NORMAL',
  volPct: 0.46,
  sigma20: 0.0094,
  volHistoryDays: 1_180,
  policy: { version: 'regime-policy-v1', longMax: 6, convictionCap: 0.8, avoidMax: 2 },
  themes: [],
};

const KIND_HORIZON: Record<AdviceKind, number> = {
  DAILY: 5,
  MORNING: 5,
  H20: 20,
  H60: 60,
  H180: 180,
  ADHOC: 5,
};

function adviceHeader(
  adviceId: number,
  runId: number,
  baseDate: string,
  variant: AdviceVariant,
  kind: AdviceKind = 'DAILY',
): AdviceHeader {
  const createdAt = atKst(baseDate, kind === 'MORNING' ? '07:42' : '19:34');
  return {
    adviceId,
    runId,
    baseDate,
    adviceKind: kind,
    variant,
    horizonDays: KIND_HORIZON[kind],
    regimeCode: 'NEUTRAL',
    kospiDir: 'UP',
    kosdaqDir: 'NEUTRAL',
    pUp: 0.58,
    regimeRationale: '외국인 5일 순매수 전환, VIX 15 미만, 20일선 위 종목 비율 54%',
    leadingSectors: [
      { code: 'G45', name: 'IT', reason: '반도체 수출 지표 개선' },
      { code: 'G35', name: '헬스케어', reason: '바이오 임상 이벤트' },
    ],
    summary: `${baseDate} 기준 중립 국면 · KOSPI 상승 우위(p=0.58) · 반도체·바이오 주도`,
    trendKospi: 'BULL',
    trendKosdaq: 'SIDEWAYS',
    trends: null,
    outlooks: null,
    dataAsOf: { price: baseDate, investor: baseDate, macro: shiftDate(baseDate, -2) },
    entryDate: shiftDate(baseDate, 1),
    exitDate: shiftDate(baseDate, 8),
    newsIds: variant === 'LLM_NONEWS' ? [] : ['gdelt-1', 'gdelt-2'],
    promptVersion: variant === 'QUANT_TOPN' ? null : 'advice-v5',
    model: variant === 'QUANT_TOPN' ? null : MODEL,
    systemFingerprint: variant === 'QUANT_TOPN' ? null : 'fp_mock',
    weightSetId: 12,
    activeLessonIds: [],
    dataQuality: 'OK',
    guard: { removedPicks: 0, citedNewsDropped: 0 },
    publishedAt: variant === 'LIVE' ? plusMs(createdAt, 30_000) : null,
    createdAt,
    memoryJson: null,
    parentAdviceId: null,
    diffJson: null,
    // MORNING 은 저녁 국면을 읽기만 한다(백엔드와 같이 null)
    regime: kind === 'MORNING' ? null : { ...REGIME, tradeDate: baseDate },
  };
}

/** 어제 저녁 #77 에 대한 아침 재판정 조치 — 제외 1·추가 1·유지 1, 예상 갭 트리거. */
function morningDiff(parentAdviceId: number, usDate: string): MorningDiff {
  return {
    parentAdviceId,
    keep: [{ ticker: '005930', reason: '예상 갭 −0.3σ — 논지 유지' }],
    add: [{ ticker: '000660', reason: 'SOX +3.1% · 섹터 연동 z 2.4' }],
    drop: [
      {
        ticker: '035420',
        reason: '예상 갭 −1.2σ 로 진입가 불리',
        direction: 'LONG',
        conviction: 0.7,
      },
    ],
    triggers: {
      gap: true,
      gapIndexes: ['0001'],
      sector: true,
      sectorSymbols: ['SOX'],
      caution: false,
      morningCheck: true,
      any: true,
    },
    usDate,
    usClosed: false,
  };
}

/** MORNING 판단의 저장 픽 — DROP 은 픽에 없다(diffJson 에만). */
export const MORNING_PICKS: PickRow[] = [
  {
    ticker: '005930',
    pickRank: 1,
    direction: 'LONG',
    conviction: 0.7,
    thesis: '메모리 가격 반등 지속',
    riskNote: '환율 급변',
    cited: null,
    citedNews: null,
    action: 'KEEP',
    actionReason: '예상 갭 −0.3σ — 논지 유지',
  },
  {
    ticker: '000660',
    pickRank: 2,
    direction: 'LONG',
    conviction: 0.6,
    thesis: '밤사이 SOX 강세 연동',
    riskNote: '갭 상승 후 되돌림',
    cited: null,
    citedNews: null,
    action: 'ADD',
    actionReason: 'SOX +3.1% · 섹터 연동 z 2.4',
  },
];

export function seedAdvices(today: string): AdviceHeader[] {
  const advices: AdviceHeader[] = [];
  for (let k = 1; k <= 11; k += 1) {
    const baseDate = shiftDate(today, -k);
    const runId = 490 - k + 1 - (k > 1 ? 1 : 0);
    advices.push(adviceHeader(78 - k, runId, baseDate, 'LIVE'));
    if (k === 1) {
      advices.push(adviceHeader(177, runId, baseDate, 'QUANT_TOPN'));
      advices.push(adviceHeader(277, runId, baseDate, 'LLM_NOMEM'));
      advices.push(adviceHeader(377, runId, baseDate, 'LLM_NONEWS'));
      advices.push(adviceHeader(477, runId, baseDate, 'QUANT_TOPN_BROAD'));
    }
  }
  // 어제 저녁(#77) 의 아침 재판정 — 기준일은 저녁과 같다(같은 창)
  const yesterday = shiftDate(today, -1);
  advices.push({
    ...adviceHeader(90, 495, yesterday, 'LIVE', 'MORNING'),
    parentAdviceId: 77,
    diffJson: morningDiff(77, shiftDate(today, -1)),
  });
  advices.push(adviceHeader(95, 480, shiftDate(today, -6), 'LIVE', 'H20'));
  advices.push({
    ...adviceHeader(96, 481, shiftDate(today, -6), 'LIVE', 'H60'),
    regimeCode: null,
    kospiDir: null,
    kosdaqDir: null,
    pUp: null,
  });
  return advices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── gate · token ─────────────────────────────────────────────────────────

/** 오늘 게이트 — DAILY 1201 의 단계 결손으로 dataReady:false. 마감(19:55) 전이라 pastDeadline:false. */
export function seedGate(today: string): AdvisorGateResponse {
  return {
    baseDate: today,
    tradingDay: true,
    alreadyDone: false,
    dataReady: false,
    pastDeadline: false,
    quality: 'DEGRADED',
    reason: GATE_BLOCKED_REASON,
    ready: false,
    waitQuietly: false,
  };
}

export function seedToken(today: string): KisTokenStatus {
  return {
    configured: true,
    present: true,
    issuedAt: atKst(today, '05:29'),
    expiresAt: atKst(shiftDate(today, 1), '05:29'),
    remainingMinutes: 1_380,
  };
}

// ── checkpoints (PRICE_BACKFILL 만) ───────────────────────────────────────

export function seedCheckpoints(today: string): CollectCheckpointResponse[] {
  const updatedAt = atKst(today, '09:10');
  const row = (
    targetKey: string,
    status: CollectCheckpointResponse['status'],
    attemptCount: number,
    cursorDate: string | null,
    errorMessage: string | null = null,
  ): CollectCheckpointResponse => ({
    jobType: 'PRICE_BACKFILL',
    targetKey,
    cursorDate,
    earliestLoaded: cursorDate,
    latestLoaded: today,
    status,
    attemptCount,
    lastRunId: 1202,
    errorMessage,
    updatedAt,
  });
  return [
    row('005930', 'DONE', 1, '2016-01-01'),
    row('000660', 'DONE', 1, '2016-01-01'),
    row('035420', 'IN_PROGRESS', 2, '2019-03-11'),
    row('068270', 'FAILED', 5, '2021-07-02', 'KIS 500 EGW00201 5회 — reset 없이는 재개 제외'),
    row('207940', 'PAUSED', 1, '2020-01-15', '윈도우 상한 도달'),
    row('012345', 'EXHAUSTED', 1, '2018-05-02', 'KIS 가 더 과거를 주지 않음'),
    row('000020', 'PENDING', 0, null),
  ];
}

export const CHECKPOINT_SUMMARY = {
  DONE: 2_403,
  IN_PROGRESS: 1,
  FAILED: 3,
  PAUSED: 1,
  EXHAUSTED: 27,
  PENDING: 296,
};

// ── stats health (스케줄러 20행 + manualTrigger 15행) ────────────────────

type SchedulerSeed = {
  lockName: string;
  displayName: string;
  cron: string | null;
  lockedAt: string | null;
  intervalSeconds: number | null;
  state: SchedulerHealthState;
  manualTrigger: ManualTrigger | null;
};

const DAY = 86_400;

function schedulerSeeds(today: string): SchedulerSeed[] {
  const d = (n: number) => shiftDate(today, -n);
  const stock = (...jobTypes: string[]): ManualTrigger => ({ module: 'STOCK', jobTypes });
  const advisor = (...jobTypes: string[]): ManualTrigger => ({ module: 'ADVISOR', jobTypes });
  return [
    {
      lockName: 'PUBLIC-IP-TEST',
      displayName: '공인 IP 변경 감지',
      cron: '0 */10 * * * *',
      lockedAt: atKst(today, '09:10'),
      intervalSeconds: 600,
      state: 'OK',
      manualTrigger: null,
    },
    {
      lockName: 'HOTDEAL-TEST',
      displayName: '핫딜 수집',
      cron: '0 */10 * * * *',
      lockedAt: atKst(today, '09:10'),
      intervalSeconds: 600,
      state: 'OK',
      manualTrigger: null,
    },
    {
      lockName: 'LOG-CLEANER-TEST',
      displayName: '로그 정리',
      cron: '0 0 4 * * *',
      lockedAt: atKst(today, '04:00'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: null,
    },
    {
      lockName: 'JIRA-TEST',
      displayName: 'Jira 이슈 수집',
      cron: '0 0 * * * *',
      lockedAt: atKst(today, '09:00'),
      intervalSeconds: 3600,
      state: 'OK',
      manualTrigger: null,
    },
    {
      lockName: 'CLAUDE-TEST',
      displayName: 'Claude 토큰 갱신',
      cron: '0 5 6 * * ?, 0 5 11 * * ?, 0 5 16 * * ?',
      lockedAt: atKst(today, '06:05'),
      intervalSeconds: 5 * 3600,
      state: 'OK',
      manualTrigger: null,
    },
    {
      lockName: 'STOCK-MASTER-TEST',
      displayName: '주식 마스터·휴장일 갱신',
      cron: '0 30 5 * * MON-FRI',
      lockedAt: atKst(today, '05:30'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: stock('MASTER', 'HOLIDAY'),
    },
    {
      lockName: 'STOCK-DAILY-TEST',
      displayName: '주식 일일 증분 수집',
      cron: '0 30 18 * * MON-FRI',
      lockedAt: atKst(today, '18:30'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: stock('DAILY'),
    },
    {
      lockName: 'STOCK-OVERSEAS-TEST',
      displayName: '해외 지표 증분 수집',
      cron: '0 30 6 * * TUE-SAT',
      lockedAt: atKst(today, '06:30'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: stock('OVERSEAS_DAILY'),
    },
    {
      lockName: 'STOCK-MACRO-TEST',
      displayName: '거시 위험 지표 수집(VIX·미국 국채)',
      cron: '0 35 6,8 * * TUE-SAT',
      lockedAt: null,
      intervalSeconds: 2 * 3600,
      state: 'DISABLED',
      manualTrigger: stock('MACRO'),
    },
    {
      lockName: 'STOCK-EVENTFEED-AM-TEST',
      displayName: '사건 피드 수집(아침 시계열)',
      cron: '0 40 6 * * TUE-SAT',
      lockedAt: null,
      intervalSeconds: DAY,
      state: 'DISABLED',
      manualTrigger: stock('NEWS'),
    },
    {
      lockName: 'STOCK-EVENTFEED-PM-TEST',
      displayName: '사건 피드 수집(저녁 헤드라인)',
      cron: '0 20 19 * * MON-FRI',
      lockedAt: null,
      intervalSeconds: DAY,
      state: 'DISABLED',
      manualTrigger: stock('NEWS'),
    },
    {
      lockName: 'STOCK-WEEKLY-TEST',
      displayName: '주식 주간 수집(기업행사·계수·재무)',
      cron: '0 0 3 * * SUN',
      lockedAt: atKst(d(10), '03:00'),
      intervalSeconds: 7 * DAY,
      state: 'STALE',
      manualTrigger: stock('WEEKLY'),
    },
    {
      lockName: 'ADVISOR-ADVISE-TEST',
      displayName: 'AI 일일 시장 판단',
      cron: '0 30 19 * * MON-FRI',
      lockedAt: atKst(today, '19:30'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: advisor('ADVISE'),
    },
    {
      lockName: 'ADVISOR-INTRADAY-TEST',
      displayName: 'AI 장중 점검',
      cron: '0 0 12 * * MON-FRI',
      lockedAt: atKst(today, '12:00'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: advisor('INTRADAY'),
    },
    {
      lockName: 'ADVISOR-MORNING-CHECK-TEST',
      displayName: 'AI 아침 해외 반영 점검',
      cron: '0 30 7 * * MON-FRI',
      lockedAt: atKst(today, '07:30'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: advisor('MORNING_CHECK'),
    },
    {
      lockName: 'ADVISOR-MORNING-ADVISE-TEST',
      displayName: 'AI 아침 재판정',
      cron: '0 40 7 * * MON-FRI',
      lockedAt: atKst(today, '07:40'),
      intervalSeconds: DAY,
      state: 'OK',
      manualTrigger: advisor('MORNING_ADVISE'),
    },
    {
      lockName: 'ADVISOR-H20-ADVISE-TEST',
      displayName: 'AI 주간 20거래일 판단',
      cron: '0 10 20 * * FRI',
      lockedAt: atKst(d(6), '20:10'),
      intervalSeconds: 7 * DAY,
      state: 'OK',
      manualTrigger: advisor('ADVISE_H20'),
    },
    {
      lockName: 'ADVISOR-H60-ADVISE-TEST',
      displayName: 'AI 60거래일 규칙 추천(격주)',
      cron: '0 20 20 * * FRI',
      lockedAt: atKst(d(6), '20:20'),
      intervalSeconds: 7 * DAY,
      state: 'OK',
      manualTrigger: advisor('ADVISE_H60'),
    },
    {
      lockName: 'ADVISOR-H180-ADVISE-TEST',
      displayName: 'AI 180거래일 규칙 추천(월초)',
      cron: '0 30 20 1 * *',
      lockedAt: null,
      intervalSeconds: 28 * DAY,
      state: 'NEVER_RUN',
      manualTrigger: advisor('ADVISE_H180'),
    },
    {
      lockName: 'ADVISOR-WEEKLY-REVIEW-TEST',
      displayName: 'AI 주간 검토(가중치·교훈·보고)',
      cron: '0 0 8 * * SUN',
      lockedAt: null,
      intervalSeconds: 7 * DAY,
      state: 'NEVER_RUN',
      manualTrigger: advisor('WEEKLY_REVIEW'),
    },
  ];
}

export function seedHealth(today: string): HealthStats {
  const windowTo = atKst(today, '09:15');
  const schedulers: SchedulerStatus[] = schedulerSeeds(today).map((seed) => ({
    lockName: seed.lockName,
    displayName: seed.displayName,
    cronExpression: seed.cron,
    lockedAt: seed.lockedAt,
    lockUntil: null,
    lockedBy: seed.lockedAt ? 'mock-host' : null,
    expectedIntervalSeconds: seed.intervalSeconds,
    secondsSinceLockedAt: seed.lockedAt
      ? Math.max(
          0,
          Math.round((new Date(windowTo).getTime() - new Date(seed.lockedAt).getTime()) / 1000),
        )
      : null,
    state: seed.state,
    manualTrigger: seed.manualTrigger,
  }));
  return {
    windowFrom: plusMs(windowTo, -24 * 3600 * 1000),
    windowTo,
    windowHours: 24,
    recentRequestCount: 12_400,
    recentErrorCount: 0,
    recentErrorRate: 0,
    previousRequestCount: 11_900,
    previousErrorCount: 2,
    previousErrorRate: 0.02,
    errorCountDeltaPercent: -100,
    recentErrors: [],
    slowEndpoints: [],
    schedulers,
    externalApiFailures: [],
  };
}

// ── KPI · 가중치 · 교훈 · 채팅 (M4 가 소비, 모양만 실물과 맞춘다) ───────────

/** 판정 불가 라벨(`AdvisorKpiService.UNJUDGEABLE_LABEL`) — learn=false 호라이즌 종류(H60·H180)만. */
const UNJUDGEABLE_LABEL = '판정 불가: 표본 부족, 2년 이상 필요';

/**
 * KPI 요약 — kind·horizon 은 응답 필드만 바꾼다(수치는 DAILY 모양 그대로). H60·H180 은 verdictLabel 을 싣는다.
 * horizon 생략은 종류의 결정 호라이즌(백엔드 `horizonOf`).
 */
export function seedScoreSummary(
  today: string,
  kind: AdviceKind = 'DAILY',
  horizon: number | null = null,
): ScoreSummaryResponse {
  const verdictLabel = kind === 'H60' || kind === 'H180' ? UNJUDGEABLE_LABEL : null;
  const base = seedDailyScoreSummary(today);
  return {
    ...base,
    kind,
    horizonDays: horizon ?? KIND_HORIZON[kind],
    variants: base.variants.map((variant) => ({ ...variant, verdictLabel })),
  };
}

/** 아침 재판정 대응 비교 — 트리거일 8일·비트리거일 14일. */
export function seedMorningVsDaily(today: string): MorningVsDailyResponse {
  return {
    from: shiftDate(today, -90),
    to: today,
    horizonDays: 5,
    all: { n: 22, meanDiff: 0.0011, seDiff: 0.0009, t: 1.22 },
    triggered: { n: 8, meanDiff: 0.0034, seDiff: 0.0014, t: 2.43 },
    untriggered: { n: 14, meanDiff: -0.0002, seDiff: 0.0011, t: -0.18 },
    pairs: [],
  };
}

function seedDailyScoreSummary(today: string): ScoreSummaryResponse {
  return {
    from: shiftDate(today, -90),
    to: today,
    horizonDays: 5,
    variants: [
      {
        variant: 'LIVE',
        advices: 62,
        picks: 410,
        hitRate: 0.54,
        meanExcess: 0.0041,
        seExcess: 0.0018,
        meanCostAdj: 0.0029,
        poolMeanExcess: 0.0012,
        valueAdd: 0.0029,
        avoidMeanExcess: -0.0021,
        avoidPicks: 88,
      },
      {
        variant: 'QUANT_TOPN',
        advices: 62,
        picks: 620,
        hitRate: 0.52,
        meanExcess: 0.0018,
        seExcess: 0.0015,
        meanCostAdj: 0.0006,
        poolMeanExcess: 0.0012,
        valueAdd: 0.0006,
        avoidMeanExcess: null,
        avoidPicks: 0,
      },
      {
        variant: 'LLM_NOMEM',
        advices: 62,
        picks: 402,
        hitRate: 0.53,
        meanExcess: 0.0033,
        seExcess: 0.0019,
        meanCostAdj: 0.0021,
        poolMeanExcess: 0.0012,
        valueAdd: 0.0021,
        avoidMeanExcess: -0.0011,
        avoidPicks: 80,
      },
      {
        variant: 'LLM_NONEWS',
        advices: 40,
        picks: 260,
        hitRate: 0.53,
        meanExcess: 0.0035,
        seExcess: 0.0022,
        meanCostAdj: 0.0023,
        poolMeanExcess: 0.0012,
        valueAdd: 0.0023,
        avoidMeanExcess: -0.0015,
        avoidPicks: 52,
      },
    ],
    regime: { calls: 62, hitRate: 0.58, meanBrier: 0.238, brierSkill: 0.048 },
    calibration: [
      { conviction: 0.55, n: 120, hitRate: 0.51, meanExcess: 0.0012 },
      { conviction: 0.65, n: 180, hitRate: 0.55, meanExcess: 0.0044 },
      { conviction: 0.75, n: 90, hitRate: 0.59, meanExcess: 0.0071 },
      { conviction: 0.85, n: 20, hitRate: 0.6, meanExcess: 0.009 },
    ],
    recent: Array.from({ length: 10 }, (_, i) => ({
      baseDate: shiftDate(today, -6 - i),
      ticker: ['005930', '000660', '035420', '068270', '207940'][i % 5] as string,
      stockName: ['삼성전자', 'SK하이닉스', 'NAVER', '셀트리온', '삼성바이오로직스'][
        i % 5
      ] as string,
      conviction: 0.55 + (i % 4) * 0.1,
      excess: (i % 3 === 0 ? -1 : 1) * (0.004 + i * 0.001),
      hit: i % 3 !== 0,
    })),
    note: '판정은 최소 6개월 뒤(승률 55% 검정 ≈620 독립 관측, 초과수익 0.5% 검출 ≈400). 부가가치 = 픽 − 후보군 평균이 LLM 층의 1차 KPI',
  };
}

const SIGNALS = [
  'MOM_20D',
  'MOM_60D',
  'TREND_MA',
  'NEAR_HIGH_52W',
  'TV_SURGE',
  'FOREIGN_FLOW',
  'INST_FLOW',
  'SECTOR_STRENGTH',
  'RS_INDEX',
  'VALUE_RANK',
  'VOL_20D',
];

export function seedIc(): Record<string, import('../../src/types/quant').IcStat> {
  const result: Record<string, import('../../src/types/quant').IcStat> = {};
  SIGNALS.filter((s) => s !== 'VALUE_RANK').forEach((signalCode, i) => {
    const mean = 0.01 + (i % 4) * 0.008 - (i === 9 ? 0.03 : 0);
    const se = 0.006;
    result[signalCode] = { signalCode, nDays: 250, nEff: 50, mean, se, tStat: mean / se };
  });
  return result;
}

export function seedWeightSets(today: string): WeightSet[] {
  const set = (
    weightSetId: number,
    asOf: string,
    source: WeightSet['source'],
    active: boolean,
    runId: number | null,
    horizonDays = 5,
  ): WeightSet => ({
    weightSetId,
    asOf,
    windowDays: 250,
    nEff: 50,
    source,
    active,
    reason: source === 'SEED' ? '설계 사전값' : `주간 IC 갱신 (${asOf})`,
    runId,
    horizonDays,
    weights: SIGNALS.map((signalCode, i) => {
      const baseWeight = [0.12, 0.1, 0.12, 0.1, 0.1, 0.12, 0.08, 0.1, 0.08, 0.05, 0.03][
        i
      ] as number;
      const multiplier = source === 'SEED' ? 1 : 0.8 + (i % 5) * 0.1;
      return {
        signalCode,
        baseWeight,
        multiplier,
        weight: baseWeight * multiplier,
        enabled: true,
        icMean: signalCode === 'VALUE_RANK' ? null : 0.012 + (i % 3) * 0.005,
        icSe: signalCode === 'VALUE_RANK' ? null : 0.006,
        tStat: signalCode === 'VALUE_RANK' ? null : 2.1 + (i % 3) * 0.4,
        nDays: signalCode === 'VALUE_RANK' ? null : 250,
        flagged: signalCode === 'VOL_20D',
        note: signalCode === 'VOL_20D' ? '음의 IC — 하한 적용' : null,
      };
    }),
  });
  return [
    set(12, shiftDate(today, -6), 'WEEKLY', true, 485),
    set(11, shiftDate(today, -13), 'WEEKLY', false, 470),
    set(1, shiftDate(today, -60), 'SEED', false, null),
    set(20, shiftDate(today, -6), 'BACKFILL', true, 486, 20),
  ];
}

export function seedLessons(today: string): LessonRow[] {
  const createdAt = atKst(shiftDate(today, -6), '08:05');
  return [
    {
      lessonId: 1,
      status: 'CANDIDATE',
      scope: 'REGIME',
      condition: { regimeCode: 'RISK_OFF' },
      observation: 'RISK_OFF 국면에서 고확신 픽의 초과수익이 음수(n=18)',
      evidence: { n: 18, meanExcess: -0.006 },
      rule: 'RISK_OFF 에서는 conviction 0.75 이상을 내지 않는다',
      lessonText: '위험 회피 국면에서는 고확신 픽을 자제한다',
      appliedCount: 0,
      postNApplied: null,
      postExcessApplied: null,
      postNNotApplied: null,
      postExcessNotApplied: null,
      activatedAt: null,
      retiredAt: null,
      retiredReason: null,
      model: MODEL,
      runId: 485,
      createdAt,
    },
  ];
}
