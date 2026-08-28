'use client';

import { Badge, Button, ContentDialog, defineColumns } from '@hvy/ui';
import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
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

/**
 * 검색 필드 정의 — **모듈 스코프에 둔다.**
 * 컴포넌트 안에 두면 렌더마다 새 배열이 되고, useServerGrid 의 서버 조회 effect 가
 * 이 배열을 의존성으로 갖기 때문에 매 렌더 재조회가 돈다.
 */
const searchFields: SearchField[] = [
  {
    type: 'dateRange',
    fromName: 'createdAtFrom',
    toName: 'createdAtTo',
    fromLabel: '시작일',
    toLabel: '종료일',
    pinned: true,
  },
  { name: 'traceId', label: 'Trace ID' },
  { name: 'spanId', label: 'Span ID' },
  { name: 'requestUri', label: 'Request URI' },
  { name: 'controllerName', label: 'Controller' },
  { name: 'methodName', label: 'Method' },
  { name: 'httpMethodType', label: 'HTTP Method' },
  { name: 'paramData', label: 'Param Data' },
  { name: 'responseBody', label: 'Response Body' },
  { name: 'stackTrace', label: 'Stack Trace' },
  { name: 'remoteAddr', label: 'Remote IP' },
];

export default function SystemLog() {
  // 모듈 로드 시점이 아닌 마운트 시점에 기본 검색일을 계산한다(자정 넘김 stale 방지)
  const [today] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogContent, setDialogContent] = useState('');

  // 메모이제이션: 재검색 방지
  const handleDetailClick = useCallback((title: string, content: string) => {
    setDialogTitle(title);
    setDialogContent(content);
    setDialogOpen(true);
  }, []);

  const truncateText = useCallback((text: string, maxLength = 30) => {
    if (!text) {
      return '-';
    }
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength)}...`;
  }, []);

  // fetchData 메모이제이션: Dialog 상태 변경 시 재검색 방지
  const fetchSystemLogs = useCallback(
    (searchRequest: SearchRequest) => service.log.searchSystemLogs({ searchRequest }),
    [],
  );

  const defaultSearchParams = useMemo(
    () => ({ createdAtFrom: today, createdAtTo: today }),
    [today],
  );

  // 컬럼 정의 — 상세 클릭 컬럼이 handleDetailClick 클로저를 쓰므로 컴포넌트 안 useMemo 로 유지
  const columns = useMemo(() => {
    const detailColumn = (id: string, headerWord: string, width: number, grow?: number) => ({
      id,
      headerWord,
      width,
      grow,
      align: 'left' as const,
      format: (value: unknown) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: 셀 상세 열람은 보조 경로 — 검색 필드로 같은 값을 직접 조회할 수 있다
        // biome-ignore lint/a11y/noStaticElementInteractions: 위와 동일
        <div
          className="cursor-pointer text-dl-primary-ink hover:text-dl-primary-ink"
          onClick={() => handleDetailClick(headerWord, String(value ?? ''))}
        >
          {truncateText(String(value ?? ''))}
        </div>
      ),
    });

    return defineColumns<Record<string, unknown>>([
      { id: 'id', headerWord: 'ID', width: 130 },
      { id: 'traceId', headerWord: 'Trace ID', width: 260 },
      { id: 'requestUri', headerWord: 'Request URI', width: 300, align: 'left' },
      { id: 'methodName', headerWord: 'Method', width: 200, align: 'left' },
      {
        id: 'httpMethodType',
        headerWord: 'HTTP Method',
        width: 120,
        format: (value) => {
          const method = String(value ?? '');
          const variant =
            method === 'GET'
              ? 'primary'
              : method === 'POST'
                ? 'success'
                : method === 'PUT'
                  ? 'warning'
                  : method === 'DELETE'
                    ? 'danger'
                    : 'neutral';
          return <Badge tone={variant as never}>{method}</Badge>;
        },
      },
      {
        id: 'status',
        headerWord: 'Status',
        width: 80,
        format: (value) => (
          <Badge tone={value === 'SUCC' ? 'success' : 'danger'}>{String(value)}</Badge>
        ),
      },
      detailColumn('paramData', 'Param Data', 300, 1),
      detailColumn('responseBody', 'Response Body', 300),
      detailColumn('stackTrace', 'Stack Trace', 300),
      { id: 'processTime', headerWord: 'Process Time (ms)', width: 160, align: 'right' },
      { id: 'remoteAddr', headerWord: 'Remote IP', width: 120 },
      {
        id: 'createdAt',
        headerWord: 'Created At',
        width: 200,
        format: (value) => formatUtcToLocal(String(value)),
      },
    ]);
  }, [handleDetailClick, truncateText]);

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'systemLogs');
  const grid = useServerGrid<Record<string, unknown>>({
    fetchData: fetchSystemLogs,
    searchFields,
    defaultSearchParams,
    paging: settings.paging,
  });

  return (
    <AdminPageFrame className="admin-page-frame--fixed">
      <div className="admin-panel admin-table-shell admin-table-shell--bleed">
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
      <ContentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        size="xl"
        // 본문이 길어 아래까지 스크롤한 뒤 닫는 흐름이라, 헤더 × 만으로는 되돌아가는 길이 멀다.
        footer={
          <Button variant="primary" onClick={() => setDialogOpen(false)}>
            닫기
          </Button>
        }
      >
        <pre className="m-0 max-h-[65vh] overflow-auto whitespace-pre-wrap break-all rounded-dl-container bg-dl-surface p-4 font-dl-mono text-dl-fg text-dl-sm">
          {dialogContent || '-'}
        </pre>
      </ContentDialog>
    </AdminPageFrame>
  );
}
