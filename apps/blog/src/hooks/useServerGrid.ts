import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type OrderBy,
  type PageResponse,
  type SearchField,
  type SearchRequest,
  sanitizeSearchParams,
} from '@/lib/gridSearch';

/**
 * 서버 페이징 그리드의 데이터 수명주기 훅 — @hvy/ui DataGrid 에 직접 배선한다.
 *
 * ⚠️ `fetchData`·`searchFields`·`defaultSearchParams` 는 참조가 안정적이어야 한다
 * (모듈 스코프 상수 또는 useCallback/useMemo). 렌더마다 새 객체를 넘기면
 * effect 가 무한 재조회에 빠진다.
 */
export interface UseServerGridOptions<T> {
  fetchData: (params: SearchRequest) => Promise<PageResponse<T>>;
  searchFields?: SearchField[];
  defaultSearchParams?: Record<string, unknown>;
  defaultPageSize?: number;
}

const EMPTY_FIELDS: SearchField[] = [];
const EMPTY_PARAMS: Record<string, unknown> = {};

export function useServerGrid<T>({
  fetchData,
  searchFields = EMPTY_FIELDS,
  defaultSearchParams = EMPTY_PARAMS,
  defaultPageSize = 10,
}: UseServerGridOptions<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<{ column: string; desc: boolean } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [searchParams, setSearchParams] = useState<Record<string, unknown>>(defaultSearchParams);
  const [searchInputs, setSearchInputs] = useState<Record<string, unknown>>(defaultSearchParams);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestRef.current;
    const loadData = async () => {
      setLoading(true);
      try {
        const orderBy: OrderBy[] = sort
          ? [{ column: sort.column, direction: sort.desc ? 'DESCENDING' : 'ASCENDING' }]
          : [];
        const sanitized = sanitizeSearchParams(searchParams, searchFields);
        const response = await fetchData({ page: pageIndex, pageSize, orderBy, ...sanitized });
        if (currentRequest === requestRef.current) {
          setRows(response.list || []);
          setTotalCount(response.totalCount || 0);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        if (currentRequest === requestRef.current) {
          setRows([]);
          setTotalCount(0);
        }
      } finally {
        if (currentRequest === requestRef.current) setLoading(false);
      }
    };
    loadData();
    /**
     * `searchTrigger` 가 의존성에 있어야 **같은 조건 재검색**이 동작한다 —
     * 조건을 바꾸지 않고 [검색]을 다시 누르면 `setSearchParams(searchInputs)` 가
     * 같은 참조라 React 가 bail out 하고, 이 effect 는 깨어나지 않는다.
     *
     * 이 값을 별도 effect 에서 `requestRef` 만 올리는 형태로 두면 더 나빠진다:
     * 진행 중이던 응답이 레이스 가드에 걸려 버려지면서 `setLoading(false)` 까지
     * 건너뛰어 **스피너가 영원히 돈다**.
     */
  }, [fetchData, pageIndex, pageSize, searchFields, searchParams, sort, searchTrigger]);

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

  const onSearch = useCallback(() => {
    setSearchParams(searchInputs);
    setPageIndex(0);
    setSearchTrigger((t) => t + 1);
  }, [searchInputs]);

  const onReset = useCallback(() => {
    setSearchInputs(defaultSearchParams);
    setSearchParams(defaultSearchParams);
    setPageIndex(0);
    setSearchTrigger((t) => t + 1);
    // deps 가 빈 배열인 건 의도다 — 초기화 대상은 **마운트 시점의** 기본값이다.
  }, []);

  const onInputChange = useCallback((fieldName: string, value: unknown) => {
    setSearchInputs((previous) => ({ ...previous, [fieldName]: value }));
  }, []);

  return {
    rows,
    loading,
    totalCount,
    pageCount: Math.max(Math.ceil(totalCount / pageSize), 1),
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    sortOf,
    toggleSort,
    /** DynamicSearchFields 에 그대로 스프레드하는 검색 배선 */
    search: { searchInputs, onInputChange, onSearch, onReset },
    /** useGridSelection/useGridEditing 의 resetKey 로 사용 */
    resetKey: `${JSON.stringify(searchParams)}:${pageIndex}:${pageSize}`,
  };
}
