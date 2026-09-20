/**
 * limit 전용 목록 API 를 `useServerGrid` 의 `PageResponse` 계약에 맞추는 어댑터 — 순수 함수.
 *
 * run 목록 API 는 서버 페이징이 없다(limit≤500 + 필터). 두 모듈에 PageInterceptor 형 검색을 새로 짜는 대신
 * 응답 배열을 클라에서 `orderBy` 정렬 → `page/pageSize` 슬라이스 해 기존 그리드 배선(검색·정렬·페이저)을 그대로 쓴다.
 * 하루 run 수가 수십 건이라 500 건은 2주 이상이다.
 */
import { compareValues, type PageResponse, type SearchRequest } from '../gridSearch';

/**
 * 정렬 + 슬라이스. `page` 는 0-based(useServerGrid 가 `pageIndex` 를 그대로 넘긴다).
 * 정렬은 안정 정렬이라 같은 값끼리는 서버가 준 순서(startedAt DESC)를 유지한다.
 */
export function toRunPage<T extends Record<string, unknown>>(
  rows: readonly T[],
  request: SearchRequest,
): PageResponse<T> {
  const sorted = sortByOrderBy(rows, request);
  const pageSize = Math.max(1, request.pageSize);
  const start = Math.max(0, request.page) * pageSize;
  return { list: sorted.slice(start, start + pageSize), totalCount: rows.length };
}

/** 첫 orderBy 만 적용한다 — DataGrid 는 단일 컬럼 정렬이다. 없으면 입력 순서 그대로. */
function sortByOrderBy<T extends Record<string, unknown>>(
  rows: readonly T[],
  request: SearchRequest,
): T[] {
  const order = request.orderBy?.[0];
  if (!order) return [...rows];
  const direction = order.direction === 'DESCENDING' ? -1 : 1;
  return [...rows].sort((a, b) => compareValues(a[order.column], b[order.column]) * direction);
}
