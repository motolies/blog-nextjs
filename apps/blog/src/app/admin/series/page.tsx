'use client';

import {
  Badge,
  Button,
  ContentDialog,
  cn,
  Input,
  Label,
  showToast,
  Textarea,
  useConfirm,
} from '@hvy/ui';
import { BookOpen, Plus, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TreeSearchBar from '@/components/common/tree/TreeSearchBar';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import SeriesDetailPanel from '@/components/series/SeriesDetailPanel';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';
import type { Series, SeriesSummary } from '@/types/series';

export default function SeriesPage() {
  const askConfirm = useConfirm();
  // 목록 상태
  const [seriesList, setSeriesList] = useState<SeriesSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 선택/상세 상태
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dialog 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  // 데이터 로드
  const loadSeriesList = useCallback(async () => {
    try {
      const res = await service.series.getAll();
      setSeriesList(res.data ?? []);
    } catch (error) {
      showApiErrorToast('시리즈 목록을 불러오지 못했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSeriesDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await service.series.getDetail({ seriesId: String(id) });
      setSelectedSeries(res.data);
    } catch (error) {
      showApiErrorToast('시리즈 상세를 불러오지 못했습니다.', error);
      setSelectedSeries(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeriesList();
  }, [loadSeriesList]);

  // 필터링
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return seriesList;
    const q = searchQuery.toLowerCase();
    return seriesList.filter(
      (s) => s.title.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q),
    );
  }, [seriesList, searchQuery]);

  // 시리즈 선택
  const handleSelectSeries = (s: SeriesSummary) => {
    setSelectedSeriesId(s.id);
    loadSeriesDetail(s.id);
  };

  // 상세 + 목록 새로고침
  const handleRefresh = useCallback(async () => {
    if (selectedSeriesId) {
      await Promise.all([loadSeriesDetail(selectedSeriesId), loadSeriesList()]);
    }
  }, [selectedSeriesId, loadSeriesDetail, loadSeriesList]);

  // 생성
  const handleCreate = () => {
    setDialogMode('create');
    setFormData({ title: '', description: '' });
    setOpenDialog(true);
  };

  // 편집
  const handleEdit = (series: Series) => {
    setDialogMode('edit');
    setFormData({ title: series.title, description: series.description ?? '' });
    setOpenDialog(true);
  };

  // 저장 (생성/수정)
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('시리즈 제목은 필수입니다.', 'error');
      return;
    }
    try {
      if (dialogMode === 'create') {
        const res = await service.series.create({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        });
        showToast('시리즈가 생성되었습니다.');
        setOpenDialog(false);
        await loadSeriesList();
        // 생성된 시리즈 자동 선택
        const created = res.data;
        if (created?.id) {
          setSelectedSeriesId(created.id);
          setSelectedSeries(created);
        }
      } else {
        await service.series.update({
          seriesId: String(selectedSeries!.id),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
        });
        showToast('시리즈가 수정되었습니다.');
        setOpenDialog(false);
        await Promise.all([loadSeriesList(), loadSeriesDetail(selectedSeries!.id)]);
      }
    } catch (error) {
      showApiErrorToast(
        dialogMode === 'create' ? '시리즈 생성에 실패했습니다.' : '시리즈 수정에 실패했습니다.',
        error,
      );
    }
  };

  // 삭제
  const handleDelete = async (series: Series | SeriesSummary) => {
    const postCount =
      'postCount' in series ? series.postCount : 'posts' in series ? series.posts?.length : 0;
    const ok = await askConfirm({
      message:
        `"${series.title}" 시리즈를 삭제하시겠습니까?` +
        ((postCount ?? 0) > 0 ? ' 포함된 포스트의 시리즈 연결이 해제됩니다.' : ''),
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;
    try {
      await service.series.delete({ seriesId: String(series.id) });
      showToast('시리즈가 삭제되었습니다.');
      if (selectedSeriesId === series.id) {
        setSelectedSeriesId(null);
        setSelectedSeries(null);
      }
      await loadSeriesList();
    } catch (error) {
      showApiErrorToast('시리즈 삭제에 실패했습니다.', error);
    }
  };

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      {/* 검색 바 — 액션은 이 줄의 지정 슬롯에 둔다(그리드 화면의 툴바 액션과 같은 층). */}
      <TreeSearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
        placeholder="시리즈 이름으로 검색..."
        label="시리즈 검색"
        resultCount={searchQuery ? filteredList.length : null}
        actions={
          <Button variant="primary" onClick={handleCreate} icon={Plus}>
            새 시리즈
          </Button>
        }
      />

      {/* 메인 콘텐츠: 마스터-디테일 */}
      <div className="admin-split-layout admin-fill" data-size="wide">
        {/* 좌측: 시리즈 목록 */}
        <div className="admin-panel admin-fill min-w-0 overflow-hidden">
          <div className="h-full overflow-auto p-2">
            {loading ? (
              <p className="py-8 text-center text-dl-sm text-[color:var(--admin-text-faint)]">
                불러오는 중...
              </p>
            ) : filteredList.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="space-y-2 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-[color:var(--admin-text-faint)] opacity-50" />
                  <p className="text-dl-sm text-[color:var(--admin-text-faint)]">
                    {searchQuery ? '검색 결과가 없습니다.' : '시리즈가 없습니다.'}
                  </p>
                  {!searchQuery && (
                    <Button variant="primary" size="sm" onClick={handleCreate} icon={Plus}>
                      첫 시리즈 만들기
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredList.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSeries(s)}
                    className={cn(
                      'w-full text-left rounded-dl-container px-3 py-2.5 transition-colors duration-150',
                      'hover:bg-[color:var(--admin-canvas-strong)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary focus-visible:ring-offset-1',
                      selectedSeriesId === s.id &&
                        'bg-[color:var(--admin-canvas-strong)] ring-1 ring-[color:var(--admin-border-strong)]',
                    )}
                    aria-current={selectedSeriesId === s.id ? 'true' : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-dl-sm font-semibold text-[color:var(--admin-text)]">
                        {s.title}
                      </span>
                      <Badge tone="neutral" className="shrink-0">
                        {s.postCount}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="mt-0.5 line-clamp-1 text-dl-xs text-[color:var(--admin-text-muted)]">
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
      <ContentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title={dialogMode === 'create' ? '시리즈 추가' : '시리즈 수정'}
        size="md"
        footer={
          <>
            <Button variant="outline-gray" onClick={() => setOpenDialog(false)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave} icon={Save}>
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="series-title">제목 *</Label>
            <Input
              id="series-title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="시리즈 제목"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="series-description">설명</Label>
            <Textarea
              id="series-description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="시리즈에 대한 간단한 설명 (선택사항)"
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </ContentDialog>
    </AdminPageFrame>
  );
}
