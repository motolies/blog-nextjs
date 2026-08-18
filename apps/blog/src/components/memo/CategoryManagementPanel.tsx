import {
  Button,
  ContentDialog,
  DataGrid,
  defineColumns,
  Input,
  Label,
  showToast,
  useConfirm,
} from '@hvy/ui';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { useClientGrid } from '@/hooks/useClientGrid';
import service from '@/service';

interface MemoCategory {
  id: string | number;
  name: string;
  seq: number;
  [key: string]: unknown;
}

export default function CategoryManagementPanel() {
  const askConfirm = useConfirm();
  const [categories, setCategories] = useState<MemoCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<MemoCategory | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formSeq, setFormSeq] = useState<number>(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await service.memo.getCategories();
      setCategories(data || []);
    } catch (error) {
      showToast('카테고리 목록을 불러오는데 실패했습니다.', 'error');
    }
  };

  const columns = useMemo(
    () =>
      defineColumns<MemoCategory>([
        { id: 'id', headerWord: 'ID', width: 80, align: 'left' },
        { id: 'name', headerWord: '이름', grow: 1, align: 'left' },
        { id: 'seq', headerWord: '순서', width: 80, align: 'left' },
        {
          id: 'actions' as keyof MemoCategory & string,
          headerWord: ' ',
          width: 80,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                onClick={() => handleEdit(row)}
                title="수정"
                className="aspect-square p-0 h-7 w-7"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDeleteClick(row)}
                title="삭제"
                className="aspect-square p-0 h-7 w-7 text-dl-danger hover:text-dl-danger-hover"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ),
        },
      ]),
    [],
  );

  const grid = useClientGrid<MemoCategory>(categories, { paginate: false });

  const handleAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSeq(0);
    setDialogOpen(true);
  };

  const handleEdit = (row: MemoCategory) => {
    setEditingCategory(row);
    setFormName(row.name);
    setFormSeq(row.seq);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast('카테고리 이름을 입력해주세요.', 'warning');
      return;
    }

    try {
      if (editingCategory) {
        await service.memo.updateCategory(editingCategory.id, {
          name: formName.trim(),
          seq: formSeq,
        });
        showToast('카테고리가 수정되었습니다.');
      } else {
        await service.memo.createCategory({ name: formName.trim(), seq: formSeq });
        showToast('카테고리가 생성되었습니다.');
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error) {
      showToast('카테고리 저장에 실패했습니다.', 'error');
    }
  };

  const handleDeleteClick = async (row: MemoCategory) => {
    const ok = await askConfirm({
      message: `'${row.name}' 카테고리를 삭제하시겠습니까?`,
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.memo.deleteCategory(row.id);
      showToast('카테고리가 삭제되었습니다.');
      loadCategories();
    } catch (error) {
      showToast('카테고리 삭제에 실패했습니다. 연결된 메모가 있는지 확인해주세요.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          카테고리 추가
        </Button>
      </div>

      <DataGrid<MemoCategory>
        columns={columns}
        rows={grid.rows}
        getRowId={(row) => String(row.id)}
        empty={GRID_EMPTY}
        sortOf={grid.sortOf}
        onToggleSort={grid.toggleSort}
      />

      <ContentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
        size="md"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave}>
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cat-name">이름</Label>
            <Input
              id="cat-name"
              autoFocus
              value={formName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cat-seq">순서</Label>
            <Input
              id="cat-seq"
              type="number"
              value={formSeq}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormSeq(parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
        </div>
      </ContentDialog>
    </div>
  );
}
