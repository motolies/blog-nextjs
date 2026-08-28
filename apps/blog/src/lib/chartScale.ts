/**
 * 스파크라인 좌표 계산 — React 무의존 순수 계층.
 * gridSearch.ts 와 같은 근거로 분리한다: node 환경 vitest 로 단위 테스트가 가능해야
 * "점이 0개일 때", "값이 전부 같을 때" 같은 경계를 실제로 고정할 수 있다.
 */

export interface SparkPoint {
  label: string;
  value: number;
}

export interface ScaledPoint {
  x: number;
  y: number;
}

export interface ScaleBox {
  /** viewBox 좌표계 폭 (픽셀이 아니다) */
  w: number;
  /** viewBox 좌표계 높이 */
  h: number;
  /** 선 굵기가 잘리지 않도록 상하로 두는 여백 */
  pad: number;
}

/**
 * 값 배열을 viewBox 좌표로 변환한다.
 *
 * 값이 전부 같으면(최대 == 최소) 세로 중앙에 평평한 선을 그린다 — 0으로 나누기를 피하면서
 * "변화가 없었다"를 시각적으로 정직하게 표현한다. y=0(맨 위)이나 NaN 이 되면 안 된다.
 */
export function scalePoints(values: readonly number[], box: ScaleBox): ScaledPoint[] {
  if (values.length === 0) {
    return [];
  }
  const innerHeight = Math.max(0, box.h - box.pad * 2);

  if (values.length === 1) {
    return [{ x: box.w / 2, y: box.pad + innerHeight / 2 }];
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  const step = box.w / (values.length - 1);

  return values.map((value, index) => ({
    x: index * step,
    y: span === 0 ? box.pad + innerHeight / 2 : box.pad + (1 - (value - min) / span) * innerHeight,
  }));
}

/** 꺾은선 path. 점이 없으면 빈 문자열(<path d=""> 는 아무것도 그리지 않는다). */
export function toLinePath(points: readonly ScaledPoint[]): string {
  if (points.length === 0) {
    return '';
  }
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)},${round(point.y)}`)
    .join(' ');
}

/** 선 아래 영역 path. 시작·끝을 baseline 으로 닫는다. */
export function toAreaPath(points: readonly ScaledPoint[], baselineY: number): string {
  if (points.length === 0) {
    return '';
  }
  const first = points[0];
  const last = points[points.length - 1];
  return [
    `M${round(first.x)},${round(baselineY)}`,
    ...points.map((point) => `L${round(point.x)},${round(point.y)}`),
    `L${round(last.x)},${round(baselineY)}`,
    'Z',
  ].join(' ');
}

export interface SparkSummary {
  min: number;
  max: number;
  last: number;
  total: number;
  avg: number;
  peak: SparkPoint | null;
}

/**
 * 요약 수치. aria-label 과 캡션이 같은 값을 쓰도록 한 곳에서 만든다 —
 * 차트에만 있는 정보가 생기면 스크린리더 사용자가 읽을 수 없는 데이터가 된다.
 */
export function summarize(points: readonly SparkPoint[]): SparkSummary {
  if (points.length === 0) {
    return { min: 0, max: 0, last: 0, total: 0, avg: 0, peak: null };
  }
  const values = points.map((point) => point.value);
  const total = values.reduce((sum, value) => sum + value, 0);
  const max = Math.max(...values);

  return {
    min: Math.min(...values),
    max,
    last: values[values.length - 1],
    total,
    avg: total / values.length,
    peak: points.find((point) => point.value === max) ?? null,
  };
}

// SVG path 문자열이 불필요하게 길어지지 않도록 소수 둘째 자리에서 끊는다
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
