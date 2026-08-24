import { Badge, Button, EmptyState, FieldValue, FormGrid, Spinner, showToast } from '@hvy/ui';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';
import type { Series } from '@/types/series';
import { parseServerDate } from '@/util/dateTimeUtil';
import PostSearchCombobox from './PostSearchCombobox';
import SortablePostList from './SortablePostList';

interface SeriesDetailPanelProps {
  series: Series | null;
  loading: boolean;
  onEdit: (series: Series) => void;
  onDelete: (series: Series) => void;
  onRefresh: () => void;
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
        <EmptyState message="시리즈를 선택하세요" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
        <Spinner className="size-6" />
      </div>
    );
  }

  // 라벨·값 쌍은 표가 아니라 상세 폼이다 — FormGrid + FieldValue 계약을 따른다.
  const renderDetails = (rows: ([string, React.ReactNode] | false | null | undefined)[]) => (
    <FormGrid>
      {(rows.filter(Boolean) as [string, React.ReactNode][]).map(([label, value]) => (
        <FieldValue key={label} label={label} size="sm">
          {value}
        </FieldValue>
      ))}
    </FormGrid>
  );

  const rows: ([string, React.ReactNode] | false | null | undefined)[] = [
    ['제목', series.title],
    series.description && ['설명', series.description],
    [
      '포스트',
      <Badge key="count" tone={series.posts.length > 0 ? 'primary' : 'neutral'} className="text-xs">
        {series.posts.length}개
      </Badge>,
    ],
    ['생성일', parseServerDate(series.created.at)?.toLocaleDateString('ko-KR') ?? '-'],
  ];

  const excludePostIds = series.posts.map((p) => p.postId);

  const handleAddPost = async (post: { postId: number; subject: string }) => {
    try {
      await service.series.addPost({ seriesId: String(series.id), postId: String(post.postId) });
      showToast('포스트가 추가되었습니다.');
      onRefresh();
    } catch (error) {
      showApiErrorToast('포스트 추가에 실패했습니다.', error);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-[1.1rem] border border-[color:var(--admin-border)] bg-[color:var(--admin-panel-muted)]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-3">
        <BookOpen className="h-4 w-4 text-dl-primary-ink" />
        <span className="flex-1 text-sm font-semibold text-[color:var(--admin-text)]">
          시리즈 상세
        </span>
        <Badge tone="primary" className="text-xs">
          {series.title}
        </Badge>
      </div>
      <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />

      {/* 스크롤 가능 영역 */}
      <div className="flex-1 overflow-auto">
        {/* 상세 정보 */}
        <div className="p-2">{renderDetails(rows)}</div>
        <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-1.5 p-3">
          <Button size="sm" variant="outline-gray" onClick={() => onEdit(series)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            편집
          </Button>
          <Button size="sm" variant="outline-red" onClick={() => onDelete(series)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            삭제
          </Button>
        </div>
        <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />

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
        <div aria-hidden className="h-px w-full shrink-0 bg-dl-border" />

        {/* 포스트 추가 */}
        <div className="p-3">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[color:var(--admin-text-faint)]">
            포스트 추가
          </span>
          <PostSearchCombobox excludePostIds={excludePostIds} onSelect={handleAddPost} />
        </div>
      </div>
    </div>
  );
}
