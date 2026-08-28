/**
 * 차트 색 — 값은 `styles/global.css` 의 앱 팔레트가 소유하고, 여기서는 이름만 다룬다.
 *
 * 왜 여기인가:
 *  - dl 팔레트는 의미색 5종(brand/green/orange/red/gray)뿐이라 "서로 구분되는 계열색"을 담지 못한다.
 *  - @hvy/ui 테마(Tier 1 33키 계약)에 넣으면 앱 도메인이 UI 패키지로 샌다.
 *  → `--regex-hl-*` 와 정확히 같은 층이 제자리다.
 *
 * ⚠️ 차트 컴포넌트에는 색 리터럴도, 색 클래스도 두지 않는다.
 *    verify-tokens 는 tsx 의 hex·rgb()·hsl()·color-mix()·Tailwind 기본 팔레트를 하드 실패시킨다.
 *    색이 오직 이 파일의 var() 문자열로만 들어오면 그 규칙을 구조적으로 지킬 수 있다.
 *    (지난번 /admin/stats 는 `bg-sky-500` 을 prop 으로 주입했다가 다크에서 대비 1.1:1 이 되어 삭제됐다.)
 */

export type ChartTone = 'primary' | 'danger' | 'warning' | 'neutral';

/** 계열 구분용 6색. 인덱스로 순환시켜 쓴다. */
export const CHART_SERIES = [
  'var(--admin-chart-1)',
  'var(--admin-chart-2)',
  'var(--admin-chart-3)',
  'var(--admin-chart-4)',
  'var(--admin-chart-5)',
  'var(--admin-chart-6)',
] as const;

export const CHART_LINE: Record<ChartTone, string> = {
  primary: 'var(--admin-chart-line)',
  danger: 'var(--admin-chart-line-danger)',
  warning: 'var(--admin-chart-line-warning)',
  neutral: 'var(--admin-chart-grid)',
};

export const CHART_TRACK = 'var(--admin-chart-track)';

/** 계열 색을 인덱스로 고른다(개수를 넘으면 순환). */
export function seriesColor(index: number): string {
  return CHART_SERIES[index % CHART_SERIES.length];
}
