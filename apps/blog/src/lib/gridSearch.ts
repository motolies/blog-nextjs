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

/** 검색 파라미터 정리 — 빈 값 제거 + numberRange 필드의 범위 보정. */
export function sanitizeSearchParams(
  params: Record<string, unknown>,
  fields: SearchField[],
): Record<string, unknown> {
  const numberRangeMeta = new Map<string, SearchField>();
  for (const field of fields) {
    if (field.type === 'numberRange' && field.fromName && field.toName) {
      numberRangeMeta.set(field.fromName, field);
      numberRangeMeta.set(field.toName, field);
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
