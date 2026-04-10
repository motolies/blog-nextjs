import {useCallback, useState} from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {restrictToVerticalAxis} from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {GripVertical, X} from 'lucide-react'
import {toast} from 'sonner'
import {Button} from '../ui/button'
import {cn} from '../../lib/utils'
import service from '../../service'
import type {SeriesPost} from '@/types/series'

interface SortablePostListProps {
  seriesId: number
  posts: SeriesPost[]
  onPostRemoved: () => void
  onPostsReordered: () => void
}

function SortablePostItem({post, index, onRemove}: {
  post: SeriesPost
  index: number
  onRemove: (postId: number) => void
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: post.postId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
        'border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-ring',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-0.5 text-[color:var(--admin-text-faint)] hover:text-[color:var(--admin-text-muted)] active:cursor-grabbing"
        aria-label={`${post.subject} 순서 변경`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4"/>
      </button>
      <span className="w-5 shrink-0 text-right text-xs font-medium tabular-nums text-[color:var(--admin-text-faint)]">
        {index + 1}.
      </span>
      <span className="flex-1 truncate text-sm text-[color:var(--admin-text)]">
        {post.subject}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 cursor-pointer text-[color:var(--admin-text-faint)] hover:text-destructive"
        onClick={() => onRemove(post.postId)}
        aria-label={`${post.subject} 시리즈에서 제거`}
      >
        <X className="h-3.5 w-3.5"/>
      </Button>
    </div>
  )
}

export default function SortablePostList({seriesId, posts: initialPosts, onPostRemoved, onPostsReordered}: SortablePostListProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [removingId, setRemovingId] = useState<number | null>(null)

  // 외부에서 posts prop이 변경되면 동기화
  if (initialPosts !== posts && JSON.stringify(initialPosts) !== JSON.stringify(posts)) {
    setPosts(initialPosts)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return

    const oldIndex = posts.findIndex(p => p.postId === active.id)
    const newIndex = posts.findIndex(p => p.postId === over.id)
    const reordered = arrayMove(posts, oldIndex, newIndex)
    const previousPosts = posts

    setPosts(reordered)

    try {
      await service.series.reorderPosts({
        seriesId: String(seriesId),
        postIds: reordered.map(p => p.postId),
      })
      toast.success('포스트 순서가 변경되었습니다.')
      onPostsReordered()
    } catch {
      setPosts(previousPosts)
      toast.error('순서 변경에 실패했습니다.')
    }
  }, [posts, seriesId, onPostsReordered])

  const handleRemove = useCallback(async (postId: number) => {
    setRemovingId(postId)
    try {
      await service.series.removePost({seriesId: String(seriesId), postId: String(postId)})
      toast.success('포스트가 시리즈에서 제거되었습니다.')
      onPostRemoved()
    } catch {
      toast.error('포스트 제거에 실패했습니다.')
    } finally {
      setRemovingId(null)
    }
  }, [seriesId, onPostRemoved])

  if (posts.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[color:var(--admin-text-faint)]">
        포스트가 없습니다. 아래에서 포스트를 검색하여 추가하세요.
      </p>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={posts.map(p => p.postId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {posts.map((post, index) => (
            <SortablePostItem
              key={post.postId}
              post={post}
              index={index}
              onRemove={removingId === post.postId ? () => {} : handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
