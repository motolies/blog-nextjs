'use client';

import { Badge, Button, defineColumns, IconButton, showToast, useConfirm } from '@hvy/ui';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useCategoryFlat } from '@/hooks/useCategories';
import { useServerGrid } from '@/hooks/useServerGrid';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import type { SearchField, SearchRequest } from '@/lib/gridSearch';
import { pickPostFilters } from '@/lib/urlFilters';
import service from '@/service';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

/**
 * 관리자 포스트 목록.
 *
 * 이 화면이 없어서 지금까지 글을 고치려면 공개 사이트에서 글을 찾아 ID 를 확인한 뒤
 * /admin/write/{id} 로 직접 들어가야 했다. 사이드바에 진입점 자체가 없었다.
 *
 * 구조는 app/admin/system-log/page.tsx 를 정본으로 따른다 —
 * 모듈 스코프 searchFields, useCallback fetch, useGridSettings 를 useServerGrid 보다 먼저.
 */

/**
 * 정적 검색 필드는 **모듈 스코프**에 둔다.
 * 컴포넌트 안에 두면 렌더마다 새 배열이 되고, useServerGrid 의 조회 effect 가
 * 이 배열을 의존성으로 갖기 때문에 매 렌더 재조회가 돈다.
 */
const STATIC_SEARCH_FIELDS: SearchField[] = [
  {
    // 기간이 어느 날짜에 걸리는지 — 글은 작성일만큼 수정일로 찾는 일이 잦다.
    // "전체"가 뜻이 없는 선택지라 allowEmpty=false, 기본값은 서버 기본(작성일)과 같다.
    name: 'dateField',
    label: '기준일',
    type: 'select',
    pinned: true,
    allowEmpty: false,
    defaultValue: 'createdAt',
    options: [
      { value: 'createdAt', label: '작성일' },
      { value: 'updatedAt', label: '수정일' },
    ],
  },
  {
    type: 'dateTimeRange',
    fromName: 'dateFrom',
    toName: 'dateTo',
    fromLabel: '시작일시',
    toLabel: '종료일시',
    pinned: true,
  },
  { name: 'subject', label: '제목', pinned: true },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    options: [
      { value: 'PUB', label: '발행' },
      { value: 'TEM', label: '임시저장' },
    ],
  },
  {
    name: 'publicAccess',
    label: '공개 여부',
    type: 'select',
    options: [
      { value: 'true', label: '공개' },
      { value: 'false', label: '비공개' },
    ],
  },
  {
    name: 'hasDraft',
    label: '반영 안 된 초안',
    type: 'select',
    options: [
      { value: 'true', label: '있음' },
      { value: 'false', label: '없음' },
    ],
  },
  { name: 'tagName', label: '태그' },
  {
    type: 'numberRange',
    fromName: 'minViewCount',
    toName: 'maxViewCount',
    fromLabel: '조회 최소',
    toLabel: '조회 최대',
    allowNegative: false,
    min: 0,
    integerOnly: true,
  },
];

interface AdminPostRow extends Record<string, unknown> {
  id: number;
  subject: string;
  categoryName: string | null;
  status: string;
  publicAccess: boolean;
  mainPage: boolean;
  hasDraft: boolean;
  viewCount: number;
  tagCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPostsPage() {
  // useSearchParams 는 Suspense 경계를 요구한다 — 빌드 타임 CSR bailout 오류를 미리 막는다
  return (
    <Suspense fallback={null}>
      <AdminPosts />
    </Suspense>
  );
}

function AdminPosts() {
  const router = useRouter();
  const askConfirm = useConfirm();
  const searchParams = useSearchParams();
  // URLSearchParams 객체는 매 렌더 새 참조라 의존성으로 쓸 수 없다 — 문자열로 고정한다
  const searchString = searchParams.toString();

  const { data: categories } = useCategoryFlat();

  const searchFields = useMemo<SearchField[]>(() => {
    const categoryOptions = (categories ?? []).map((category) => ({
      value: String(category.id),
      label: category.name,
    }));
    return [
      ...STATIC_SEARCH_FIELDS,
      { name: 'categoryId', label: '카테고리', type: 'select', options: categoryOptions },
    ];
  }, [categories]);

  /**
   * 대시보드 타일이 `?status=TEM` 같은 링크로 보내므로 URL 을 초기 검색값으로 삼는다.
   * 기본값을 비워 두는 것도 의도다 — system-log 는 로그가 방대해 오늘로 좁히지만,
   * 글 목록은 도착하자마자 전부 보여야 화면의 존재 이유를 만족한다.
   */
  // 기준일은 항상 값이 있어야 초기화 뒤에도 select 가 작성일을 보여 준다. URL 이 지정하면 그쪽이 이긴다.
  const defaultSearchParams = useMemo(
    () => ({ dateField: 'createdAt', ...pickPostFilters(searchString) }),
    [searchString],
  );

  const fetchPosts = useCallback(
    (searchRequest: SearchRequest) => service.post.adminSearch({ searchRequest }),
    [],
  );

  /**
   * grid.refresh 를 ref 로 우회 참조한다.
   *
   * 훅 순서가 columns → useGridSettings → useServerGrid 로 고정돼 있는데
   * (settings 가 저장된 페이지 크기를 grid 에 넘겨야 하므로) 액션 핸들러는 grid 를 필요로 한다.
   * useCallback 의 **본문**은 나중에 실행되니 괜찮지만 **의존성 배열은 렌더 시점에 평가**되므로
   * [grid] 를 쓰면 선언 전 접근(TDZ)으로 터진다. ref 는 그 평가를 피하면서 최신 값을 잡는다.
   */
  const refreshRef = useRef<() => void>(() => {});

  /**
   * 공개 토글. 변이 뒤에는 refresh 로 같은 페이지를 다시 읽는다 —
   * onSearch 를 쓰면 3페이지에서 한 건 바꿨을 뿐인데 1페이지로 튕긴다.
   *
   * 여기서는 토스트를 쓴다. 대시보드의 읽기 실패와 달리 이건 사용자가 누른 행동의 응답이다.
   */
  const handleTogglePublic = useCallback(async (row: AdminPostRow) => {
    try {
      await service.post.setPublicPost({
        postId: String(row.id),
        publicStatus: !row.publicAccess,
      });
      showToast(row.publicAccess ? '비공개로 전환했습니다.' : '공개로 전환했습니다.');
      refreshRef.current();
    } catch (error) {
      showApiErrorToast('공개 상태를 변경하지 못했습니다.', error);
    }
  }, []);

  const handleDelete = useCallback(
    async (row: AdminPostRow) => {
      const ok = await askConfirm({
        message: `'${row.subject}' 글을 삭제하시겠습니까?`,
        confirmLabel: '삭제',
        destructive: true,
      });
      if (!ok) {
        return;
      }
      try {
        await service.post.deletePost({ postId: String(row.id) });
        showToast('글을 삭제했습니다.');
        refreshRef.current();
      } catch (error) {
        showApiErrorToast('글을 삭제하지 못했습니다.', error);
      }
    },
    [askConfirm],
  );

  const columns = useMemo(
    () =>
      defineColumns<AdminPostRow>([
        {
          id: 'status',
          headerWord: '상태',
          width: 90,
          format: (value) => (
            <Badge tone={value === 'PUB' ? 'success' : 'warning'}>
              {value === 'PUB' ? '발행' : '임시'}
            </Badge>
          ),
        },
        {
          id: 'publicAccess',
          headerWord: '공개',
          width: 90,
          format: (value) => (
            <Badge tone={value ? 'primary' : 'neutral'}>{value ? '공개' : '비공개'}</Badge>
          ),
        },
        {
          id: 'hasDraft',
          headerWord: '초안',
          width: 80,
          format: (value) => (value ? <Badge tone="warning">대기</Badge> : '-'),
        },
        {
          id: 'subject',
          headerWord: '제목',
          width: 320,
          grow: 1,
          align: 'left',
          // 이 화면의 목적이 "고치기"이므로 제목의 일차 클릭 대상은 편집 화면이다
          format: (value, row) => (
            <Link href={`/admin/write/${row.id}`} className="text-dl-primary-ink hover:underline">
              {String(value ?? '')}
            </Link>
          ),
        },
        { id: 'categoryName', headerWord: '카테고리', width: 160, align: 'left' },
        { id: 'tagCount', headerWord: '태그', width: 80, align: 'right' },
        {
          id: 'viewCount',
          headerWord: '조회',
          width: 100,
          align: 'right',
          format: (value) => Number(value ?? 0).toLocaleString('ko-KR'),
        },
        {
          id: 'createdAt',
          headerWord: '작성일',
          width: 170,
          format: (value) => formatUtcToLocal(String(value), 'yyyy-MM-dd HH:mm'),
        },
        {
          id: 'updatedAt',
          headerWord: '수정일',
          width: 170,
          format: (value) => formatUtcToLocal(String(value), 'yyyy-MM-dd HH:mm'),
        },
        {
          id: 'actions' as keyof AdminPostRow & string,
          headerWord: ' ',
          // 아이콘 버튼 2개(xs 32) + gap-1 1칸 + 셀 좌우 패딩 20 = 88
          width: 92,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => (
            <div className="flex gap-1">
              <IconButton
                icon={row.publicAccess ? EyeOff : Eye}
                label={row.publicAccess ? `${row.subject} 비공개로` : `${row.subject} 공개로`}
                size="xs"
                iconSize="sm"
                className="cursor-pointer"
                onClick={() => handleTogglePublic(row)}
              />
              <IconButton
                icon={Trash2}
                label={`${row.subject} 삭제`}
                tone="danger"
                size="xs"
                iconSize="sm"
                className="cursor-pointer"
                onClick={() => handleDelete(row)}
              />
            </div>
          ),
        },
      ]),
    [handleTogglePublic, handleDelete],
  );

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다
  const settings = useGridSettings(columns, 'posts');
  const grid = useServerGrid<AdminPostRow>({
    fetchData: fetchPosts,
    searchFields,
    defaultSearchParams,
    paging: settings.paging,
  });

  useEffect(() => {
    refreshRef.current = grid.refresh;
  }, [grid.refresh]);

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      <div className="admin-panel admin-table-shell admin-table-shell--bleed">
        <DynamicSearchFields
          searchFields={searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']}
          defaultSearchParams={defaultSearchParams}
          enableDynamic
          {...grid.search}
        />
        <PersistedDataGrid<AdminPostRow>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.id)}
          isFetching={grid.loading}
          empty={GRID_EMPTY}
          sortOf={grid.sortOf}
          onToggleSort={grid.toggleSort}
          attachedToolbar
          maxHeight="fill"
        />
        <GridPagingBar
          pageIndex={grid.pageIndex}
          pageCount={grid.pageCount}
          onPageChange={grid.setPageIndex}
          total={grid.totalCount}
          pageSize={grid.pageSize}
          onPageSizeChange={grid.setPageSize}
          onColumnSettings={settings.openSettings}
          actions={
            // AdminPageFrame 의 actions 패널을 쓰지 않는다 — --fixed 높이 예산에
            // 패널이 하나 더 붙으면 좁은 화면에서 보이는 행이 몇 줄로 줄어든다
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => router.push('/admin/write')}
            >
              새 글 작성
            </Button>
          }
        />
      </div>
    </AdminPageFrame>
  );
}
