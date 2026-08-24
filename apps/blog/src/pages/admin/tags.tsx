import {
  Badge,
  Button,
  ContentDialog,
  defineColumns,
  Input,
  Label,
  Select,
  Switch,
  showToast,
  useConfirm,
} from '@hvy/ui';
import { Merge, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useClientGrid } from '@/hooks/useClientGrid';
import { searchObjectInit } from '@/model/searchObject';
import service from '@/service';
import { base64Encode } from '@/util/base64Util';

interface TagItem {
  id: number;
  name: string;
  postCount: number;
  [key: string]: unknown;
}

export default function TagsPage() {
  const router = useRouter();
  const askConfirm = useConfirm();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unusedOnly, setUnusedOnly] = useState(false);

  // 생성/수정 다이얼로그
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<TagItem | null>(null);
  const [tagName, setTagName] = useState('');

  // 병합 다이얼로그
  const [openMergeDialog, setOpenMergeDialog] = useState(false);
  const [mergeSource, setMergeSource] = useState<TagItem | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');

  const loadTags = useCallback(async () => {
    try {
      const res = await service.tag.allTags();
      setTags(res.data ?? []);
    } catch {
      showToast('태그 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const filteredTags = useMemo(() => {
    let result = tags;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q));
    }

    if (unusedOnly) {
      result = result.filter((t) => t.postCount === 0);
    }

    return result;
  }, [tags, searchQuery, unusedOnly]);

  const unusedCount = useMemo(() => tags.filter((t) => t.postCount === 0).length, [tags]);

  const mergeTargetOptions = useMemo(() => {
    if (!mergeSource) return [];
    return tags
      .filter((t) => t.id !== mergeSource.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [tags, mergeSource]);

  const searchTagPosts = (tag: TagItem) => {
    const condition = {
      ...searchObjectInit,
      tags: [{ id: tag.id, name: tag.name }],
    };
    router.push({ pathname: '/search', query: { q: base64Encode(JSON.stringify(condition)) } });
  };

  const handleCreate = () => {
    setDialogMode('create');
    setEditTarget(null);
    setTagName('');
    setOpenDialog(true);
  };

  const handleEdit = (tag: TagItem) => {
    setDialogMode('edit');
    setEditTarget(tag);
    setTagName(tag.name);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    const trimmed = tagName.trim();
    if (!trimmed) {
      showToast('태그 이름은 필수입니다.', 'error');
      return;
    }

    try {
      if (dialogMode === 'create') {
        await service.tag.createTag({ name: trimmed });
        showToast('태그가 생성되었습니다.');
      } else {
        await service.tag.updateTag(String(editTarget!.id), { name: trimmed });
        showToast('태그가 수정되었습니다.');
      }
      setOpenDialog(false);
      await loadTags();
    } catch {
      showToast(
        dialogMode === 'create' ? '태그 생성에 실패했습니다.' : '태그 수정에 실패했습니다.',
        'error',
      );
    }
  };

  const handleDelete = async (tag: TagItem) => {
    const ok = await askConfirm({
      message: `${tag.name} 태그를 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.tag.deleteTag(String(tag.id));
      showToast('태그가 삭제되었습니다.');
      await loadTags();
    } catch {
      showToast('태그 삭제에 실패했습니다.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (unusedCount === 0) {
      showToast('미사용 태그가 없습니다.', 'info');
      return;
    }
    const ok = await askConfirm({
      message: `미사용 태그 ${unusedCount}개를 모두 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.tag.deleteUnusedTags();
      showToast('미사용 태그가 일괄 삭제되었습니다.');
      await loadTags();
    } catch {
      showToast('미사용 태그 삭제에 실패했습니다.', 'error');
    }
  };

  const handleMerge = (tag: TagItem) => {
    setMergeSource(tag);
    setMergeTargetId('');
    setOpenMergeDialog(true);
  };

  const confirmMerge = async () => {
    if (!mergeTargetId) {
      showToast('대상 태그를 선택해주세요.', 'error');
      return;
    }
    try {
      await service.tag.mergeTags({
        sourceTagId: mergeSource!.id,
        targetTagId: Number(mergeTargetId),
      });
      showToast('태그가 병합되었습니다.');
      setOpenMergeDialog(false);
      await loadTags();
    } catch {
      showToast('태그 병합에 실패했습니다.', 'error');
    }
  };

  const columns = useMemo(
    () =>
      defineColumns<TagItem>([
        {
          id: 'name',
          headerWord: '태그 이름',
          grow: 1,
          align: 'left',
          format: (value, row) => (
            <span className="inline-flex items-center gap-2">
              {String(value)}
              {row.postCount === 0 && <Badge tone="neutral">미사용</Badge>}
            </span>
          ),
        },
        {
          id: 'postCount',
          headerWord: '포스트 수',
          width: 120,
          align: 'right',
          format: (value, row) =>
            Number(value) > 0 ? (
              <button
                type="button"
                className="cursor-pointer text-dl-primary-ink hover:text-dl-primary-ink hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  searchTagPosts(row);
                }}
              >
                {String(value)}
              </button>
            ) : (
              <span>0</span>
            ),
        },
        {
          id: 'actions' as keyof TagItem & string,
          headerWord: ' ',
          width: 120,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                className="aspect-square p-0 h-7 w-7 cursor-pointer"
                onClick={() => handleEdit(row)}
                aria-label={`${row.name} 수정`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="aspect-square p-0 h-7 w-7 cursor-pointer"
                onClick={() => handleMerge(row)}
                aria-label={`${row.name} 병합`}
              >
                <Merge className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="aspect-square p-0 h-7 w-7 cursor-pointer text-dl-danger hover:text-dl-danger"
                onClick={() => handleDelete(row)}
                aria-label={`${row.name} 삭제`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ),
        },
      ]),
    [],
  );

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'tags');
  const grid = useClientGrid<TagItem>(filteredTags, { paging: settings.paging });

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      {/* 상단 액션 바 */}
      <div className="admin-panel admin-panel-pad mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dl-fg-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="태그 이름으로 검색..."
              className="pl-9 pr-8"
              aria-label="태그 검색"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 hover:bg-dl-option-hover"
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
              >
                <X className="h-3.5 w-3.5 text-dl-fg-muted" />
              </button>
            )}
          </div>

          {/* Switch 는 <button role="switch"> 라 <label> 이 감쌀 수 없다(labelable 요소가 아니다).
              옆 문구는 설명이고, 접근성 이름은 Switch 의 label prop 이 갖는다. */}
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-[color:var(--admin-text-muted)]">
            <Switch
              checked={unusedOnly}
              onCheckedChange={setUnusedOnly}
              label="미사용 태그만 보기"
            />
            미사용 태그만
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline-gray"
              className="cursor-pointer"
              onClick={handleBulkDelete}
              disabled={unusedCount === 0}
              title="미사용 태그가 있을 때 눌러진다"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              미사용 일괄삭제{unusedCount > 0 && ` (${unusedCount})`}
            </Button>
            <Button variant="primary" className="cursor-pointer" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />새 태그
            </Button>
          </div>
        </div>
      </div>

      {/* 태그 테이블 */}
      <div className="admin-panel admin-table-shell">
        <PersistedDataGrid<TagItem>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.id)}
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
        />
      </div>

      {/* 생성/수정 다이얼로그 */}
      <ContentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={dialogMode === 'create' ? '태그 추가' : '태그 수정'}
        size="md"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setOpenDialog(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="tag-name">이름 *</Label>
            <Input
              id="tag-name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="태그 이름"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
        </div>
      </ContentDialog>

      {/* 병합 다이얼로그 */}
      <ContentDialog
        open={openMergeDialog}
        onOpenChange={setOpenMergeDialog}
        title="태그 병합"
        size="md"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setOpenMergeDialog(false)}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={confirmMerge}
              disabled={!mergeTargetId}
              title="대상 태그를 고르면 눌러진다"
            >
              <Merge className="h-4 w-4 mr-1" />
              병합
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-dl-tonal-border bg-dl-tonal p-3 text-sm">
            <span className="text-[color:var(--admin-text-faint)]">병합할 태그: </span>
            <strong className="text-[color:var(--admin-text)]">{mergeSource?.name}</strong>
            {mergeSource && mergeSource.postCount > 0 && (
              <span className="text-[color:var(--admin-text-muted)]">
                {' '}
                (포스트 {mergeSource.postCount}개)
              </span>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="merge-target">대상 태그 *</Label>
            <Select
              id="merge-target"
              value={mergeTargetId}
              onValueChange={setMergeTargetId}
              placeholder="대상 태그를 선택하세요"
              options={mergeTargetOptions.map((t) => ({
                value: String(t.id),
                label: `${t.name} (${t.postCount}개)`,
              }))}
              className="w-full"
            />
          </div>
          <p className="text-sm text-[color:var(--admin-text-muted)]">
            <strong>{mergeSource?.name}</strong>의 포스트가 선택한 대상 태그로 이동되고,{' '}
            <strong>{mergeSource?.name}</strong>은 삭제됩니다.
          </p>
        </div>
      </ContentDialog>
    </AdminPageFrame>
  );
}
