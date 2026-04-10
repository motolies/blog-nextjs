import {BookOpen, Pencil, Trash2} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '../ui/button'
import {Badge} from '../ui/badge'
import {Separator} from '../ui/separator'
import SortablePostList from './SortablePostList'
import PostSearchCombobox from './PostSearchCombobox'
import service from '../../service'
import type {Series} from '@/types/series'
import type React from 'react'

interface SeriesDetailPanelProps {
  series: Series | null
  loading: boolean
  onEdit: (series: Series) => void
  onDelete: (series: Series) => void
  onRefresh: () => void
}

export default function SeriesDetailPanel({
  series,
  loading,
  onEdit,
  onDelete,
  onRefresh,
}: SeriesDetailPanelProps) {
  if (!series) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
        <p className="text-sm text-[color:var(--admin-text-faint)]">시리즈를 선택하세요</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
        <p className="text-sm text-[color:var(--admin-text-faint)]">불러오는 중...</p>
      </div>
    )
  }

  const renderTable = (rows: ([string, React.ReactNode] | false | null | undefined)[]) => (
    <table className="w-full text-sm">
      <tbody>
        {(rows.filter(Boolean) as [string, React.ReactNode][]).map(([label, value], i) => (
          <tr key={i} className="border-b border-[color:var(--admin-border)] last:border-0">
            <td className="w-28 py-1.5 pr-3 align-top font-semibold text-[color:var(--admin-text-faint)]">{label}</td>
            <td className="py-1.5 text-[color:var(--admin-text)]">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const rows: ([string, React.ReactNode] | false | null | undefined)[] = [
    ['제목', series.title],
    series.description && ['설명', series.description],
    ['포스트',
      <Badge key="count" variant={series.posts.length > 0 ? 'default' : 'secondary'} className="text-xs">
        {series.posts.length}개
      </Badge>,
    ],
    ['생성일', new Date(series.created.at).toLocaleDateString('ko-KR')],
  ]

  const excludePostIds = series.posts.map(p => p.postId)

  const handleAddPost = async (post: {postId: number; subject: string}) => {
    try {
      await service.series.addPost({seriesId: String(series.id), postId: String(post.postId)})
      toast.success('포스트가 추가되었습니다.')
      onRefresh()
    } catch {
      toast.error('포스트 추가에 실패했습니다.')
    }
  }

  return (
    <div className="flex h-full flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        <BookOpen className="h-4 w-4 text-sky-700"/>
        <span className="flex-1 text-sm font-semibold text-[color:var(--admin-text)]">
          시리즈 상세
        </span>
        <Badge variant="default" className="text-xs">
          {series.title}
        </Badge>
      </div>
      <Separator/>

      {/* 스크롤 가능 영역 */}
      <div className="flex-1 overflow-auto">
        {/* 상세 정보 */}
        <div className="p-2">
          {renderTable(rows)}
        </div>
        <Separator/>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-1.5 p-3">
          <Button size="sm" variant="outline" onClick={() => onEdit(series)}>
            <Pencil className="h-3.5 w-3.5 mr-1"/>편집
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/20 text-red-600 hover:bg-red-500/8 hover:text-red-700"
            onClick={() => onDelete(series)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1"/>삭제
          </Button>
        </div>
        <Separator/>

        {/* 포스트 목록 */}
        <div className="p-3 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-text-faint)]">
            포스트 ({series.posts.length})
          </span>
          <SortablePostList
            seriesId={series.id}
            posts={series.posts}
            onPostRemoved={onRefresh}
            onPostsReordered={onRefresh}
          />
        </div>
        <Separator/>

        {/* 포스트 추가 */}
        <div className="p-3">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-text-faint)]">
            포스트 추가
          </span>
          <PostSearchCombobox
            excludePostIds={excludePostIds}
            onSelect={handleAddPost}
          />
        </div>
      </div>
    </div>
  )
}
