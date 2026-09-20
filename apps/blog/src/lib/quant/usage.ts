/**
 * LLM 사용량 집계 — advisor run 목록(`AdvisorRunResponse[]`)을 오늘/7일/30일 합계와 일별 토큰 시계열로 접는다.
 * React 무의존 순수 함수(vitest node 환경).
 *
 * 원천이 run 단위인 이유: `tb_api_log` 에는 모델·토큰 컬럼이 없어 `tb_advisor_run` 의 토큰 합이 유일한 원천이다
 * (PLAN "후속" 절 — 서버 일별 집계 API 는 범위 밖). 그래서 KPI 탭이 `runs(limit 500)` 을 받아 여기서 접는다.
 *
 * 날짜 버킷은 **KST**(`kstDateOf`) — `startedAt` 은 UTC Instant 라 그대로 slice 하면 저녁 19:30 ADVISE 가 전날로 밀린다.
 * 1차 지표는 토큰·호출 수다 — `costUsd` 는 `advisor.cost.*` 단가가 0 이면 항상 0 이라 합이 0 이면 "단가 미설정" 으로 읽는다.
 */
import type { SparkPoint } from '../chartScale';
import { kstDateOf } from './kstDate';

/** 집계에 필요한 run 필드만 — 테스트 픽스처를 얇게 두고 다른 모양(채팅 행)에도 재사용할 수 있게. */
export type UsageRun = {
  startedAt: string;
  llmCalls: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  costUsd: number | string | null;
};

export type UsageTotals = {
  llmCalls: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  /** BigDecimal 문자열·null 을 숫자로 접은 합. 단가 미설정 환경은 0 이다. */
  costUsd: number;
};

export type UsageWindow = 'today' | 'week' | 'month';

/** 창 길이(일). today 를 포함해 뒤로 N일 — week 는 [today-6, today]. */
export const USAGE_WINDOW_DAYS: Record<UsageWindow, number> = { today: 1, week: 7, month: 30 };

export const USAGE_WINDOW_LABEL: Record<UsageWindow, string> = {
  today: '오늘',
  week: '7일',
  month: '30일',
};

const EMPTY_TOTALS: UsageTotals = {
  llmCalls: 0,
  promptTokens: 0,
  completionTokens: 0,
  reasoningTokens: 0,
  cachedTokens: 0,
  costUsd: 0,
};

/** `YYYY-MM-DD` ± n일. UTC 정오 기준으로 더해 DST·타임존 경계를 피한다(픽스처의 shiftDate 와 같은 기법). */
export function addDays(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** 창의 시작일 — `days` 일 창이 `today` 를 포함하도록 `today - (days - 1)`. */
export function windowStart(today: string, days: number): string {
  return addDays(today, -(Math.max(1, days) - 1));
}

/** costUsd 는 number·문자열·null 이 섞여 온다 — 숫자가 아니면 0. */
function costOf(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const cost = Number(value);
  return Number.isFinite(cost) ? cost : 0;
}

function add(total: UsageTotals, run: UsageRun): UsageTotals {
  return {
    llmCalls: total.llmCalls + (run.llmCalls ?? 0),
    promptTokens: total.promptTokens + (run.promptTokens ?? 0),
    completionTokens: total.completionTokens + (run.completionTokens ?? 0),
    reasoningTokens: total.reasoningTokens + (run.reasoningTokens ?? 0),
    cachedTokens: total.cachedTokens + (run.cachedTokens ?? 0),
    costUsd: total.costUsd + costOf(run.costUsd),
  };
}

/** `[from, to]`(KST 날짜, 양끝 포함) 안의 run 합계. startedAt 을 파싱할 수 없는 행은 건너뛴다. */
export function sumUsage(runs: readonly UsageRun[], from: string, to: string): UsageTotals {
  let total = EMPTY_TOTALS;
  for (const run of runs) {
    const day = kstDateOf(run.startedAt);
    if (day === null || day < from || day > to) continue;
    total = add(total, run);
  }
  return total;
}

/** 오늘/7일/30일 세 창의 합계 — 타일 3개의 재료. */
export function summarizeUsage(
  runs: readonly UsageRun[],
  today: string,
): Record<UsageWindow, UsageTotals> {
  return {
    today: sumUsage(runs, today, today),
    week: sumUsage(runs, windowStart(today, USAGE_WINDOW_DAYS.week), today),
    month: sumUsage(runs, windowStart(today, USAGE_WINDOW_DAYS.month), today),
  };
}

/** 입력 + 출력 토큰 — 1차 지표. 추론·캐시는 보조 표기라 합에 넣지 않는다(추론은 출력에 이미 포함된 모델이 있다). */
export function totalTokens(totals: UsageTotals): number {
  return totals.promptTokens + totals.completionTokens;
}

/** 단가가 설정돼 비용이 계산된 환경인지 — 합이 0 이면 "단가 미설정" 으로 표기한다. */
export function hasCostPricing(totals: UsageTotals): boolean {
  return totals.costUsd > 0;
}

/**
 * 일별 토큰(입력+출력) 시계열 — 스파크라인 재료. 오래된 날부터 `days` 개, 없는 날은 0 으로 채운다
 * (빈 날을 빼면 선이 압축돼 "매일 비슷하다"로 오독된다).
 */
export function dailyTokenSeries(
  runs: readonly UsageRun[],
  today: string,
  days: number,
): SparkPoint[] {
  const length = Math.max(1, days);
  const start = windowStart(today, length);
  const bucket = new Map<string, number>();
  for (const run of runs) {
    const day = kstDateOf(run.startedAt);
    if (day === null || day < start || day > today) continue;
    // 토큰 필드는 int 지만 옛 run·부분 응답은 비어 올 수 있다 — NaN 이 한 점이라도 섞이면 스파크라인 전체가 사라진다
    bucket.set(day, (bucket.get(day) ?? 0) + (run.promptTokens ?? 0) + (run.completionTokens ?? 0));
  }
  const points: SparkPoint[] = [];
  for (let offset = 0; offset < length; offset += 1) {
    const day = addDays(start, offset);
    points.push({ label: day, value: bucket.get(day) ?? 0 });
  }
  return points;
}
