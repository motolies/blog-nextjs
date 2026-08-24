import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE, type GridPagingControl } from '@/lib/gridPaging';
import { compareValues } from '@/lib/gridSearch';

/**
 * 클라이언트 페이징 그리드 훅 — 이미 로드된 배열에 정렬+슬라이스+페이지 범위 클램프를
 * 얹어 @hvy/ui DataGrid 에 직접 배선한다. `paginate: false` 면 정렬만 하고 전 행을 준다
 * (페이징 없는 집계표 전용 — 수백 행에는 쓰지 않는다).
 *
 * 페이지 크기는 useServerGrid 와 같은 패턴 — `paging`(useGridSettings().paging)을 넘기면
 * 저장소가 진실이고, 생략하면 훅 내부 상태(DEFAULT_PAGE_SIZE)다. 화면별 `pageSize` 옵션은
 * 두지 않는다(화면마다 다른 기본값이 통일을 깨뜨렸다).
 */
export function useClientGrid<T>(
  data: readonly T[],
  { paging, paginate = true }: { paging?: GridPagingControl; paginate?: boolean } = {},
) {
  const [sort, setSort] = useState<{ column: string; desc: boolean } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [ownPageSize, setOwnPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const pageSize = paging?.pageSize ?? ownPageSize;
  const onPageSizeChange = paging?.onPageSizeChange;

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

  // 필터 등으로 데이터가 줄거나, 저장소 로드로 페이지 크기가 커지면 현재 페이지를 범위 안으로 되민다
  useEffect(() => {
    if (!paginate) return;
    if (pageIndex > pageCount - 1) setPageIndex(pageCount - 1);
  }, [pageCount, pageIndex, paginate]);

  const rows = useMemo(() => {
    if (!paginate) return sorted;
    return sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  }, [sorted, paginate, pageIndex, pageSize]);

  const setPageSize = useCallback(
    (next: number) => {
      // 사용자가 바꾼 경로에서만 1페이지로 — 저장소 로드 경로는 위 클램프 effect 가 처리한다.
      if (onPageSizeChange) onPageSizeChange(next);
      else setOwnPageSize(next);
      setPageIndex(0);
    },
    [onPageSizeChange],
  );

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
