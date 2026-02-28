import React, {useState, useEffect, useMemo, useCallback} from 'react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../../components/ui/tabs'
import {toast} from 'sonner'
import {Plus, Trash2} from 'lucide-react'
import ShadcnDataTable from '../../components/common/ShadcnDataTable'
import {Button} from '../../components/ui/button'
import MemoDialog from '../../components/memo/MemoDialog'
import CategoryManagementPanel from '../../components/memo/CategoryManagementPanel'
import DeleteConfirm from '../../components/confirm/DeleteConfirm'
import service from '../../service'
import AdminPageFrame from '../../components/layout/admin/AdminPageFrame'

export default function MemoPage() {
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
      mobileLabel: '카테고리',
      cell: ({value}) => value?.name || '-',
    },
    {
      accessorKey: 'content',
      header: '내용',
      grow: true,
      mobilePrimary: true,
      mobileLabel: '메모',
      cell: ({value, row}) => {
        const text = value || ''
        const display = text.length > 100 ? text.substring(0, 100) + '...' : text
        return (
          <div
            className="cursor-pointer hover:text-sky-700"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(row)
            }}
          >
            {display}
          </div>
        )
      }
    },
    {
      accessorKey: 'created',
      header: '작성일',
      size: 160,
      mobileLabel: '작성일',
      cell: ({value}) => {
        const val = value
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
      toast.success('메모가 삭제되었습니다.')
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      toast.error('메모 삭제에 실패했습니다.')
    }
  }

  const handleMemoSaved = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <AdminPageFrame
      actions={(
        <Button onClick={() => setMemoDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4"/>
          메모 추가
        </Button>
      )}
    >
      <Tabs defaultValue="memos" className="mb-2">
        <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-2xl border border-[color:var(--admin-border)] bg-white/70 p-1.5 shadow-sm">
          <TabsTrigger
            value="memos"
            className="flex-none rounded-xl px-4 py-2 text-[color:var(--admin-text-secondary)] hover:bg-sky-600/8 hover:text-sky-700 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_10px_24px_rgba(14,116,228,0.22)]"
          >
            메모 목록
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="flex-none rounded-xl px-4 py-2 text-[color:var(--admin-text-secondary)] hover:bg-sky-600/8 hover:text-sky-700 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_10px_24px_rgba(14,116,228,0.22)]"
          >
            카테고리 관리
          </TabsTrigger>
        </TabsList>
        <TabsContent value="memos">
          <div className="admin-panel admin-table-shell">
            <ShadcnDataTable
              columns={columns}
              fetchData={fetchMemos}
              searchFields={searchFields}
              defaultPageSize={10}
              enableDynamicSearch={true}
              enableRowActions={true}
              positionActionsColumn="last"
              renderRowActions={({row}) => (
                <div className="flex gap-1">
                  {!row.original.deleted && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(row.original)} title="삭제" className="h-7 w-7 text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  )}
                </div>
              )}
            />
          </div>
        </TabsContent>
        <TabsContent value="categories">
          <div className="admin-panel admin-panel-pad">
            <CategoryManagementPanel/>
          </div>
        </TabsContent>
      </Tabs>

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
    </AdminPageFrame>
  )
}
