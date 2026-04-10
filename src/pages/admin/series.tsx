import {useCallback, useEffect, useMemo, useState} from 'react'
import {toast} from 'sonner'
import {BookOpen, Plus, Save, Search, X} from 'lucide-react'
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame'
import SeriesDetailPanel from '@/components/series/SeriesDetailPanel'
import DeleteConfirm from '@/components/confirm/DeleteConfirm'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Badge} from '@/components/ui/badge'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {cn} from '@/lib/utils'
import service from '@/service'
import type {Series, SeriesSummary} from '@/types/series'

export default function SeriesPage() {
  // 목록 상태
  const [seriesList, setSeriesList] = useState<SeriesSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 선택/상세 상태
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Dialog 상태
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [formData, setFormData] = useState({title: '', description: ''})

  // 삭제 확인 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Series | SeriesSummary | null>(null)

  // 데이터 로드
  const loadSeriesList = useCallback(async () => {
    try {
      const res = await service.series.getAll()
      setSeriesList(res.data ?? [])
    } catch {
      toast.error('시리즈 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSeriesDetail = useCallback(async (id: number) => {
    setDetailLoading(true)
    try {
      const res = await service.series.getDetail({seriesId: String(id)})
      setSelectedSeries(res.data)
    } catch {
      toast.error('시리즈 상세를 불러오지 못했습니다.')
      setSelectedSeries(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSeriesList()
  }, [loadSeriesList])

  // 필터링
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return seriesList
    const q = searchQuery.toLowerCase()
    return seriesList.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q),
    )
  }, [seriesList, searchQuery])

  // 시리즈 선택
  const handleSelectSeries = (s: SeriesSummary) => {
    setSelectedSeriesId(s.id)
    loadSeriesDetail(s.id)
  }

  // 상세 + 목록 새로고침
  const handleRefresh = useCallback(async () => {
    if (selectedSeriesId) {
      await Promise.all([loadSeriesDetail(selectedSeriesId), loadSeriesList()])
    }
  }, [selectedSeriesId, loadSeriesDetail, loadSeriesList])

  // 생성
  const handleCreate = () => {
    setDialogMode('create')
    setFormData({title: '', description: ''})
    setOpenDialog(true)
  }

  // 편집
  const handleEdit = (series: Series) => {
    setDialogMode('edit')
    setFormData({title: series.title, description: series.description ?? ''})
    setOpenDialog(true)
  }

  // 저장 (생성/수정)
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('시리즈 제목은 필수입니다.')
      return
    }
    try {
      if (dialogMode === 'create') {
        const res = await service.series.create({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        })
        toast.success('시리즈가 생성되었습니다.')
        setOpenDialog(false)
        await loadSeriesList()
        // 생성된 시리즈 자동 선택
        const created = res.data
        if (created?.id) {
          setSelectedSeriesId(created.id)
          setSelectedSeries(created)
        }
      } else {
        await service.series.update({
          seriesId: String(selectedSeries!.id),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        })
        toast.success('시리즈가 수정되었습니다.')
        setOpenDialog(false)
        await Promise.all([loadSeriesList(), loadSeriesDetail(selectedSeries!.id)])
      }
    } catch {
      toast.error(dialogMode === 'create' ? '시리즈 생성에 실패했습니다.' : '시리즈 수정에 실패했습니다.')
    }
  }

  // 삭제
  const handleDelete = (series: Series | SeriesSummary) => {
    setDeleteTarget(series)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    try {
      await service.series.delete({seriesId: String(deleteTarget!.id)})
      toast.success('시리즈가 삭제되었습니다.')
      if (selectedSeriesId === deleteTarget!.id) {
        setSelectedSeriesId(null)
        setSelectedSeries(null)
      }
      await loadSeriesList()
    } catch {
      toast.error('시리즈 삭제에 실패했습니다.')
    }
    setDeleteTarget(null)
  }

  const deleteQuestion = deleteTarget
    ? `"${deleteTarget.title}" 시리즈를 삭제하시겠습니까?` +
      (('postCount' in deleteTarget ? deleteTarget.postCount : ('posts' in deleteTarget ? deleteTarget.posts?.length : 0)) > 0
        ? ' 포함된 포스트의 시리즈 연결이 해제됩니다.'
        : '')
    : ''

  return (
    <AdminPageFrame
      className="admin-page-frame--fixed"
      actions={
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1"/>새 시리즈
        </Button>
      }
    >
      {/* 검색 바 */}
      <div className="admin-panel admin-panel-pad mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="시리즈 이름으로 검색..."
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground"/>
            </button>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠: 마스터-디테일 */}
      <div className="admin-split-layout admin-fill" data-size="wide">
        {/* 좌측: 시리즈 목록 */}
        <div className="admin-panel admin-fill min-w-0 overflow-hidden">
          <div className="h-full overflow-auto p-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-[color:var(--admin-text-faint)]">불러오는 중...</p>
            ) : filteredList.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="space-y-2 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-[color:var(--admin-text-faint)] opacity-50"/>
                  <p className="text-sm text-[color:var(--admin-text-faint)]">
                    {searchQuery ? '검색 결과가 없습니다.' : '시리즈가 없습니다.'}
                  </p>
                  {!searchQuery && (
                    <Button size="sm" onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-1"/>첫 시리즈 만들기
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredList.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSeries(s)}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2.5 transition-colors duration-150',
                      'hover:bg-[color:var(--admin-canvas-strong)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      selectedSeriesId === s.id && 'bg-[color:var(--admin-canvas-strong)] ring-1 ring-[color:var(--admin-border-strong)]',
                    )}
                    aria-current={selectedSeriesId === s.id ? 'true' : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[color:var(--admin-text)]">
                        {s.title}
                      </span>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {s.postCount}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[color:var(--admin-text-muted)]">
                        {s.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 시리즈 상세 */}
        <div className="admin-panel admin-fill overflow-hidden">
          <SeriesDetailPanel
            series={selectedSeries}
            loading={detailLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? '시리즈 추가' : '시리즈 수정'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="series-title">제목 *</Label>
              <Input
                id="series-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                placeholder="시리즈 제목"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="series-description">설명</Label>
              <Textarea
                id="series-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="시리즈에 대한 간단한 설명 (선택사항)"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1"/>저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <DeleteConfirm
        open={showDeleteConfirm}
        question={deleteQuestion}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteTarget(null)
        }}
      />
    </AdminPageFrame>
  )
}
