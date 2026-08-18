import {
  Button,
  DataGrid,
  defineColumns,
  showToast,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  useConfirm,
} from '@hvy/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { useColumnSettings } from '@/components/common/grid/useColumnSettings';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import CategoryManagementPanel from '@/components/memo/CategoryManagementPanel';
import MemoDialog from '@/components/memo/MemoDialog';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { SearchField, SearchRequest } from '@/lib/gridSearch';
import service from '@/service';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

export default function MemoPage() {
  const askConfirm = useConfirm();
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await service.memo.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((c: any) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const columns = useMemo(
    () =>
      defineColumns<Record<string, unknown>>([
        {
          id: 'category',
          headerWord: '카테고리',
          width: 120,
          align: 'left',
          sortable: false,
          format: (value) => (value as { name?: string } | null)?.name || '-',
        },
        {
          id: 'content',
          headerWord: '내용',
          grow: 1,
          align: 'left',
          format: (value, row) => {
            const text = String(value ?? '');
            const display = text.length > 100 ? `${text.substring(0, 100)}...` : text;
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: 셀 클릭 편집은 보조 경로 — 행 액션 없이도 다이얼로그를 여는 지름길이다
              // biome-ignore lint/a11y/noStaticElementInteractions: 위와 동일
              <div
                className="cursor-pointer hover:text-dl-primary-ink"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                {display}
              </div>
            );
          },
        },
        {
          id: 'created',
          headerWord: '작성일',
          width: 160,
          align: 'left',
          format: (value) => {
            const val = value as { at?: string } | null;
            if (!val?.at) return '-';
            return formatUtcToLocal(val.at, 'yyyy-MM-dd HH:mm:ss');
          },
        },
        {
          id: 'actions',
          headerWord: ' ',
          width: 80,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => (
            <div className="flex gap-1">
              {!row.deleted && (
                <Button
                  variant="ghost"
                  onClick={() => handleDeleteClick(row)}
                  title="삭제"
                  className="aspect-square p-0 h-7 w-7 text-dl-danger hover:text-dl-danger-hover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ),
        },
      ]),
    [],
  );

  const searchFields = useMemo<SearchField[]>(
    () => [
      { name: 'keyword', label: '키워드', pinned: true },
      { name: 'categoryId', label: '카테고리', type: 'select', options: categoryOptions },
      {
        name: 'includeDeleted',
        label: '삭제 여부',
        type: 'select',
        defaultValue: true,
        options: [
          { value: true, label: '포함' },
          { value: false, label: '미포함' },
        ],
      },
    ],
    [categoryOptions],
  );

  // refreshKey 로 함수 정체성을 바꿔 useServerGrid 의 재조회를 유도한다(삭제/저장 후 갱신)
  const fetchMemos = useCallback(
    (searchRequest: SearchRequest) => service.memo.search({ searchRequest }),
    [refreshKey],
  );

  const grid = useServerGrid<Record<string, unknown>>({
    fetchData: fetchMemos,
    searchFields,
    defaultPageSize: 10,
  });

  const { visibleColumns, openSettings, dialog } = useColumnSettings(columns);

  const handleEdit = (row: any) => {
    setEditingMemoId(row.id);
    setMemoDialogOpen(true);
  };

  const handleDeleteClick = async (row: any) => {
    const ok = await askConfirm({
      message: '이 메모를 삭제하시겠습니까?',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.memo.delete(row.id);
      showToast('메모가 삭제되었습니다.');
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showToast('메모 삭제에 실패했습니다.', 'error');
    }
  };

  const handleMemoSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <AdminPageFrame
      actions={
        <Button variant="primary" onClick={() => setMemoDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          메모 추가
        </Button>
      }
    >
      <Tabs defaultValue="memos" className="mb-2">
        {/* 시각은 @hvy/ui Tabs 기본(밑줄형)을 그대로 쓴다 — 알약형은 WorkTabs 의 언어다. */}
        <TabList label="메모 관리 탭">
          <Tab value="memos">메모 목록</Tab>
          <Tab value="categories">카테고리 관리</Tab>
        </TabList>
        <TabPanel value="memos">
          <div className="admin-panel admin-table-shell">
            <div className="flex flex-col gap-2">
              <DynamicSearchFields
                searchFields={
                  searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']
                }
                defaultSearchParams={{}}
                enableDynamic
                {...grid.search}
              />
              <DataGrid<Record<string, unknown>>
                columns={visibleColumns}
                rows={grid.rows}
                getRowId={(row) => String(row.id)}
                isFetching={grid.loading}
                empty={GRID_EMPTY}
                sortOf={grid.sortOf}
                onToggleSort={grid.toggleSort}
                attachedToolbar
              />
              <GridPagingBar
                pageIndex={grid.pageIndex}
                pageCount={grid.pageCount}
                onPageChange={grid.setPageIndex}
                total={grid.totalCount}
                pageSize={grid.pageSize}
                onPageSizeChange={grid.setPageSize}
                onColumnSettings={openSettings}
              />
              {dialog}
            </div>
          </div>
        </TabPanel>
        <TabPanel value="categories">
          <div className="admin-panel admin-panel-pad">
            <CategoryManagementPanel />
          </div>
        </TabPanel>
      </Tabs>

      <MemoDialog
        open={memoDialogOpen}
        onClose={() => {
          setMemoDialogOpen(false);
          setEditingMemoId(null);
        }}
        memoId={editingMemoId}
        onSaved={handleMemoSaved}
      />
    </AdminPageFrame>
  );
}
