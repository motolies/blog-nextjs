'use client';

import { Badge, defineColumns } from '@hvy/ui';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
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
  { id: 'siteName', headerWord: '사이트', width: 140 },
  {
    id: 'title',
    headerWord: '제목',
    // grow 는 남는 폭을 더하기만 한다 — 좁은 화면에서는 이 base 폭이 최소 보장 폭이 된다.
    width: 300,
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
  { id: 'price', headerWord: '가격', width: 140, align: 'right' },
  { id: 'recommendationCount', headerWord: '추천', width: 80, align: 'right' },
  { id: 'unrecommendationCount', headerWord: '비추천', width: 100, align: 'right' },
  { id: 'viewCount', headerWord: '조회', width: 80, align: 'right' },
  { id: 'commentCount', headerWord: '댓글', width: 80, align: 'right' },
  {
    id: 'notified',
    headerWord: '알림',
    width: 80,
    format: (value) => (
      <Badge tone={value ? 'success' : 'neutral'}>{value ? '발송' : '미발송'}</Badge>
    ),
  },
  {
    id: 'scrapedAt',
    headerWord: '스크래핑일시',
    width: 200,
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

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(COLUMNS, 'hotDealItems');
  const grid = useServerGrid<Record<string, unknown>>({
    fetchData: fetchItems,
    searchFields,
    defaultSearchParams,
    paging: settings.paging,
  });

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      <div className="admin-panel admin-table-shell">
        <DynamicSearchFields
          searchFields={searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']}
          defaultSearchParams={defaultSearchParams}
          enableDynamic
          {...grid.search}
        />
        <PersistedDataGrid<Record<string, unknown>>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.id)}
          isFetching={grid.loading}
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
          onColumnSettings={settings.openSettings}
        />
      </div>
    </AdminPageFrame>
  );
}
