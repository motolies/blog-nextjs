'use client';

import { Button, ContentDialog, Input, Label, showToast, useConfirm } from '@hvy/ui';
import { Plus, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import CategoryAutoComplete from '@/components/CategoryAutoComplete';
import CategoryTreeView, {
  type CategoryTreeNodeView,
  categorySearchFields,
  getCategoryRowId,
} from '@/components/CategoryTreeView';
import CategoryDetailPanel from '@/components/category/CategoryDetailPanel';
import TreeSearchBar from '@/components/common/tree/TreeSearchBar';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useCategoryTree, useInvalidateCategories } from '@/hooks/useCategories';
import { useTreeSearch } from '@/hooks/useTreeSearch';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { isSameEntityId } from '@/lib/combobox';
import service from '@/service';

interface CategoryNode {
  id: string;
  name: string;
  parentId: string;
  children?: CategoryNode[];
}

export default function CategoriesPage() {
  const askConfirm = useConfirm();
  const { data: categoryTree } = useCategoryTree();
  const invalidateCategories = useInvalidateCategories();

  // 선택은 id 로만 들고 원본 트리에서 되찾는다. 노드 객체를 그대로 저장하면 검색 필터가
  // 만든 클론(자식이 걸러진)이 들어와 상세 패널의 "하위 카테고리 N개" 가 틀어진다.
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 트리 검색 — 검색어와 펼침 상태를 함께 소유한다.
  const nodes = useMemo(
    () => (categoryTree ? [categoryTree as unknown as CategoryTreeNodeView] : []),
    [categoryTree],
  );
  const search = useTreeSearch(nodes, getCategoryRowId, categorySearchFields);

  const selectedNode = useMemo<CategoryNode | null>(
    () => (selectedNodeId ? findNodeById(categoryTree as any, selectedNodeId) : null),
    [categoryTree, selectedNodeId],
  );

  // 다이얼로그
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'addChild' | 'edit' | null>(null);
  const [formData, setFormData] = useState({ name: '', parentId: 'ROOT' });
  const [dialogParentNode, setDialogParentNode] = useState<CategoryNode | null>(null);

  // 선택된 노드의 부모 이름 조회
  const parentName = useMemo(() => {
    if (!selectedNode?.parentId || !categoryTree) return null;
    const parent = findNodeById(categoryTree as any, selectedNode.parentId);
    return parent?.name || null;
  }, [selectedNode, categoryTree]);

  const refresh = () => {
    invalidateCategories();
  };

  // 최상위 카테고리 추가
  const handleAddRoot = () => {
    setDialogMode('add');
    setDialogParentNode(null);
    setFormData({ name: '', parentId: 'ROOT' });
    setOpenDialog(true);
  };

  // 하위 카테고리 추가
  const handleAddChild = (node: CategoryNode) => {
    setDialogMode('addChild');
    setDialogParentNode(node);
    setFormData({ name: '', parentId: node.id });
    setOpenDialog(true);
  };

  // 편집
  const handleEdit = (node: CategoryNode) => {
    setDialogMode('edit');
    setDialogParentNode(null);
    setFormData({ name: node.name, parentId: node.parentId });
    setOpenDialog(true);
  };

  // 삭제
  const handleDelete = async (node: CategoryNode) => {
    const ok = await askConfirm({
      message: `${node.name} 카테고리를 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.category.delete({ id: node.id });
      showToast('카테고리가 삭제되었습니다.');
      if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
      }
      refresh();
    } catch (error) {
      showApiErrorToast('카테고리 삭제에 실패하였습니다.', error);
    }
  };

  // 부모 카테고리 변경 (편집 모드)
  const onChangeParentCategory = (parentCategory: any) => {
    if (isSameEntityId(parentCategory?.id, selectedNode?.id)) {
      showToast('동일 카테고리는 부모 카테고리에 설정할 수 없습니다.', 'error');
      return;
    }
    if (parentCategory !== null) {
      setFormData((prev) => ({ ...prev, parentId: parentCategory.id }));
    }
  };

  // 저장
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showToast('카테고리 이름은 필수입니다.', 'error');
      return;
    }

    try {
      if (dialogMode === 'add' || dialogMode === 'addChild') {
        const category = {
          id: 'NEW',
          name: formData.name.trim(),
          parentId: formData.parentId,
        };
        await service.category.save({ category });
        showToast('카테고리가 저장되었습니다.');
      } else if (dialogMode === 'edit') {
        const category = {
          ...selectedNode,
          name: formData.name.trim(),
          parentId: formData.parentId,
        };
        await service.category.update({ category });
        showToast('카테고리가 수정되었습니다.');
      }
      // 방금 만든 카테고리가 검색어와 맞지 않으면 화면에 나타나지 않는다 — 생성일 때만 필터를 푼다.
      if (dialogMode !== 'edit') search.clearQuery();

      setOpenDialog(false);
      refresh();
    } catch (error) {
      showApiErrorToast(
        dialogMode === 'edit'
          ? '카테고리 수정에 실패하였습니다.'
          : '카테고리 저장에 실패하였습니다.',
        error,
      );
    }
  };

  const dialogTitle =
    {
      add: '카테고리 추가',
      addChild: '하위 카테고리 추가',
      edit: '카테고리 편집',
    }[dialogMode as string] || '';

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      {/* 검색 바 — 액션은 이 줄의 지정 슬롯에 둔다(그리드 화면의 툴바 액션과 같은 층). */}
      <TreeSearchBar
        value={search.query}
        onChange={search.setQuery}
        onClear={search.clearQuery}
        placeholder="카테고리 이름으로 검색..."
        label="카테고리 검색"
        resultCount={search.isSearching ? search.matchCount : null}
        actions={
          <Button variant="primary" onClick={handleAddRoot} icon={Plus}>
            카테고리 추가
          </Button>
        }
      />

      {/* 메인 콘텐츠 */}
      <div className="admin-split-layout admin-fill" data-size="wide">
        {/* 좌측: 트리 뷰 */}
        <div className="admin-panel admin-fill min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto p-2">
            <CategoryTreeView
              nodes={search.nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              expanded={search.expanded}
              onToggle={search.toggle}
              query={search.query}
              isSearching={search.isSearching}
            />
          </div>
        </div>

        {/* 우측: 상세 패널 */}
        <div className="admin-panel admin-fill overflow-hidden">
          <CategoryDetailPanel
            selectedNode={selectedNode}
            parentName={parentName}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        </div>
      </div>

      {/* 추가/편집 다이얼로그 */}
      <ContentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={dialogTitle}
        size="md"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setOpenDialog(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} icon={Save}>
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          {dialogMode === 'addChild' && dialogParentNode && (
            <div className="rounded-dl-container border border-dl-tonal-border bg-dl-tonal p-3 text-dl-sm">
              <span className="text-[color:var(--admin-text-faint)]">부모 카테고리: </span>
              <strong className="text-[color:var(--admin-text)]">{dialogParentNode.name}</strong>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="category-name">이름 *</Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="카테고리 이름"
              autoFocus
            />
          </div>
          {dialogMode === 'edit' && (
            <div className="space-y-1">
              <Label htmlFor="category-parent">부모 카테고리</Label>
              <CategoryAutoComplete
                id="category-parent"
                onChangeCategory={onChangeParentCategory}
                setCategoryId={formData.parentId}
                label="부모 카테고리"
              />
            </div>
          )}
        </div>
      </ContentDialog>
    </AdminPageFrame>
  );
}

function findNodeById(node: any, id: string): any {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}
