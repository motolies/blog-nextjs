/**
 * 그리드 검색/정렬의 순수 계층 — 서버 검색 계약 타입과 파라미터 정리 로직.
 * React 무의존이라 node 환경 vitest 로 단위 테스트가 가능한 유일한 그리드 층이다.
 */

export interface OrderBy {
  column: string;
  direction: 'ASCENDING' | 'DESCENDING';
}

export interface SearchRequest {
  page: number;
  pageSize: number;
  orderBy: OrderBy[];
  [key: string]: unknown;
}

export interface PageResponse<T> {
  list: T[];
  totalCount: number;
}

export interface SearchField {
  name?: string;
  label?: string;
  type?: string;
  pinned?: boolean;
  options?: { value: string | number | boolean; label: string }[];
  /** select 전용 — false 면 "전체"(빈값) 선택지를 빼고 `defaultValue` 를 빈값의 표시값으로 쓴다. */
  allowEmpty?: boolean;
  fromName?: string;
  toName?: string;
  fromLabel?: string;
  toLabel?: string;
  defaultValue?: unknown;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  integerOnly?: boolean;
}

/**
 * `YYYY-MM-DD HH:mm[:ss]`(피커 값 계약) → `YYYY-MM-DDTHH:mm:ss`(전송 계약).
 *
 * 공백 구분은 `@hvy/ui` 쪽 계약이고, 백엔드 Jackson 의 `LocalDateTime` 기본 파서는
 * ISO(`T` 구분)만 받는다. 그대로 보내면 역직렬화가 실패해 400 이 나고, 이 프로젝트는
 * 400 도 Slack 을 울린다 — 그래서 조용히 넘기지 않고 여기서 못 맞추면 값을 버린다
 * (numberRange 가 숫자로 못 읽는 값을 버리는 것과 같은 방침).
 *
 * 양식은 분까지만 받으므로(`precision="minute"`) 초는 여기서 채운다 — 시작은 `:00`,
 * 종료는 `:59`. 종료를 `:59` 로 채워야 서버의 "+1초 배타 상한"이 다음 분 정각이 되어
 * `23:59` 까지가 하루 전체를 뜻한다(날짜 단위로 조회하던 시절과 결과가 같아지는 지점).
 * 초가 이미 있는 값(예전 링크·타이핑)은 그대로 둔다.
 *
 * 이미 `T` 인 값도 통과시킨다 — URL 로 들어온 값이 그 꼴일 수 있다.
 */
function toIsoDateTime(value: unknown, boundary: 'from' | 'to'): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/);
  if (!match) return null;
  const seconds = match[3] ?? (boundary === 'from' ? ':00' : ':59');
  return `${match[1]}T${match[2]}${seconds}`;
}

/** 검색 파라미터 정리 — 빈 값 제거 + numberRange 범위 보정 + dateTimeRange ISO 정규화(초 보충). */
export function sanitizeSearchParams(
  params: Record<string, unknown>,
  fields: SearchField[],
): Record<string, unknown> {
  const numberRangeMeta = new Map<string, SearchField>();
  // 시작/종료를 구분해 둔다 — 초를 채울 때 `:00`/`:59` 가 갈린다(toIsoDateTime).
  const dateTimeBoundary = new Map<string, 'from' | 'to'>();
  for (const field of fields) {
    if (!field.fromName || !field.toName) continue;
    if (field.type === 'numberRange') {
      numberRangeMeta.set(field.fromName, field);
      numberRangeMeta.set(field.toName, field);
    } else if (field.type === 'dateTimeRange') {
      dateTimeBoundary.set(field.fromName, 'from');
      dateTimeBoundary.set(field.toName, 'to');
    }
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    const meta = numberRangeMeta.get(key);
    if (meta) {
      let num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) continue;
      if (meta.integerOnly) num = Math.trunc(num);
      const effectiveMin = meta.allowNegative === false ? Math.max(0, meta.min ?? 0) : meta.min;
      if (typeof effectiveMin === 'number' && num < effectiveMin) num = effectiveMin;
      if (typeof meta.max === 'number' && num > meta.max) num = meta.max;
      cleaned[key] = num;
      continue;
    }

    const boundary = dateTimeBoundary.get(key);
    if (boundary) {
      const iso = toIsoDateTime(value, boundary);
      if (iso === null) continue;
      cleaned[key] = iso;
      continue;
    }

    cleaned[key] = value;
  }
  return cleaned;
}

/** 클라 모드 정렬 비교 — 값 타입(숫자/문자)에 따라 비교한다. 문자열은 한국어 로케일. */
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'ko');
}
