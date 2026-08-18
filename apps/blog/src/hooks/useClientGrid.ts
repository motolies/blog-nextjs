import { useCallback, useEffect, useMemo, useState } from 'react';
import { compareValues } from '@/lib/gridSearch';

/**
 * 클라이언트 페이징 그리드 훅 — 이미 로드된 배열에 정렬+슬라이스+페이지 범위 클램프를
 * 얹어 @hvy/ui DataGrid 에 직접 배선한다. `paginate: false` 면 정렬만 하고 전 행을 준다
 * (페이징 없는 집계표 전용 — 수백 행에는 쓰지 않는다).
 */
export function useClientGrid<T>(
  data: readonly T[],
  {
    pageSize: initialPageSize = 10,
    paginate = true,
  }: { pageSize?: number; paginate?: boolean } = {},
) {
  const [sort, setSort] = useState<{ column: string; desc: boolean } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const next = [...data].sort((a, b) =>
      compareValues(
        (a as Record<string, unknown>)[sort.column],
        (b as Record<string, unknown>)[sort.column],
      ),
    );
    return sort.desc ? next.reverse() : next;
  }, [data, sort]);

  const totalCount = sorted.length;
  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1);

  // 필터 등으로 데이터가 줄면 현재 페이지를 범위 안으로 되민다
  useEffect(() => {
    if (!paginate) return;
    if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1);
  }, [pageCount, pageIndex, paginate]);

  const rows = useMemo(() => {
    if (!paginate) return sorted;
    return sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }, [sorted, paginate, pageIndex, pageSize]);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPageIndex(0);
  }, []);

  const sortOf = useCallback(
    (columnId: string) => (sort?.column === columnId ? (sort.desc ? 'desc' : 'asc') : null),
    [sort],
  );

  const toggleSort = useCallback((columnId: string) => {
    setSort((prev) => {
      if (prev?.column !== columnId) return { column: columnId, desc: false };
      if (!prev.desc) return { column: columnId, desc: true };
      return null;
    });
    setPageIndex(0);
  }, []);

  return {
    rows,
    totalCount,
    pageCount,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    sortOf,
    toggleSort,
  };
}
