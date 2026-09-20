/**
 * KPI 수치 표기 — 승률·초과수익·Brier·IC 같은 비율/소수 값의 문자열 변환. React 무의존.
 *
 * 백엔드 `AdvisorKpiService` 는 비율을 **소수**(0.54 = 54%)로 내려준다. 초과수익도 0.0041 = 0.41% 다.
 * 화면에서 `%` 로 바꾸는 규칙을 한곳에 두어 표마다 자릿수가 갈리지 않게 한다.
 * null 은 전부 '—' — 채점이 아직 없는 구간(판정 시점 미도달)이 대부분이라 0 으로 그리면 거짓이 된다.
 */

/** 비율(0~1) → `54.0%`. 승률·pUp·확신에 쓴다. */
export function formatRate(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

/** 수익률(소수) → `+0.41%`. 부호를 늘 붙인다 — 초과수익은 방향이 뜻이다. */
export function formatSignedPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const pct = value * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(digits)}%`;
}

/** `평균 ± se` — 둘 다 소수 비율. se 가 없으면 평균만. */
export function formatPctWithSe(
  mean: number | null | undefined,
  se: number | null | undefined,
): string {
  const base = formatSignedPct(mean);
  if (base === '—' || se === null || se === undefined || !Number.isFinite(se)) return base;
  return `${base} ± ${(se * 100).toFixed(2)}%`;
}

/** 소수 고정 자릿수 — Brier·IC 평균·가중치처럼 % 가 아닌 값. */
export function formatFixed(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

/** 부호 있는 고정 자릿수 — t 통계·IC 평균. */
export function formatSignedFixed(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

/** 방향으로 톤을 정한다 — 양수 success · 음수 danger · 0/없음 neutral. 부가가치·초과수익 강조에 쓴다. */
export function signTone(value: number | null | undefined): 'success' | 'danger' | 'neutral' {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'success' : 'danger';
}

/** |t| ≥ 2 를 유의로 본다(`SignalWeightMath` 의 하한 규칙과 같은 임계). */
export const T_STAT_SIGNIFICANT = 2;

export function isSignificant(tStat: number | null | undefined): boolean {
  return tStat !== null && tStat !== undefined && Math.abs(tStat) >= T_STAT_SIGNIFICANT;
}

/** JSON 으로 읽히면 들여쓴 원문, 아니면 그대로 — 프롬프트 원문·metadata `<pre>` 에 쓴다. */
export function prettyJson(raw: string | Record<string, unknown> | unknown[] | null): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw !== 'string') return JSON.stringify(raw, null, 2);
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
