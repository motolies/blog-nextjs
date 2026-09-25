'use client';

import {
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  defineColumns,
  IconButton,
} from '@hvy/ui';
import { Ban, Ellipsis, Eye, RotateCcw } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import type { GridSettings } from '@/components/common/grid/useGridSettings';
import type { useServerGrid } from '@/hooks/useServerGrid';
import {
  formatCallsWithFailures,
  formatCostUsd,
  formatDurationMs,
  formatTokens,
} from '@/lib/quant/format';
import { isTerminal, triggerLabel } from '@/lib/quant/runStatus';
import { formatCompact } from '@/lib/statFormat';
import type { AdvisorRunResponse, CollectRunResponse, RunModule } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { RunStatusBadge } from './RunStatusBadge';

/**
 * 실행 이력 그리드(모듈 제네릭) — stock·advisor 가 같은 배선을 쓴다.
 *
 * 행 타입은 앱 관례대로 `Record<string, unknown>` 이다(api-log·system-log 와 같다) — 두 모듈의 DTO 가 다른 키를
 * 가져 `ColumnDef<CollectRunResponse | AdvisorRunResponse>` 로는 `targetDate`·`model` 같은 모듈 전용 키를 못 쓴다.
 * 셀 안에서만 `asStock`/`asAdvisor` 로 되돌린다.
 *
 * **폴링하지 않는다** — DataGrid 는 `isFetching` 이 참이면 표를 "불러오는 중" 오버레이로 덮는다. 실시간성은 운영 현황
 * 위젯이 맡고, 여기는 `GridPagingBar.actions` 의 "새로 고침" 과 액션 성공 뒤 `grid.refresh()` 로 갱신한다.
 *
 * 키보드 경로: runId 컬럼 `primary: true` + `onRowPrimaryAction` — 행 클릭(`onRowActivate`)만으로는 키보드로 상세를 못 연다.
 */
export type RunGridRow = Record<string, unknown>;

export type ServerGrid = ReturnType<typeof useServerGrid<RunGridRow>>;

export const asStock = (row: RunGridRow) => row as unknown as CollectRunResponse;
export const asAdvisor = (row: RunGridRow) => row as unknown as AdvisorRunResponse;

type RowHandlers = {
  onOpen: (row: RunGridRow) => void;
  onCancel: (row: RunGridRow) => void;
  onRerun: (row: RunGridRow) => void;
  /** 재실행 불가 사유(있으면 메뉴 아이템 비활성 + title). 예: 종목 20개 절단. */
  rerunDisabledReason?: (row: RunGridRow) => string | null;
};

/**
 * 컬럼 정의 훅 — 콜백 클로저를 쓰므로 useMemo 로 참조를 고정한다(useGridSettings 가 columns 참조 안정을 요구).
 * `settings` 는 이 컬럼으로 `useGridSettings(columns, gridId)` 를 부른 뒤 grid 훅에 넘긴다(순서 규칙).
 */
export function useRunColumns(
  module: RunModule,
  handlers: RowHandlers,
): readonly ColumnDef<RunGridRow>[] {
  const { onOpen, onCancel, onRerun, rerunDisabledReason } = handlers;
  return useMemo(() => {
    const head: ColumnDef<RunGridRow>[] = [
      { id: 'runId', headerWord: 'Run', width: 90, primary: true, hideable: false, pinned: true },
      { id: 'jobDescription', headerWord: '잡', width: 200, align: 'left' },
      {
        id: 'triggerType',
        headerWord: '트리거',
        width: 100,
        format: (value) => (value ? triggerLabel(String(value)) : ''),
      },
    ];

    const stockOnly: ColumnDef<RunGridRow>[] = [
      { id: 'targetDate', headerWord: '대상일', width: 110 },
    ];
    const advisorOnly: ColumnDef<RunGridRow>[] = [
      { id: 'baseDate', headerWord: '기준일', width: 110 },
    ];

    const middle: ColumnDef<RunGridRow>[] = [
      {
        id: 'status',
        headerWord: '상태',
        width: 100,
        format: (value) => <RunStatusBadge status={String(value)} />,
      },
      {
        id: 'startedAt',
        headerWord: '시작',
        width: 150,
        format: (value) => formatUtcToLocal(String(value ?? ''), 'MM-dd HH:mm:ss'),
      },
      {
        id: 'durationMs',
        headerWord: '소요',
        width: 100,
        align: 'right',
        format: (value) => formatDurationMs(value as number | null),
      },
    ];

    const stockMetrics: ColumnDef<RunGridRow>[] = [
      {
        id: 'rowsUpserted',
        headerWord: '행수',
        width: 100,
        align: 'right',
        format: (value) => formatCompact(Number(value ?? 0)),
      },
      {
        id: 'apiCallCount',
        headerWord: 'API 호출/실패',
        width: 130,
        align: 'right',
        format: (_value, row) => {
          const run = asStock(row);
          return formatCallsWithFailures(run.apiCallCount, run.apiFailCount);
        },
      },
    ];

    const advisorMetrics: ColumnDef<RunGridRow>[] = [
      { id: 'model', headerWord: '모델', width: 150, align: 'left' },
      { id: 'promptVersion', headerWord: '프롬프트', width: 110, hidden: true },
      {
        id: 'llmCalls',
        headerWord: 'LLM 호출',
        width: 90,
        align: 'right',
        format: (value) => formatCompact(Number(value ?? 0)),
      },
      {
        id: 'promptTokens',
        headerWord: '입력 토큰',
        width: 100,
        align: 'right',
        format: (value) => formatTokens(value as number),
      },
      {
        id: 'completionTokens',
        headerWord: '출력 토큰',
        width: 100,
        align: 'right',
        format: (value) => formatTokens(value as number),
      },
      {
        id: 'reasoningTokens',
        headerWord: '추론 토큰',
        width: 100,
        align: 'right',
        hidden: true,
        format: (value) => formatTokens(value as number),
      },
      {
        id: 'cachedTokens',
        headerWord: '캐시 토큰',
        width: 100,
        align: 'right',
        hidden: true,
        format: (value) => formatTokens(value as number),
      },
      {
        id: 'costUsd',
        headerWord: '비용',
        width: 110,
        align: 'right',
        format: (value) => formatCostUsd(value as number | string | null),
      },
    ];

    const tail: ColumnDef<RunGridRow>[] = [
      {
        id: 'errorMessage',
        headerWord: '오류',
        width: 260,
        grow: 1,
        align: 'left',
        format: (value) =>
          value ? (
            <span className="line-clamp-2 wrap-anywhere whitespace-normal" title={String(value)}>
              {String(value)}
            </span>
          ) : (
            '—'
          ),
      },
      {
        id: 'actions',
        headerWord: ' ',
        width: 60,
        resizable: false,
        sortable: false,
        hideable: false,
        format: (_value, row) => {
          const status = String(row.status);
          const terminal = isTerminal(status);
          const disabledReason = terminal ? (rerunDisabledReason?.(row) ?? null) : null;
          return (
            // 아이템이 하나로 줄어도 DropdownMenu 가 버튼으로 접어 준다(상세는 늘 있으므로 최소 1개).
            <DropdownMenu>
              <DropdownMenuTrigger>
                <IconButton
                  icon={Ellipsis}
                  label={`run #${String(row.runId)} 작업`}
                  size="xs"
                  iconSize="sm"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem icon={Eye} onSelect={() => onOpen(row)}>
                  상세
                </DropdownMenuItem>
                {terminal ? (
                  <DropdownMenuItem
                    icon={RotateCcw}
                    disabled={disabledReason !== null}
                    onSelect={() => onRerun(row)}
                  >
                    {disabledReason ? `재실행 불가 — ${disabledReason}` : '재실행'}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem icon={Ban} destructive onSelect={() => onCancel(row)}>
                    취소
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];

    return defineColumns<RunGridRow>(
      module === 'STOCK'
        ? [...head, ...stockOnly, ...middle, ...stockMetrics, ...tail]
        : [...head, ...advisorOnly, ...middle, ...advisorMetrics, ...tail],
    );
  }, [module, onOpen, onCancel, onRerun, rerunDisabledReason]);
}

/**
 * 그리드 + 페이징 바. 검색 필드(`DynamicSearchFields`)는 호출부가 위에 둔다 — 모듈마다 필드가 다르다.
 * `isFetching={grid.loading}` 은 사용자가 방금 누른 검색·페이징에만 켜진다(폴링 없음).
 */
export function RunGrid({
  settings,
  grid,
  onOpen,
  actions,
}: {
  settings: GridSettings<RunGridRow>;
  grid: ServerGrid;
  onOpen: (row: RunGridRow) => void;
  /** 페이징 바 액션 슬롯 — "새로 고침" 버튼 자리. */
  actions?: ReactNode;
}) {
  return (
    <>
      <PersistedDataGrid<RunGridRow>
        settings={settings}
        rows={grid.rows}
        getRowId={(row) => String(row.runId)}
        isFetching={grid.loading}
        empty={GRID_EMPTY}
        sortOf={grid.sortOf}
        onToggleSort={grid.toggleSort}
        onRowPrimaryAction={onOpen}
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
        actions={actions}
        onColumnSettings={settings.openSettings}
      />
    </>
  );
}
