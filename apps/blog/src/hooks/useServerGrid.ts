import { useCallback, useEffect, useRef, useState } from 'react';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { DEFAULT_PAGE_SIZE, type GridPagingControl } from '@/lib/gridPaging';
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
  /**
   * 페이지 크기 controlled 배선 — `useGridSettings().paging` 을 그대로 넘긴다(저장소가 진실).
   * 생략하면 훅 내부 상태(DEFAULT_PAGE_SIZE)로 동작한다 — 영속이 필요 없는 임시 그리드용.
   * (`defaultPageSize` 옵션은 제거 — 화면마다 다른 기본값이 페이지 크기 통일을 깨뜨렸다.)
   */
  paging?: GridPagingControl;
}

const EMPTY_FIELDS: SearchField[] = [];
const EMPTY_PARAMS: Record<string, unknown> = {};

export function useServerGrid<T>({
  fetchData,
  searchFields = EMPTY_FIELDS,
  defaultSearchParams = EMPTY_PARAMS,
  paging,
}: UseServerGridOptions<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<{ column: string; desc: boolean } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  // controlled(paging) 면 저장소 값, 아니면 훅 내부 상태 — 둘 중 하나만 진실이다.
  const [ownPageSize, setOwnPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const pageSize = paging?.pageSize ?? ownPageSize;
  const onPageSizeChange = paging?.onPageSizeChange;
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
        // 레이스 가드 안에서만 알린다 — 이미 새 요청으로 대체된 옛 요청의 실패는 화면과 무관하다.
        // (이 훅은 요청을 취소하지 않으므로 ERR_CANCELED 분기는 필요 없다)
        if (currentRequest === requestRef.current) {
          setRows([]);
          setTotalCount(0);
          showApiErrorToast('데이터를 불러오지 못했습니다.', error);
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
     *
     * deps 는 숫자 `pageSize` 만 본다 — `paging` 객체를 넣으면 useGridPreference 의
     * setPageSize 참조가 preference 마다 바뀌어 폭 드래그마다 재조회가 생긴다.
     */
  }, [fetchData, pageIndex, pageSize, searchFields, searchParams, sort, searchTrigger]);

  const setPageSize = useCallback(
    (next: number) => {
      // 사용자가 바꾼 경로에서만 1페이지로 — 저장소 로드로 pageSize 가 바뀌는 경로는
      // 이 함수를 타지 않는다(그때는 어차피 0).
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

  /**
   * 같은 조건으로 현재 페이지를 다시 읽는다 — 행을 수정·삭제한 뒤에 쓴다.
   *
   * onSearch 로 대신하면 setSearchParams + setPageIndex(0) 까지 딸려와
   * 3페이지에서 한 건 지웠을 뿐인데 1페이지로 튕긴다.
   * searchTrigger 를 올려 기존 effect 를 그대로 재실행하는 것이 유일하게 안전한 경로다
   * (requestRef 만 따로 올리면 setLoading(true) 가 남아 스피너가 멈추지 않는다).
   */
  const refresh = useCallback(() => {
    setSearchTrigger((t) => t + 1);
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
    refresh,
    /** DynamicSearchFields 에 그대로 스프레드하는 검색 배선 */
    search: { searchInputs, onInputChange, onSearch, onReset },
    /** useGridSelection/useGridEditing 의 resetKey 로 사용 */
    resetKey: `${JSON.stringify(searchParams)}:${pageIndex}:${pageSize}`,
  };
}
