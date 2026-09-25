/**
 * Quant 화면 라우트·URL 상태 규약의 단일 진실.
 *
 * 모달 열림 상태는 URL 이 진실이다(`dialog.tsx` 규칙) — 409 토스트의 '열기'·운영 현황 세그먼트·Slack 딥링크가
 * 전부 같은 목적지(`?run=`)를 가져야 하므로 링크 생성을 한곳에 둔다.
 *
 * `?tab=` 값은 아래 상수가 정본이다. M3(수동 실행·체크포인트)·M4(판단·KPI·가중치)가 같은 값을 쓴다.
 */
import type { RunModule } from '../../types/quant';

export const QUANT_ROUTES = {
  overview: '/admin/quant',
  collect: '/admin/quant/collect',
  advisor: '/admin/quant/advisor',
} as const;

/** `/admin/quant/collect?tab=` */
export const COLLECT_TABS = ['runs', 'trigger', 'checkpoints'] as const;
export type CollectTab = (typeof COLLECT_TABS)[number];

/** `/admin/quant/advisor?tab=` — `trigger` 는 인자가 필요한 수동 실행(기준일 보충·IC 호라이즌 백필). */
export const ADVISOR_TABS = ['runs', 'advices', 'kpi', 'weights', 'trigger'] as const;
export type AdvisorTab = (typeof ADVISOR_TABS)[number];

/**
 * URL 의 tab 값을 허용 목록으로 해석한다. 모르는 값·없음은 fallback —
 * Radix Tabs 는 value 가 어느 Tab 과도 맞지 않으면 패널을 하나도 그리지 않는다.
 */
export function resolveTab<T extends string>(
  value: string | null | undefined,
  tabs: readonly T[],
  fallback: T,
): T {
  return value !== null && value !== undefined && (tabs as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** run 상세 딥링크 — 모듈에 따라 수집/AI 판단 화면의 실행 이력 탭을 연다. */
export function runHref(module: RunModule, runId: number | string): string {
  const base = module === 'STOCK' ? QUANT_ROUTES.collect : QUANT_ROUTES.advisor;
  return `${base}?tab=runs&run=${encodeURIComponent(String(runId))}`;
}

/** 판단 상세 딥링크(M4 가 `?advice=` 를 읽는다). */
export function adviceHref(adviceId: number | string): string {
  return `${QUANT_ROUTES.advisor}?tab=advices&advice=${encodeURIComponent(String(adviceId))}`;
}
