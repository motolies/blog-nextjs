'use client';

import {
  Badge,
  Button,
  ContentDialog,
  defineColumns,
  IconButton,
  Input,
  Label,
  Switch,
  showToast,
} from '@hvy/ui';
import { Pencil, Play, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useClientGrid } from '@/hooks/useClientGrid';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';

interface SiteFormData {
  enabled: boolean;
  minRecommendation: number;
  minViewCount: number;
  minCommentCount: number;
  [key: string]: unknown;
}

export default function HotDealSitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  // 수정 다이얼로그
  const [openDialog, setOpenDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    enabled: true,
    minRecommendation: 0,
    minViewCount: 0,
    minCommentCount: 0,
  });

  const loadSites = useCallback(async () => {
    try {
      const data = await service.hotDeal.getAllSites();
      setSites(data ?? []);
    } catch (error) {
      showApiErrorToast('사이트 목록을 불러오지 못했습니다.', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleEdit = (site: any) => {
    setEditTarget(site);
    setFormData({
      enabled: site.enabled,
      minRecommendation: site.minRecommendation,
      minViewCount: site.minViewCount,
      minCommentCount: site.minCommentCount,
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      await service.hotDeal.updateSite(editTarget.id, formData);
      showToast('사이트 설정이 수정되었습니다.');
      setOpenDialog(false);
      await loadSites();
    } catch (error) {
      showApiErrorToast('사이트 수정에 실패했습니다.', error);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      await service.hotDeal.triggerScrape();
      showToast('스크래핑이 시작되었습니다.');
    } catch (error) {
      showApiErrorToast('스크래핑 실행에 실패했습니다.', error);
    } finally {
      setScraping(false);
    }
  };

  const columns = useMemo(
    () =>
      defineColumns<Record<string, unknown>>([
        { id: 'siteName', headerWord: '사이트명', grow: 1, align: 'left' },
        { id: 'siteCode', headerWord: '코드', width: 140 },
        {
          id: 'enabled',
          headerWord: '활성',
          width: 140,
          format: (value) => (
            <Badge tone={value ? 'success' : 'neutral'}>{value ? '활성' : '비활성'}</Badge>
          ),
        },
        { id: 'minRecommendation', headerWord: '최소 추천', width: 140, align: 'right' },
        { id: 'minViewCount', headerWord: '최소 조회', width: 140, align: 'right' },
        { id: 'minCommentCount', headerWord: '최소 댓글', width: 140, align: 'right' },
        {
          id: 'actions',
          headerWord: ' ',
          width: 80,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => (
            <div className="flex gap-1">
              <IconButton
                icon={Pencil}
                label={`${row.siteName} 수정`}
                size="xs"
                iconSize="sm"
                className="cursor-pointer"
                onClick={() => handleEdit(row)}
              />
            </div>
          ),
        },
      ]),
    [],
  );

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'hotDealSites');
  const grid = useClientGrid<Record<string, unknown>>(sites, { paging: settings.paging });

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      {/* 사이트 테이블 */}
      <div className="admin-panel admin-table-shell admin-table-shell--bleed">
        <PersistedDataGrid<Record<string, unknown>>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.id)}
          empty={GRID_EMPTY}
          sortOf={grid.sortOf}
          onToggleSort={grid.toggleSort}
          attachedToolbar
          maxHeight="fill"
        />
        <GridPagingBar
          pageIndex={grid.pageIndex}
          pageCount={grid.pageCount}
          onPageChange={grid.setPageIndex}
          total={grid.totalCount}
          pageSize={grid.pageSize}
          onPageSizeChange={grid.setPageSize}
          actions={
            <Button
              variant="outline-gray"
              size="xs"
              className="cursor-pointer"
              onClick={handleScrape}
              busy={scraping}
              icon={Play}
            >
              {scraping ? '스크래핑 중...' : '스크래핑 실행'}
            </Button>
          }
          onColumnSettings={settings.openSettings}
        />
      </div>

      {/* 수정 다이얼로그 */}
      <ContentDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title="사이트 설정 수정"
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
        {editTarget && (
          <div className="space-y-4 pt-2">
            <div className="rounded-dl-container border border-dl-tonal-border bg-dl-tonal p-3 text-dl-sm">
              <span className="text-[color:var(--admin-text-faint)]">사이트: </span>
              <strong className="text-[color:var(--admin-text)]">{editTarget.siteName}</strong>
              <span className="text-[color:var(--admin-text-muted)]"> ({editTarget.siteCode})</span>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="site-enabled">활성 상태</Label>
              <Switch
                id="site-enabled"
                label="활성 상태"
                checked={formData.enabled}
                onCheckedChange={(checked: boolean) =>
                  setFormData((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="site-min-vote">최소 추천수</Label>
              <Input
                id="site-min-vote"
                type="number"
                min={0}
                value={formData.minRecommendation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minRecommendation: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="site-min-view">최소 조회수</Label>
              <Input
                id="site-min-view"
                type="number"
                min={0}
                value={formData.minViewCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minViewCount: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="site-min-comment">최소 댓글수</Label>
              <Input
                id="site-min-comment"
                type="number"
                min={0}
                value={formData.minCommentCount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minCommentCount: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
          </div>
        )}
      </ContentDialog>
    </AdminPageFrame>
  );
}
