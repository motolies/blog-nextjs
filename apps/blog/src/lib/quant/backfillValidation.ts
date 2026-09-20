/**
 * 수동 실행 폼의 순수 로직 — 검증·파싱·confirm 문구·체크포인트 판정. React 무의존(vitest node).
 *
 * 검증 규칙은 백엔드 `BackfillRequest.validate()` 를 **검사 순서까지** 그대로 복제하고,
 * `PriceReloadJob` 의 "RELOAD 는 tickers 필수" 를 더한다. 이 프로젝트는 400 도 Slack 을 울리므로
 * 백엔드가 거절할 요청은 여기서 먼저 막아야 한다. 규칙을 고치면 두 저장소를 함께 고친다.
 *
 * 정본: `hvy-blog/.../stock/application/dto/BackfillRequest.java:77-105`,
 *       `.../service/PriceReloadJob.java:24`, `.../service/CollectCheckpointService.java:63-68`.
 */
import type { BackfillRequest, CollectJobType, CollectRunResponse } from '../../types/quant';
import { CHECKPOINT_STATUSES, type CheckpointStatus, COLLECT_JOB_TYPES } from '../../types/quant';
import { COLLECT_JOB_META, type JobMeta } from './jobCatalog';
import { isIsoDate } from './kstDate';
import { describeBackfillRequest } from './stepRetry';

/** 종목코드 — 백엔드 `TICKER` 패턴. 6자 영숫자(대문자). */
export const TICKER_PATTERN = /^[A-Z0-9]{6}$/;
/** 지수코드 — 백엔드 `INDEX_CODE` 패턴. 4자 숫자. */
export const INDEX_CODE_PATTERN = /^[0-9]{4}$/;
/** 백엔드 `MAX_TICKERS`. */
export const MAX_TICKERS = 5_000;
/**
 * `kis.backfill.max-attempts` 기본값 — 이 값 **이상**이면 `findResumable` 이 재개 대상에서 뺀다.
 * 화면에는 "reset 없이는 영구 제외" 로 표시한다(런북 3).
 */
export const CHECKPOINT_MAX_ATTEMPTS = 5;

/**
 * 체크포인트 네임스페이스를 쓰는 잡 — `CollectCheckpointService` 를 참조하는 수집 서비스 기준(2026-09-20).
 * 체크포인트 탭의 select 는 전체 23종을 허용하되 이 그룹을 앞에 둔다.
 */
export const CHECKPOINT_JOB_TYPES: readonly CollectJobType[] = [
  'PRICE_BACKFILL',
  'INDEX_BACKFILL',
  'INVESTOR_BACKFILL',
  'MARKET_INVESTOR_BACKFILL',
  'ETF_NAV_BACKFILL',
  'FINANCIAL_BACKFILL',
  'OVERSEAS_BACKFILL',
  'RELOAD',
];

/** `force` 가 실제로 바꾸는 동작 — 백엔드 Javadoc 이 명시한 두 잡만. 나머지는 읽지 않을 수 있다. */
export const FORCE_EFFECT: Partial<Record<CollectJobType, string>> = {
  DAILY: '휴장일 스킵 해제 — 휴장일에도 수집을 강행합니다',
  DERIVED_REFRESH: '지표 전체 재계산 — 증분이 아니라 전 기간을 다시 계산합니다(장시간)',
};

/** 폼 원문 값 — 목록 필드는 사용자가 친 문자열 그대로 두고 검증 시점에 파싱한다. */
export type BackfillFormValues = {
  startDate: string;
  endDate: string;
  tickerFrom: string;
  tickerTo: string;
  /** 종목 목록 원문 — 줄바꿈·쉼표·공백 구분 */
  tickers: string;
  /** 지수코드 원문 — 쉼표·공백 구분 */
  indexCodes: string;
  resetCheckpoint: boolean;
  force: boolean;
};

export const EMPTY_BACKFILL_FORM: BackfillFormValues = {
  startDate: '',
  endDate: '',
  tickerFrom: '',
  tickerTo: '',
  tickers: '',
  indexCodes: '',
  resetCheckpoint: false,
  force: false,
};

export type BackfillFieldErrors = Partial<Record<keyof BackfillFormValues, string>>;

export type BackfillValidation =
  | { ok: true; request: BackfillRequest; tickerCount: number }
  | { ok: false; errors: BackfillFieldErrors };

/**
 * 코드 목록 파싱 — 줄바꿈·쉼표·공백으로 나누고, 공백 제거·대문자 정규화·순서 유지 중복 제거.
 * 대문자화는 규칙 완화가 아니라 정규화다: 백엔드 패턴이 대문자만 받으므로 소문자 입력은 어차피 400 이다.
 */
export function parseCodeList(raw: string): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const token of raw.split(/[\s,]+/)) {
    const code = token.trim().toUpperCase();
    if (code === '' || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}

/** 형식 위반 표본 — 오류 문구에 전부 나열하면 5,000개가 될 수 있어 앞의 몇 개만 보인다. */
function invalidSample(codes: readonly string[], pattern: RegExp, max = 3): string[] {
  return codes.filter((code) => !pattern.test(code)).slice(0, max);
}

const DATE_FORMAT_ERROR = '날짜 형식은 YYYY-MM-DD 입니다';
const TICKER_FORMAT_ERROR = '종목코드 형식 오류(6자 영숫자)';

/**
 * 폼 검증 → 통과하면 전송용 `BackfillRequest`(빈 필드 제외, boolean 은 true 만).
 *
 * 순서는 백엔드 `validate()` 와 같다: 기간 역전 → tickers(개수·형식) → indexCodes 형식 →
 * tickerFrom/To 형식 → tickerFrom > tickerTo. 마지막으로 RELOAD 의 tickers 필수(PriceReloadJob).
 * 오류는 **필드별로 전부** 모은다 — v3 §ds-05 "못 채운 칸 전부에 동시에 표시".
 */
export function validateBackfillForm(
  values: BackfillFormValues,
  jobType: CollectJobType,
): BackfillValidation {
  const errors: BackfillFieldErrors = {};
  const startDate = values.startDate.trim();
  const endDate = values.endDate.trim();
  const tickerFrom = values.tickerFrom.trim().toUpperCase();
  const tickerTo = values.tickerTo.trim().toUpperCase();
  const tickers = parseCodeList(values.tickers);
  const indexCodes = parseCodeList(values.indexCodes);

  // 날짜 형식 — DatePicker 는 YYYY-MM-DD 또는 빈값만 남기지만, 붙여넣기·URL 경로를 위해 한 번 더 본다.
  if (startDate !== '' && !isIsoDate(startDate)) errors.startDate = DATE_FORMAT_ERROR;
  if (endDate !== '' && !isIsoDate(endDate)) errors.endDate = DATE_FORMAT_ERROR;
  // 1. startDate.isAfter(endDate) — ISO 문자열은 사전순 비교가 날짜순이다.
  if (!errors.startDate && !errors.endDate && startDate && endDate && startDate > endDate) {
    errors.endDate = '시작일이 종료일보다 늦습니다';
  }

  // 2. tickers — 개수 상한이 형식보다 먼저다(백엔드 순서). 5,000개를 넘으면 형식은 보지 않는다.
  if (tickers.length > MAX_TICKERS) {
    errors.tickers = `종목은 최대 ${MAX_TICKERS.toLocaleString('ko-KR')}개입니다 (현재 ${tickers.length.toLocaleString('ko-KR')}개)`;
  } else {
    const bad = invalidSample(tickers, TICKER_PATTERN);
    if (bad.length > 0) errors.tickers = `${TICKER_FORMAT_ERROR}: ${bad.join(', ')}`;
  }

  // 3. indexCodes 형식
  const badIndex = invalidSample(indexCodes, INDEX_CODE_PATTERN);
  if (badIndex.length > 0)
    errors.indexCodes = `지수코드 형식 오류(4자 숫자): ${badIndex.join(', ')}`;

  // 4. tickerFrom / tickerTo 형식
  if (tickerFrom !== '' && !TICKER_PATTERN.test(tickerFrom))
    errors.tickerFrom = TICKER_FORMAT_ERROR;
  if (tickerTo !== '' && !TICKER_PATTERN.test(tickerTo)) errors.tickerTo = TICKER_FORMAT_ERROR;
  // 5. tickerFrom.compareTo(tickerTo) > 0 — 6자 고정이라 JS 문자열 비교와 Java compareTo 결과가 같다.
  if (!errors.tickerFrom && !errors.tickerTo && tickerFrom && tickerTo && tickerFrom > tickerTo) {
    errors.tickerTo = '종목 범위 시작이 끝보다 큽니다';
  }

  // 6. RELOAD 는 tickers 필수 — 잡 본문(PriceReloadJob)이 던지는 400.
  if (jobType === 'RELOAD' && tickers.length === 0 && !errors.tickers) {
    errors.tickers = 'RELOAD 는 종목(tickers)을 지정해야 합니다';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const request: BackfillRequest = {};
  if (startDate) request.startDate = startDate;
  if (endDate) request.endDate = endDate;
  if (tickerFrom) request.tickerFrom = tickerFrom;
  if (tickerTo) request.tickerTo = tickerTo;
  if (tickers.length > 0) request.tickers = tickers;
  if (indexCodes.length > 0) request.indexCodes = indexCodes;
  if (values.resetCheckpoint) request.resetCheckpoint = true;
  if (values.force) request.force = true;
  return { ok: true, request, tickerCount: tickers.length };
}

/** URL `?job=`·`?cpJob=` 값을 허용 목록으로 해석한다. 모르는 값·없음은 null. */
export function resolveCollectJobType(value: string | null | undefined): CollectJobType | null {
  return value !== null &&
    value !== undefined &&
    (COLLECT_JOB_TYPES as readonly string[]).includes(value)
    ? (value as CollectJobType)
    : null;
}

/** URL `?cpStatus=` 값을 허용 목록으로 해석한다. 잘못된 값을 그대로 보내면 400(Slack) 이다. */
export function resolveCheckpointStatus(value: string | null | undefined): CheckpointStatus | null {
  return value !== null &&
    value !== undefined &&
    (CHECKPOINT_STATUSES as readonly string[]).includes(value)
    ? (value as CheckpointStatus)
    : null;
}

export function usesCheckpoint(jobType: string): boolean {
  return (CHECKPOINT_JOB_TYPES as readonly string[]).includes(jobType);
}

/** `force` 의 잡별 효과. null 이면 백엔드 문서상 force 를 읽는 잡이 아니다. */
export function forceEffectOf(jobType: CollectJobType): string | null {
  return FORCE_EFFECT[jobType] ?? null;
}

/** attemptCount 가 임계 이상 — `findResumable` 이 건너뛰므로 `resetCheckpoint` 없이는 재실행되지 않는다. */
export function isAttemptsExhausted(attemptCount: number): boolean {
  return attemptCount >= CHECKPOINT_MAX_ATTEMPTS;
}

type OccupyingRun = Pick<
  CollectRunResponse,
  'runId' | 'jobType' | 'jobDescription' | 'status' | 'triggerType'
>;

/** `kisBackfillExecutor` 의 대기열 상한(`TaskExecutorConfig` queue 10). 초과분은 400 + run FAILED. */
export const BACKFILL_QUEUE_CAPACITY = 10;

/**
 * 백필 실행기 점유 현황. 실행기는 core/max 1 이라 **가장 오래된 1개만 실제로 돌고 나머지는 대기열**이다 —
 * 하지만 run 행은 제출 시점에 RUNNING 으로 만들어져 대기 중인 것도 RUNNING 으로 보인다. 그래서 하나만 찾지 않고
 * 조건(API 트리거 + longRunning + RUNNING) run 을 **전부 세어** "실행 1 · 대기 n/10" 을 말한다.
 * 스케줄러 run 은 실행기를 타지 않는다(`StockCollectOrchestrator.trigger` 의 `async` 조건) → 세지 않는다.
 * 입력은 startedAt DESC 라 마지막 원소가 가장 오래된 = 실제 실행 중인 run 이다.
 */
export type BackfillOccupancy<T> = {
  /** 실제로 돌고 있는 run(가장 오래된 것). 점유 run 이 없으면 null. */
  executing: T | null;
  /** 대기열에 서 있는 run 수. */
  queued: number;
  /** 점유 run 전체(실행 1 + 대기). */
  total: number;
};

export function countOccupyingBackfillRuns<T extends OccupyingRun>(
  runs: readonly T[] | undefined,
): BackfillOccupancy<T> {
  const meta = COLLECT_JOB_META as Record<string, JobMeta | undefined>;
  const occupying = (runs ?? []).filter(
    (run) =>
      run.status === 'RUNNING' &&
      run.triggerType === 'API' &&
      meta[run.jobType]?.longRunning === true,
  );
  const executing = occupying.length > 0 ? (occupying[occupying.length - 1] ?? null) : null;
  return { executing, queued: Math.max(0, occupying.length - 1), total: occupying.length };
}

/**
 * 수동 실행 confirm 문구 — PLAN confirm 매트릭스: 잡·인자 요약·예상 소요·202/200·대기열·reset/force 경고.
 * 문장을 이어 붙인 한 덩어리다(RunDetailDialog 의 인라인 확인과 같은 형식).
 */
export function buildTriggerConfirmMessage(input: {
  jobType: CollectJobType;
  request: BackfillRequest;
  /** 실행기 점유 현황 — null 이면 비어 있다. 200 잡은 실행기를 타지 않으므로 대기열 문구를 넣지 않는다. */
  occupancy: BackfillOccupancy<Pick<CollectRunResponse, 'runId' | 'jobDescription'>> | null;
}): string {
  const { jobType, request, occupancy } = input;
  const meta = COLLECT_JOB_META[jobType];
  const parts = [`${meta.desc} (${jobType}) 을 실행합니다 — ${describeBackfillRequest(request)}.`];
  if (meta.longRunning) {
    parts.push(
      `백그라운드(202)로 제출되며 백필 실행기는 동시 1개 · 대기열 최대 ${BACKFILL_QUEUE_CAPACITY} 입니다.`,
    );
  } else {
    parts.push('동기(200)로 완료까지 기다립니다.');
  }
  if (meta.durationHint) parts.push(`예상 소요 ${meta.durationHint}.`);
  if (meta.longRunning && occupancy?.executing) {
    parts.push(
      `지금 ${occupancy.executing.jobDescription} run #${occupancy.executing.runId} 실행 중 · 대기 ${occupancy.queued}/${BACKFILL_QUEUE_CAPACITY} — 이 요청은 대기열 ${occupancy.queued + 1}번째로 들어갑니다.`,
    );
  }
  if (request.resetCheckpoint) {
    parts.push(
      `주의: 체크포인트를 초기화해 처음부터 다시 받습니다(attemptCount ${CHECKPOINT_MAX_ATTEMPTS} 이상으로 제외된 종목 포함).`,
    );
  }
  if (request.force) {
    parts.push(
      `주의: force — ${forceEffectOf(jobType) ?? '이 잡은 force 를 읽지 않을 수 있습니다'}.`,
    );
  }
  if (jobType === 'DAILY') parts.push('DAILY 는 오늘(KST) 기준 증분 수집입니다.');
  parts.push('같은 잡이 실행 중이면 409 로 거절됩니다.');
  return parts.join(' ');
}
