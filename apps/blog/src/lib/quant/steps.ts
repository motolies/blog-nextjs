/**
 * `metadata.steps[]` 읽기 — 파이프라인 run(DAILY·WEEKLY)의 단계 배열을 안전하게 꺼내고 요약한다.
 *
 * metadata 는 `Map<String,Object>` 라 모양 보장이 없다 — 배열이 아니거나 항목에 `step` 이 없으면 빈 배열로 본다.
 * BACKFILL_ALL 의 하위 run 항목(`{step, runId, status: CollectStatus, rows, apiCalls, apiFails, ms}`)도 같은 배열에 들어오므로
 * 성공 판정은 `OK` 와 `SUCCESS` 를 함께 본다.
 */
import type { RunStep } from '@/types/quant';

/** DAILY 단계 순서 (`StockDailyPipelineJob`). 표시 정렬이 아니라 재시도 표의 참조용이다. */
export const DAILY_STEPS = [
  'INDEX',
  'PRICE',
  'VALUATION',
  'INVESTOR',
  'MARKET_INVESTOR',
  'ETF_NAV',
  'STATS',
  'CA_HINT',
  'VALIDATE',
  'DERIVED',
] as const;

/** WEEKLY 단계 순서 (`StockWeeklyPipelineJob`). */
export const WEEKLY_STEPS = [
  'CORP_ACTION',
  'STOCK_INFO',
  'ADJUST_FACTOR',
  'FINANCIAL',
  'DERIVED_FULL',
] as const;

export type PipelineStep = (typeof DAILY_STEPS)[number] | (typeof WEEKLY_STEPS)[number];

/** metadata 에서 steps[] 를 꺼낸다. 없거나 모양이 다르면 빈 배열. */
export function stepsOf(metadata: Record<string, unknown> | null | undefined): RunStep[] {
  const raw = metadata?.steps;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is RunStep =>
      typeof item === 'object' && item !== null && typeof (item as RunStep).step === 'string',
  );
}

export function isStepOk(status: string): boolean {
  return status === 'OK' || status === 'SUCCESS';
}

export type StepSummary = {
  total: number;
  ok: number;
  failed: string[];
  skipped: string[];
  canceled: string[];
};

/** 세그먼트 스트립 아래 한 줄 요약의 재료 — "8/10 · 실패 VALUATION · 건너뜀 DERIVED". */
export function summarizeSteps(steps: readonly RunStep[]): StepSummary {
  const summary: StepSummary = {
    total: steps.length,
    ok: 0,
    failed: [],
    skipped: [],
    canceled: [],
  };
  for (const step of steps) {
    if (isStepOk(step.status)) summary.ok += 1;
    else if (step.status === 'FAILED') summary.failed.push(step.step);
    else if (step.status === 'SKIPPED') summary.skipped.push(step.step);
    else if (step.status === 'CANCELED') summary.canceled.push(step.step);
  }
  return summary;
}

/** 요약 문장. 전부 성공이면 "10/10 성공". */
export function describeStepSummary(summary: StepSummary): string {
  const parts = [`${summary.ok}/${summary.total} 성공`];
  if (summary.failed.length > 0) parts.push(`실패 ${summary.failed.join('·')}`);
  if (summary.skipped.length > 0) parts.push(`건너뜀 ${summary.skipped.join('·')}`);
  if (summary.canceled.length > 0) parts.push(`취소 ${summary.canceled.join('·')}`);
  return parts.join(' · ');
}

/**
 * 재실행 후보 단계 — **FAILED 만**.
 * SKIPPED 는 앞 단계 실패의 결과라 단독으로 돌리면 결손 위에 파생값을 쌓는다(PRICE 실패 → DERIVED SKIPPED 를
 * DERIVED_REFRESH 로 돌리면 빠진 가격 위에 지표를 계산한다). 화면은 SKIPPED 의 사유만 보여준다.
 * CANCELED 는 run 전체 재실행 대상이다.
 */
export function retryableSteps(steps: readonly RunStep[]): RunStep[] {
  return steps.filter((step) => step.status === 'FAILED');
}

/** 건너뛴 단계 — 재실행 메뉴에 사유만 표시한다(재실행 대상 아님). */
export function skippedSteps(steps: readonly RunStep[]): RunStep[] {
  return steps.filter((step) => step.status === 'SKIPPED');
}
