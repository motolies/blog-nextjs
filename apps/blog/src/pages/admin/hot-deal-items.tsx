import { Badge, DataGrid, defineColumns } from '@hvy/ui';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { useColumnSettings } from '@/components/common/grid/useColumnSettings';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { SearchField, SearchRequest } from '@/lib/gridSearch';
import service from '@/service';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

interface SiteOption {
  value: string;
  label: string;
}

const COLUMNS = defineColumns<Record<string, unknown>>([
  { id: 'siteName', headerWord: '사이트', width: 140, align: 'left' },
  {
    id: 'title',
    headerWord: '제목',
    grow: 1,
    align: 'left',
    format: (value, row) => (
      <a
        href={String(row.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-dl-primary-ink hover:text-dl-primary-ink hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {String(value)}
      </a>
    ),
  },
  { id: 'price', headerWord: '가격', width: 200, align: 'left' },
  { id: 'recommendationCount', headerWord: '추천', width: 80, align: 'right' },
  { id: 'unrecommendationCount', headerWord: '비추천', width: 80, align: 'right' },
  { id: 'viewCount', headerWord: '조회', width: 80, align: 'right' },
  { id: 'commentCount', headerWord: '댓글', width: 80, align: 'right' },
  {
    id: 'notified',
    headerWord: '알림',
    width: 80,
    align: 'left',
    format: (value) => (
      <Badge tone={value ? 'success' : 'neutral'}>{value ? '발송' : '미발송'}</Badge>
    ),
  },
  {
    id: 'scrapedAt',
    headerWord: '스크래핑일시',
    width: 200,
    align: 'left',
    format: (value) => formatUtcToLocal(String(value), 'yyyy-MM-dd HH:mm:ss'),
  },
]);

export default function HotDealItemsPage() {
  // 모듈 로드 시점이 아닌 마운트 시점에 기본 검색일을 계산한다(자정 넘김 stale 방지)
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);

  useEffect(() => {
    service.hotDeal
      .getAllSites()
      .then((sites: any) => {
        setSiteOptions((sites ?? []).map((s: any) => ({ value: String(s.id), label: s.siteName })));
      })
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(
    (searchRequest: SearchRequest) => service.hotDeal.searchItems({ searchRequest }),
    [],
  );

  const searchFields = useMemo<SearchField[]>(
    () => [
      {
        type: 'dateRange',
        fromName: 'scrapedAtFrom',
        toName: 'scrapedAtTo',
        fromLabel: '시작일',
        toLabel: '종료일',
        pinned: true,
      },
      {
        name: 'siteId',
        label: '사이트',
        type: 'select',
        pinned: true,
        options: siteOptions,
      },
      { name: 'title', label: '제목' },
      {
        type: 'numberRange',
        fromName: 'minRecommendationCount',
        toName: 'maxRecommendationCount',
        fromLabel: '추천 최소',
        toLabel: '추천 최대',
        allowNegative: false,
        min: 0,
        integerOnly: true,
      },
      {
        type: 'numberRange',
        fromName: 'minViewCount',
        toName: 'maxViewCount',
        fromLabel: '조회 최소',
        toLabel: '조회 최대',
        allowNegative: false,
        min: 0,
        integerOnly: true,
      },
      {
        type: 'numberRange',
        fromName: 'minCommentCount',
        toName: 'maxCommentCount',
        fromLabel: '댓글 최소',
        toLabel: '댓글 최대',
        allowNegative: false,
        min: 0,
        integerOnly: true,
      },
    ],
    [siteOptions],
  );

  const defaultSearchParams = useMemo(
    () => ({ scrapedAtFrom: today, scrapedAtTo: today }),
    [today],
  );

  const grid = useServerGrid<Record<string, unknown>>({
    fetchData: fetchItems,
    searchFields,
    defaultSearchParams,
    defaultPageSize: 25,
  });

  const { visibleColumns, openSettings, dialog } = useColumnSettings(COLUMNS);

  return (
    <AdminPageFrame>
      <div className="admin-panel admin-table-shell">
        <div className="flex flex-col gap-2">
          <DynamicSearchFields
            searchFields={searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']}
            defaultSearchParams={defaultSearchParams}
            enableDynamic
            {...grid.search}
          />
          <DataGrid<Record<string, unknown>>
            columns={visibleColumns}
            rows={grid.rows}
            getRowId={(row) => String(row.id)}
            isFetching={grid.loading}
            empty={GRID_EMPTY}
            sortOf={grid.sortOf}
            onToggleSort={grid.toggleSort}
            attachedToolbar
          />
          <GridPagingBar
            pageIndex={grid.pageIndex}
            pageCount={grid.pageCount}
            onPageChange={grid.setPageIndex}
            total={grid.totalCount}
            pageSize={grid.pageSize}
            onPageSizeChange={grid.setPageSize}
            onColumnSettings={openSettings}
          />
          {dialog}
        </div>
      </div>
    </AdminPageFrame>
  );
}
