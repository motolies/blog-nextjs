import React, {useState, useEffect, useMemo} from 'react'
import {Plus, Pencil, Trash2} from 'lucide-react'
import {toast} from 'sonner'
import ShadcnDataTable from '../common/ShadcnDataTable'
import {Button} from '../ui/button'
import {Input} from '../ui/input'
import {Label} from '../ui/label'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../ui/dialog'
import DeleteConfirm from '../confirm/DeleteConfirm'
import service from '../../service'

export default function CategoryManagementPanel() {
  const [categories, setCategories] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formName, setFormName] = useState('')
  const [formSeq, setFormSeq] = useState(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await service.memo.getCategories()
      setCategories(data || [])
    } catch (error) {
      toast.error('카테고리 목록을 불러오는데 실패했습니다.')
    }
  }

  const columns = useMemo(() => [
    {accessorKey: 'id', header: 'ID', size: 80, mobileHidden: true},
    {accessorKey: 'name', header: '이름', grow: true, mobilePrimary: true, mobileLabel: '카테고리'},
    {accessorKey: 'seq', header: '순서', size: 80, mobileLabel: '정렬'},
  ], [])

  const handleAdd = () => {
    setEditingCategory(null)
    setFormName('')
    setFormSeq(0)
    setDialogOpen(true)
  }

  const handleEdit = (row) => {
    setEditingCategory(row)
    setFormName(row.name)
    setFormSeq(row.seq)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.warning('카테고리 이름을 입력해주세요.')
      return
    }

    try {
      if (editingCategory) {
        await service.memo.updateCategory(editingCategory.id, {name: formName.trim(), seq: formSeq})
        toast.success('카테고리가 수정되었습니다.')
      } else {
        await service.memo.createCategory({name: formName.trim(), seq: formSeq})
        toast.success('카테고리가 생성되었습니다.')
      }
      setDialogOpen(false)
      loadCategories()
    } catch (error) {
      toast.error('카테고리 저장에 실패했습니다.')
    }
  }

  const handleDeleteClick = (row) => {
    setDeleteTarget(row)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false)
    try {
      await service.memo.deleteCategory(deleteTarget.id)
      toast.success('카테고리가 삭제되었습니다.')
      loadCategories()
    } catch (error) {
      toast.error('카테고리 삭제에 실패했습니다. 연결된 메모가 있는지 확인해주세요.')
    }
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1"/>
          카테고리 추가
        </Button>
      </div>

      <ShadcnDataTable
        paginationMode="client"
        clientSideData={categories}
        columns={columns}
        hidePagination={true}
        enableRowActions={true}
        positionActionsColumn="last"
        renderRowActions={({row}) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} title="수정" className="h-7 w-7">
              <Pencil className="h-4 w-4"/>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(row.original)} title="삭제" className="h-7 w-7 text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4"/>
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '카테고리 수정' : '카테고리 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cat-name">이름</Label>
              <Input
                id="cat-name"
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-seq">순서</Label>
              <Input
                id="cat-seq"
                type="number"
                value={formSeq}
                onChange={(e) => setFormSeq(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={deleteConfirmOpen}
        question={`'${deleteTarget?.name}' 카테고리를 삭제하시겠습니까?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  )
}
