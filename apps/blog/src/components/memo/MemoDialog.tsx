import { Button, ContentDialog, Label, Select, showToast, Textarea } from '@hvy/ui';
import type React from 'react';
import { useEffect, useState } from 'react';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';

interface MemoCategory {
  id: string | number;
  name: string;
  seq?: number;
}

interface MemoDialogProps {
  open: boolean;
  onClose: () => void;
  memoId?: string | number | null;
  onSaved?: () => void;
}

export default function MemoDialog({ open, onClose, memoId = null, onSaved }: MemoDialogProps) {
  const [content, setContent] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<MemoCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      loadCategories().then((cats) => {
        if (memoId) {
          loadMemo(memoId);
        } else {
          setContent('');
          if (cats.length > 0) {
            const sorted = [...cats].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
            setCategoryId(String(sorted[0].id));
          } else {
            setCategoryId(null);
          }
        }
      });
    }
  }, [open, memoId]);

  const loadCategories = async (): Promise<MemoCategory[]> => {
    try {
      const data = await service.memo.getCategories();
      setCategories(data || []);
      return data || [];
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      return [];
    }
  };

  const loadMemo = async (id: string | number) => {
    try {
      const data = await service.memo.getById(id);
      setContent(data.content || '');
      if (data.category) {
        setCategoryId(String(data.category.id));
      } else {
        setCategoryId(null);
      }
    } catch (error) {
      showApiErrorToast('메모를 불러오는데 실패했습니다.', error);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showToast('메모 내용을 입력해주세요.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = { content: content.trim(), categoryId: categoryId ? Number(categoryId) : null };
      if (memoId) {
        await service.memo.update(memoId, data);
        showToast('메모가 수정되었습니다.');
      } else {
        await service.memo.create(data);
        showToast('메모가 저장되었습니다.');
      }
      onSaved?.();
      onClose();
    } catch (error) {
      showApiErrorToast('메모 저장에 실패했습니다.', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentDialog
      open={open}
      onOpenChange={(isOpen: boolean) => !isOpen && onClose()}
      title={memoId ? '메모 수정' : '메모 작성'}
      size="lg"
      footer={
        <>
          <Button variant="outline-gray" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave} busy={loading}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="memo-category">카테고리</Label>
          <Select
            id="memo-category"
            value={categoryId ?? ''}
            onValueChange={(val: string) => setCategoryId(val || null)}
            placeholder="카테고리 선택"
            size="sm"
            options={categories
              .slice()
              .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
              .map((cat) => ({ value: String(cat.id), label: cat.name }))}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="memo-content">내용</Label>
          <Textarea
            id="memo-content"
            autoFocus
            placeholder="메모 내용을 입력하세요..."
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            className="min-h-[200px] resize-y"
            rows={8}
          />
        </div>
      </div>
    </ContentDialog>
  );
}
