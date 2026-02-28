import React, {useState, useEffect} from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {toast} from 'sonner'
import service from '../../service'

export default function MemoDialog({open, onClose, memoId = null, onSaved}) {
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadCategories().then(cats => {
        if (memoId) {
          loadMemo(memoId)
        } else {
          setContent('')
          if (cats.length > 0) {
            const sorted = [...cats].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
            setCategoryId(String(sorted[0].id))
          } else {
            setCategoryId(null)
          }
        }
      })
    }
  }, [open, memoId])

  const loadCategories = async () => {
    try {
      const data = await service.memo.getCategories()
      setCategories(data || [])
      return data || []
    } catch (error) {
      console.error('카테고리 로드 실패:', error)
      return []
    }
  }

  const loadMemo = async (id) => {
    try {
      const data = await service.memo.getById(id)
      setContent(data.content || '')
      if (data.category) {
        setCategoryId(String(data.category.id))
      } else {
        setCategoryId(null)
      }
    } catch (error) {
      toast.error('메모를 불러오는데 실패했습니다.')
    }
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.warning('메모 내용을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const data = {content: content.trim(), categoryId: categoryId ? Number(categoryId) : null}
      if (memoId) {
        await service.memo.update(memoId, data)
        toast.success('메모가 수정되었습니다.')
      } else {
        await service.memo.create(data)
        toast.success('메모가 저장되었습니다.')
      }
      onSaved?.()
      onClose()
    } catch (error) {
      toast.error('메모 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>{memoId ? '메모 수정' : '메모 작성'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="memo-category">카테고리</Label>
            <Select
              value={categoryId ?? ''}
              onValueChange={(val) => setCategoryId(val || null)}
            >
              <SelectTrigger id="memo-category" size="sm" className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .slice()
                  .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
                  .map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="memo-content">내용</Label>
            <Textarea
              id="memo-content"
              autoFocus
              placeholder="메모 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-y"
              rows={8}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
