/**
 * 판단 종류(kind)·호라이즌 규칙 — 백엔드 `AdvisorProperties`(horizonOf·scoreHorizons·isLearnHorizon)와 `advisor.horizons` 기본 설정의 복제본.
 *
 * 화면이 **유효한 조합만** 고르게 하는 것이 목적이다. 백엔드 `/scores/summary` 는 kind 와 horizon 의 조합을 검증하지 않아
 * H20·h=5 같은 조합도 200 빈 표를 돌려주고, ADHOC 은 채점 루프 밖이라 늘 빈 표다 — 빈 표를 "성과 없음" 으로 오독하지 않게 막는다.
 *
 * ⚠️ 설정(`advisor.horizons`·`diagnostic-horizons`)을 바꾸면 여기도 함께 고친다(두 저장소라 대조 테스트를 둘 수 없다).
 */
import {
  ADVICE_KINDS,
  type AdviceKind,
  type AdvisorJobType,
  IC_HORIZONS,
  type IcHorizon,
} from '../../types/quant';

/** KPI 로 볼 수 있는 종류 — ADHOC(수시)은 채점하지 않는다(`scoreHorizons(ADHOC)` = 빈 목록). */
export const KPI_KINDS = [
  'DAILY',
  'MORNING',
  'H20',
  'H60',
  'H180',
] as const satisfies readonly AdviceKind[];
export type KpiKind = (typeof KPI_KINDS)[number];

/** DAILY 결정 호라이즌(`advisor.horizon-days`). */
export const DAILY_HORIZON = 5;

/** DAILY·MORNING 의 진단 채점 호라이즌(`advisor.diagnostic-horizons`) — 학습·KPI 판정에는 안 쓰고 관찰만 한다. */
export const DIAGNOSTIC_HORIZONS = [1, 20] as const;

/** 가중치를 학습하지 않는 모니터링 호라이즌(learn=false) — IC 만 저장한다. */
const MONITORING_HORIZONS: readonly number[] = [60, 180];

/** 종류의 결정 호라이즌 (`horizonOf`). MORNING(저녁과 같은 창)·ADHOC 은 DAILY 와 같다. */
export function decisionHorizonOf(kind: AdviceKind): number {
  switch (kind) {
    case 'H20':
      return 20;
    case 'H60':
      return 60;
    case 'H180':
      return 180;
    default:
      return DAILY_HORIZON;
  }
}

/** KPI 에서 고를 수 있는 호라이즌 — 결정 호라이즌이 첫째. DAILY·MORNING 만 진단 호라이즌이 더 있다. */
export function kpiHorizonsOf(kind: KpiKind): readonly number[] {
  const decision = decisionHorizonOf(kind);
  if (kind === 'DAILY' || kind === 'MORNING') return [decision, ...DIAGNOSTIC_HORIZONS];
  return [decision];
}

/** 모니터링 전용(가중치 미학습·판정 불가) 호라이즌인지. */
export function isMonitoringHorizon(horizon: number): boolean {
  return MONITORING_HORIZONS.includes(horizon);
}

/** URL 값 → 허용 목록 안의 종류. 모르는 값·없음은 fallback(백엔드 enum 파라미터라 밖의 값은 400 이다). */
export function resolveKind<K extends AdviceKind>(
  value: string | null | undefined,
  allowed: readonly K[],
  fallback: K,
): K {
  return value && (allowed as readonly string[]).includes(value) ? (value as K) : fallback;
}

/** 판단 이력 필터용 — 6종 전부 허용. */
export function resolveAdviceKind(value: string | null | undefined): AdviceKind {
  return resolveKind(value, ADVICE_KINDS, 'DAILY');
}

/**
 * KPI 호라이즌 URL 값 → 그 종류에서 유효한 값. 결정 호라이즌이거나 무효면 null(= 파라미터 생략, 백엔드가 결정 호라이즌을 쓴다).
 * 결정 호라이즌을 null 로 접는 이유: URL 에 기본값이 남지 않아야 종류를 바꿨을 때 옛 호라이즌이 끌려오지 않는다.
 */
export function resolveKpiHorizon(kind: KpiKind, value: string | null | undefined): number | null {
  const horizon = Number(value);
  if (!Number.isInteger(horizon) || horizon === decisionHorizonOf(kind)) return null;
  return kpiHorizonsOf(kind).includes(horizon) ? horizon : null;
}

/** IC·가중치 호라이즌 URL 값 → 5·20·60·180 중 하나. 무효면 5(DAILY 결정 호라이즌). */
export function resolveIcHorizon(value: string | null | undefined): IcHorizon {
  const horizon = Number(value);
  return (IC_HORIZONS as readonly number[]).includes(horizon)
    ? (horizon as IcHorizon)
    : DAILY_HORIZON;
}

/**
 * 종류를 만드는 잡 — 판단 삭제 뒤 "지금 재판단" 이 부를 잡이다. ADHOC 은 채팅 봇만 연다(관리자 트리거 대상 아님) → null.
 */
export function adviseJobOf(kind: AdviceKind): AdvisorJobType | null {
  switch (kind) {
    case 'DAILY':
      return 'ADVISE';
    case 'MORNING':
      return 'MORNING_ADVISE';
    case 'H20':
      return 'ADVISE_H20';
    case 'H60':
      return 'ADVISE_H60';
    case 'H180':
      return 'ADVISE_H180';
    default:
      return null;
  }
}

/** 학습 호라이즌의 가중치를 쓰는 잡(5 → ADVISE, 20 → ADVISE_H20). 모니터링 호라이즌은 가중치를 쓰지 않아 null. */
export function weightConsumerJobOf(horizon: number): AdvisorJobType | null {
  if (horizon === DAILY_HORIZON) return 'ADVISE';
  if (horizon === 20) return 'ADVISE_H20';
  return null;
}
