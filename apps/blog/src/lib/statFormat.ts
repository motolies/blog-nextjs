/**
 * 대시보드 숫자 표기 — React 무의존 순수 계층.
 * 설계 원칙 "비교값 없는 절대수 금지"를 실제로 강제하는 곳이다.
 */

export interface DeltaLabel {
  /** 'up' | 'down' | 'flat' | 'new' | 'none' */
  kind: 'up' | 'down' | 'flat' | 'new' | 'none';
  text: string;
  /** 좋은 변화인가. 에러 지표는 invert 로 뒤집는다. */
  good: boolean | null;
}

/**
 * 증감 라벨.
 *
 * 기준이 0이면 증감률이 정의되지 않는다 — "+∞%" 대신 "신규"라고 말한다.
 * invert 는 "낮을수록 좋은" 지표(에러 건수)에 쓴다.
 */
export function formatDelta(
  current: number,
  previous: number,
  options?: { invert?: boolean },
): DeltaLabel {
  const invert = options?.invert ?? false;

  if (previous === 0) {
    if (current === 0) {
      return { kind: 'flat', text: '변화 없음', good: null };
    }
    return { kind: 'new', text: '신규', good: invert ? false : null };
  }

  const percent = ((current - previous) / previous) * 100;
  if (Math.abs(percent) < 0.5) {
    return { kind: 'flat', text: '변화 없음', good: null };
  }

  const up = percent > 0;
  return {
    kind: up ? 'up' : 'down',
    text: `${up ? '+' : ''}${percent.toFixed(percent >= 10 || percent <= -10 ? 0 : 1)}%`,
    good: invert ? !up : up,
  };
}

/** 1,234 / 12.3천 / 1.2만 — 타일에 들어가는 큰 수를 짧게. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const abs = Math.abs(value);
  if (abs >= 10_000) {
    return `${(value / 10_000).toFixed(1)}만`;
  }
  if (abs >= 1_000) {
    return value.toLocaleString('ko-KR');
  }
  return String(value);
}

/**
 * "3분 전" / "2일 전". 스케줄러·수집 시각처럼 "얼마나 오래됐나"가 본질인 값에 쓴다.
 * 절대 시각은 title 속성으로 함께 노출할 것 — 상대 시각만 있으면 정확한 시점을 알 수 없다.
 */
export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  now: Date = new Date(),
): string {
  if (value === null || value === undefined || value === '') {
    return '기록 없음';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '기록 없음';
  }

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) {
    return '방금';
  }
  if (seconds < 60) {
    return '방금';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}일 전`;
  }
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}개월 전` : `${Math.floor(months / 12)}년 전`;
}

/**
 * 긴 경로를 가운데를 접어 줄인다 — 앞뒤가 모두 의미를 가지는 URI 에는
 * 뒤만 자르는 말줄임보다 이쪽이 정보를 더 남긴다.
 */
export function truncateMiddle(value: string, max = 40): string {
  if (value.length <= max) {
    return value;
  }
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
}
