import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react'
import {Box, Tabs, Tab, IconButton} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {useSnackbar} from 'notistack'
import MRTTable from '../../components/common/MRTTable'
import MemoDialog from '../../components/memo/MemoDialog'
import CategoryManagementPanel from '../../components/memo/CategoryManagementPanel'
import DeleteConfirm from '../../components/confirm/DeleteConfirm'
import service from '../../service'

export default function MemoPage() {
  const {enqueueSnackbar} = useSnackbar()
  const [tabIndex, setTabIndex] = useState(0)
  const [memoDialogOpen, setMemoDialogOpen] = useState(false)
  const [editingMemoId, setEditingMemoId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [categories, setCategories] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await service.memo.getCategories()
      setCategories(data || [])
    } catch (error) {
      console.error('카테고리 로드 실패:', error)
    }
  }

  const categoryOptions = useMemo(() =>
    categories.map(c => ({value: c.id, label: c.name})),
    [categories]
  )

  const columns = useMemo(() => [
    {
      accessorKey: 'category',
      header: '카테고리',
      size: 120,
      Cell: ({cell}) => cell.getValue()?.name || '-'
    },
    {
      accessorKey: 'content',
      header: '내용',
      grow: true,
      Cell: ({cell, row}) => {
        const text = cell.getValue() || ''
        const display = text.length > 100 ? text.substring(0, 100) + '...' : text
        return (
          <Box
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row.original)
            }}
            sx={{cursor: 'pointer', '&:hover': {color: 'primary.main'}}}
          >
            {display}
          </Box>
        )
      }
    },
    {
      accessorKey: 'created',
      header: '작성일',
      size: 160,
      Cell: ({cell}) => {
        const val = cell.getValue()
        if (!val?.at) return '-'
        const d = new Date(val.at)
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      }
    },
  ], [])

  const searchFields = useMemo(() => [
    {name: 'keyword', label: '키워드', pinned: true},
    {name: 'categoryId', label: '카테고리', type: 'select', options: categoryOptions},
    {name: 'includeDeleted', label: '삭제 여부', type: 'select', defaultValue: true, options: [{value: true, label: '포함'}, {value: false, label: '미포함'}]},
  ], [categoryOptions])

  const fetchMemos = useCallback((searchRequest) =>
    service.memo.search({searchRequest}),
    [refreshKey]
  )

  const handleEdit = (row) => {
    setEditingMemoId(row.id)
    setMemoDialogOpen(true)
  }

  const handleDeleteClick = (row) => {
    setDeleteTarget(row)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false)
    try {
      await service.memo.delete(deleteTarget.id)
      enqueueSnackbar('메모가 삭제되었습니다.', {variant: 'success'})
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      enqueueSnackbar('메모 삭제에 실패했습니다.', {variant: 'error'})
    }
  }

  const handleMemoSaved = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <Box sx={{width: '85vw', mx: 'auto'}}>
      <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)} sx={{mb: 2}}>
        <Tab label="메모 목록"/>
        <Tab label="카테고리 관리"/>
      </Tabs>

      {tabIndex === 0 && (
        <MRTTable
          key={refreshKey}
          columns={columns}
          fetchData={fetchMemos}
          searchFields={searchFields}
          defaultPageSize={10}
          enableDynamicSearch={true}
          enableRowActions={true}
          positionActionsColumn="last"
          displayColumnDefOptions={{
            'mrt-row-actions': {size: 80, minSize: 80, grow: false},
          }}
          renderRowActions={({row}) => (
            <Box sx={{display: 'flex', gap: 0.5}}>

              {!row.original.deleted && (
                <IconButton size="small" onClick={() => handleDeleteClick(row.original)} title="삭제" color="error">
                  <DeleteIcon fontSize="small"/>
                </IconButton>
              )}
            </Box>
          )}
        />
      )}

      {tabIndex === 1 && <CategoryManagementPanel/>}

      <MemoDialog
        open={memoDialogOpen}
        onClose={() => {
          setMemoDialogOpen(false)
          setEditingMemoId(null)
        }}
        memoId={editingMemoId}
        onSaved={handleMemoSaved}
      />

      <DeleteConfirm
        open={deleteConfirmOpen}
        question="이 메모를 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  )
}
