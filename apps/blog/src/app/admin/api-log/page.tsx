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
import { LOG_STATUS_OPTIONS } from '@/lib/logStatus';
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
  // 성공/실패 값은 요청과 응답이 다르다 — lib/logStatus.ts 헤더 주석 참조.
  // pinned 인 이유: DynamicSearchFields 의 자동 활성화 effect 는 마운트 1회만 돌아서
  // 딥링크(?status=FAIL)로 들어와도 필드가 안 열릴 수 있고, 오류만 보기가 이 화면의 상시 용도다.
  { name: 'status', label: '성공 여부', type: 'select', pinned: true, options: LOG_STATUS_OPTIONS },
  { name: 'traceId', label: 'Trace ID' },
  { name: 'spanId', label: 'Span ID' },
  { name: 'requestUri', label: 'Request URI' },
  { name: 'httpMethodType', label: 'HTTP Method' },
  { name: 'requestHeader', label: 'Request Header' },
  { name: 'requestParam', label: 'Request Param' },
  { name: 'requestBody', label: 'Request Body' },
  { name: 'responseStatus', label: 'Response Status' },
  { name: 'responseBody', label: 'Response Body' },
];

export default function ApiLog() {
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

  const truncateText = useCallback((text: string, maxLength = 20) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }, []);

  // fetchData 메모이제이션: Dialog 상태 변경 시 재검색 방지
  const fetchApiLogs = useCallback(
    (searchRequest: SearchRequest) => service.log.searchApiLogs({ searchRequest }),
    [],
  );

  const defaultSearchParams = useMemo(
    () => ({ createdAtFrom: today, createdAtTo: today }),
    [today],
  );

  // 컬럼 정의 — 상세 클릭 컬럼이 handleDetailClick 클로저를 쓰므로 컴포넌트 안 useMemo 로 유지
  const columns = useMemo(() => {
    const detailColumn = (id: string, headerWord: string, width: number) => ({
      id,
      headerWord,
      width,
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
      { id: 'requestUri', headerWord: 'Request URI', width: 260, grow: 1, align: 'left' },
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
        id: 'responseStatus',
        headerWord: 'Response Status',
        width: 150,
        format: (value) => {
          // NULL 은 응답을 못 받은 호출이다 — 검색의 "실패" 판정과 같은 취급을 해야 색이 어긋나지 않는다.
          // 그냥 두면 parseInt(null) → NaN → 회색 배지에 "null" 이 찍힌다.
          if (value === null || value === undefined || value === '') {
            return <Badge tone="danger">응답없음</Badge>;
          }
          const statusCode = parseInt(String(value), 10);
          let variant = 'neutral';
          if (statusCode >= 200 && statusCode < 300) variant = 'success';
          else if (statusCode >= 300 && statusCode < 400) variant = 'primary';
          else if (statusCode >= 400 && statusCode < 500) variant = 'warning';
          else if (statusCode >= 500) variant = 'danger';
          return <Badge tone={variant as never}>{String(value)}</Badge>;
        },
      },
      detailColumn('requestHeader', 'Request Header', 200),
      detailColumn('requestParam', 'Request Param', 300),
      detailColumn('requestBody', 'Request Body', 300),
      detailColumn('responseBody', 'Response Body', 300),
      { id: 'processTime', headerWord: 'Process Time (ms)', width: 160, align: 'right' },
      {
        id: 'createdAt',
        headerWord: 'Created At',
        width: 200,
        format: (value) => formatUtcToLocal(String(value)),
      },
    ]);
  }, [handleDetailClick, truncateText]);

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'apiLogs');
  const grid = useServerGrid<Record<string, unknown>>({
    fetchData: fetchApiLogs,
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
