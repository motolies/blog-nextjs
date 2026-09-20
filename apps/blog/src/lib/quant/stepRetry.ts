/**
 * 재시도 의미 정의 — PLAN "재시도 의미 정의" 표의 코드 정본. 순수 함수라 vitest 로 못 박는다.
 *
 * 세 가지를 담당한다.
 *  1. 파이프라인 **단계 → 개별 잡** 매핑(`planStepRetry`). 정본은 `claudedocs/stock-collect.md:193` +
 *     잡 본문 대조. 함정: 파이프라인 단계가 부르는 `collectRecent(...)` 와 개별 잡의 `execute()` 진입점이
 *     같은 메서드가 아니다 — 개별 잡은 요청이 비면 `kis.backfill.start-date` 부터의 전체 백필로 해석한다.
 *     그래서 INDEX·PRICE·CA_HINT 는 **대응 없음(null)** 이다(다음 DAILY 자동 복구).
 *  2. 종료 run → **같은 인자 재실행** 복원(`restoreBackfillRequest`). `metadata` 는 `BackfillRequest.toMetadata()`
 *     요약이고 `tickers` 는 20개까지만 저장된다 → `tickerCount > 20` 이면 복원 불가(null).
 *  3. advisor 재실행 인자(`advisorRerunArgs`). 원 run 의 `metadata.requested` 를 재현한다 — 스케줄 run 을
 *     `?baseDate=` 붙여 재실행하면 IC_BACKFILL 시작일 결정이 바뀌어 다른 잡이 된다.
 */
import type {
  AdvisorRunResponse,
  BackfillRequest,
  CollectJobType,
  CollectRunResponse,
} from '../../types/quant';
import type { PipelineStep } from './steps';

type StepTarget = {
  jobType: CollectJobType;
  /** 개별 잡이 `request()` 에서 읽는 필드만 담는다. run 정보로 만든다. */
  body: (run: Pick<CollectRunResponse, 'targetDate'>) => BackfillRequest;
  /** VALUATION 처럼 당일 스냅샷만 의미 있는 잡 — `targetDate !== today` 면 비활성. */
  todayOnly?: boolean;
  /** 문서에 명시되지 않아 잡 본문 대조로만 확인한 매핑 — confirm 문구에 표기한다. */
  inferred?: boolean;
};

const EMPTY_BODY = (): BackfillRequest => ({});

/**
 * 단계 → 잡. `null` 은 개별 재실행 대상이 아니다(사유는 `STEP_UNAVAILABLE_REASON`).
 * DERIVED_REFRESH 는 body 없음 = `refreshAll` 증분, `{force:true}` = 지표 전체 재계산(문서 명시).
 */
export const STEP_RETRY_TARGET: Record<PipelineStep, StepTarget | null> = {
  // ── DAILY ──
  INDEX: null,
  PRICE: null,
  VALUATION: {
    jobType: 'VALUATION',
    body: (run) => (run.targetDate ? { endDate: run.targetDate } : {}),
    todayOnly: true,
  },
  INVESTOR: { jobType: 'INVESTOR_BACKFILL', body: EMPTY_BODY },
  MARKET_INVESTOR: { jobType: 'MARKET_INVESTOR_BACKFILL', body: EMPTY_BODY },
  ETF_NAV: { jobType: 'ETF_NAV_BACKFILL', body: EMPTY_BODY },
  STATS: { jobType: 'MARKET_STAT', body: EMPTY_BODY },
  CA_HINT: null,
  VALIDATE: { jobType: 'VALIDATE', body: EMPTY_BODY },
  DERIVED: { jobType: 'DERIVED_REFRESH', body: EMPTY_BODY },
  // ── WEEKLY ──
  CORP_ACTION: { jobType: 'CORP_ACTION', body: EMPTY_BODY, inferred: true },
  STOCK_INFO: { jobType: 'STOCK_INFO', body: EMPTY_BODY, inferred: true },
  ADJUST_FACTOR: { jobType: 'ADJUST_FACTOR', body: EMPTY_BODY, inferred: true },
  FINANCIAL: { jobType: 'FINANCIAL_BACKFILL', body: EMPTY_BODY, inferred: true },
  DERIVED_FULL: { jobType: 'DERIVED_REFRESH', body: () => ({ force: true }) },
};

/** 대응 잡이 없는 단계의 안내 — 버튼 `disabled` + title 에 그대로 쓴다. */
export const STEP_UNAVAILABLE_REASON: Record<string, string> = {
  INDEX:
    'DAILY 재실행으로 복구 — INDEX_BACKFILL 은 체크포인트 전체 백필이라 단계 재실행 대상이 아닙니다',
  PRICE: '다음 DAILY 에서 자동 복구 — 2일 이상 결손만 RELOAD {tickers, startDate} 로 채웁니다',
  CA_HINT: '다음 DAILY 에서 자동 복구',
};

export type StepRetryPlan =
  | {
      available: true;
      step: string;
      jobType: CollectJobType;
      body: BackfillRequest;
      /** confirm 문구 — "VALUATION 단계 → VALUATION 잡 · 대상일 2026-09-19" */
      summary: string;
      inferred: boolean;
    }
  | { available: false; step: string; reason: string };

/**
 * 단계 재실행 계획. `today` 는 KST `YYYY-MM-DD`(`kstDate.ts#todayKst`).
 * 모르는 단계(백엔드가 단계를 추가한 경우)는 대응 없음으로 닫는다 — 잘못된 잡을 권하는 것보다 낫다.
 */
export function planStepRetry(
  step: string,
  run: Pick<CollectRunResponse, 'targetDate'>,
  today: string,
): StepRetryPlan {
  const target = (STEP_RETRY_TARGET as Record<string, StepTarget | null | undefined>)[step];
  if (target === undefined) {
    return { available: false, step, reason: '대응하는 개별 잡이 없습니다' };
  }
  if (target === null) {
    return { available: false, step, reason: STEP_UNAVAILABLE_REASON[step] ?? '대응 잡 없음' };
  }
  if (target.todayOnly && run.targetDate !== today) {
    return {
      available: false,
      step,
      reason: `당일 한정 — 대상일(${run.targetDate ?? '없음'})이 오늘(${today})이 아닙니다`,
    };
  }
  const body = target.body(run);
  const dateNote = body.endDate ? ` · 대상일 ${body.endDate}` : '';
  const forceNote = body.force ? ' · force(전체 재계산)' : '';
  return {
    available: true,
    step,
    jobType: target.jobType,
    body,
    summary: `${step} 단계 → ${target.jobType} 잡${dateNote}${forceNote}`,
    inferred: target.inferred === true,
  };
}

/** `toMetadata()` 가 남긴 `tickerCount` 상한 — 이 수를 넘으면 목록이 절단돼 복원할 수 없다. */
export const TICKERS_SAVED_MAX = 20;

/**
 * 종료 run 의 metadata 에서 `BackfillRequest` 를 복원한다.
 * `resetCheckpoint` 는 복원하지 **않는다** — 처음부터 다시 받는 결정은 액션 바의 Switch 로 매번 명시한다.
 * `tickerCount > 20` 이면 null(재실행 버튼 비활성 + "수동 실행 탭에서 종목 재지정").
 */
export function restoreBackfillRequest(
  run: Pick<CollectRunResponse, 'metadata'>,
): BackfillRequest | null {
  const meta = run.metadata ?? {};
  const tickerCount = typeof meta.tickerCount === 'number' ? meta.tickerCount : 0;
  if (tickerCount > TICKERS_SAVED_MAX) return null;

  const body: BackfillRequest = {};
  if (typeof meta.startDate === 'string') body.startDate = meta.startDate;
  if (typeof meta.endDate === 'string') body.endDate = meta.endDate;
  if (typeof meta.tickerFrom === 'string') body.tickerFrom = meta.tickerFrom;
  if (typeof meta.tickerTo === 'string') body.tickerTo = meta.tickerTo;
  if (Array.isArray(meta.tickers) && meta.tickers.length > 0) {
    body.tickers = meta.tickers.filter((t): t is string => typeof t === 'string');
  }
  if (Array.isArray(meta.indexCodes) && meta.indexCodes.length > 0) {
    body.indexCodes = meta.indexCodes.filter((c): c is string => typeof c === 'string');
  }
  if (meta.force === true) body.force = true;
  return body;
}

/** 종목이 20개를 넘어 재실행 인자를 복원할 수 없는 run 인지 — 버튼 비활성 사유의 판정. */
export function isTickersTruncated(run: Pick<CollectRunResponse, 'metadata'>): boolean {
  const count = run.metadata?.tickerCount;
  return typeof count === 'number' && count > TICKERS_SAVED_MAX;
}

/** confirm 문구용 인자 요약 — "기간 2026-01-01~2026-09-19 · 종목 5개 · force". 비면 "인자 없음(기본값)". */
export function describeBackfillRequest(body: BackfillRequest): string {
  const parts: string[] = [];
  if (body.startDate || body.endDate) {
    parts.push(`기간 ${body.startDate ?? '기본'}~${body.endDate ?? '오늘'}`);
  }
  if (body.tickerFrom || body.tickerTo) {
    parts.push(`종목 범위 ${body.tickerFrom ?? ''}~${body.tickerTo ?? ''}`);
  }
  if (body.tickers && body.tickers.length > 0) parts.push(`종목 ${body.tickers.length}개`);
  if (body.indexCodes && body.indexCodes.length > 0) {
    parts.push(`지수 ${body.indexCodes.join(',')}`);
  }
  if (body.force) parts.push('force');
  if (body.resetCheckpoint) parts.push('체크포인트 초기화');
  return parts.length > 0 ? parts.join(' · ') : '인자 없음(기본값)';
}

/**
 * advisor 재실행 인자. `requested === false`(스케줄 run 또는 baseDate 없이 API) 이고 `baseDate === today` 면
 * baseDate 를 생략한다(오늘 기준 = 원 run 과 같은 의미). 그 외에는 `?baseDate={run.baseDate}` 로 그날을 고정한다.
 * `requested` 가 없는 옛 run(metadata 없음)은 날짜를 고정하는 쪽이 안전하다 — 어제 run 을 오늘로 돌리면 다른 판단이 된다.
 */
export function advisorRerunArgs(
  run: Pick<AdvisorRunResponse, 'baseDate' | 'metadata'>,
  today: string,
): { baseDate?: string } {
  const requested = run.metadata?.requested;
  if (requested === false && run.baseDate === today) return {};
  return run.baseDate ? { baseDate: run.baseDate } : {};
}
