import React, {useState, useEffect, useMemo} from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {useSnackbar} from 'notistack'
import MRTTable from '../common/MRTTable'
import DeleteConfirm from '../confirm/DeleteConfirm'
import service from '../../service'

export default function CategoryManagementPanel() {
  const {enqueueSnackbar} = useSnackbar()
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
      enqueueSnackbar('카테고리 목록을 불러오는데 실패했습니다.', {variant: 'error'})
    }
  }

  const columns = useMemo(() => [
    {accessorKey: 'id', header: 'ID', size: 80},
    {accessorKey: 'name', header: '이름', grow: true},
    {accessorKey: 'seq', header: '순서', size: 80},
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
      enqueueSnackbar('카테고리 이름을 입력해주세요.', {variant: 'warning'})
      return
    }

    try {
      if (editingCategory) {
        await service.memo.updateCategory(editingCategory.id, {name: formName.trim(), seq: formSeq})
        enqueueSnackbar('카테고리가 수정되었습니다.', {variant: 'success'})
      } else {
        await service.memo.createCategory({name: formName.trim(), seq: formSeq})
        enqueueSnackbar('카테고리가 생성되었습니다.', {variant: 'success'})
      }
      setDialogOpen(false)
      loadCategories()
    } catch (error) {
      enqueueSnackbar('카테고리 저장에 실패했습니다.', {variant: 'error'})
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
      enqueueSnackbar('카테고리가 삭제되었습니다.', {variant: 'success'})
      loadCategories()
    } catch (error) {
      enqueueSnackbar('카테고리 삭제에 실패했습니다. 연결된 메모가 있는지 확인해주세요.', {variant: 'error'})
    }
  }

  return (
    <Box>
      <Box sx={{mb: 2, display: 'flex', justifyContent: 'flex-end'}}>
        <Button variant="contained" startIcon={<AddIcon/>} onClick={handleAdd} size="small">
          카테고리 추가
        </Button>
      </Box>

      <MRTTable
        paginationMode="client"
        clientSideData={categories}
        columns={columns}
        hidePagination={true}
        density="compact"
        enableRowActions={true}
        positionActionsColumn="last"
        renderRowActions={({row}) => (
          <Box sx={{display: 'flex', gap: 0.5}}>
            <IconButton size="small" onClick={() => handleEdit(row.original)} title="수정">
              <EditIcon fontSize="small"/>
            </IconButton>
            <IconButton size="small" onClick={() => handleDeleteClick(row.original)} title="삭제" color="error">
              <DeleteIcon fontSize="small"/>
            </IconButton>
          </Box>
        )}
      />

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCategory ? '카테고리 수정' : '카테고리 추가'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="이름"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            sx={{mt: 1, mb: 2}}
            size="small"
          />
          <TextField
            fullWidth
            label="순서"
            type="number"
            value={formSeq}
            onChange={(e) => setFormSeq(parseInt(e.target.value) || 0)}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button onClick={handleSave} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 */}
      <DeleteConfirm
        open={deleteConfirmOpen}
        question={`'${deleteTarget?.name}' 카테고리를 삭제하시겠습니까?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  )
}
