'use client';

import {
  Badge,
  Button,
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  defineColumns,
  IconButton,
} from '@hvy/ui';
import { Archive, Ellipsis, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { PageResponse, SearchField, SearchRequest } from '@/lib/gridSearch';
import { isNotFound } from '@/lib/quant/apiOutcome';
import { toRunPage } from '@/lib/quant/runPage';
import { formatCompact } from '@/lib/statFormat';
import service from '@/service';
import type { LessonRow, LessonStatus } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import {
  LESSON_STATUS_OPTIONS,
  lessonScopeLabel,
  lessonStatusLabel,
  lessonStatusTone,
} from './advisorLabels';
import { formatSignedPct } from './kpiFormat';
import { LessonRetireDialog } from './LessonRetireDialog';

type LessonGridRow = Record<string, unknown>;
const asLesson = (row: LessonGridRow) => row as unknown as LessonRow;

/** 모듈 스코프 상수 — useServerGrid effect 의존성. status 만 걸러도 충분하다(교훈은 수십 건 규모). */
const searchFields: SearchField[] = [
  { name: 'status', label: '상태', type: 'select', pinned: true, options: LESSON_STATUS_OPTIONS },
];

const LESSON_LIMIT = 100;

/** advisor 404 는 상위(WeightsLessonsTab)가 세트 쿼리로 판정하므로 여기서는 빈 표로 둔다. */
const fetchLessons = async (request: SearchRequest): Promise<PageResponse<LessonGridRow>> => {
  try {
    const rows = await service.advisor.lessons({
      status: request.status as LessonStatus | undefined,
      limit: LESSON_LIMIT,
    });
    return toRunPage(rows as unknown as LessonGridRow[], request);
  } catch (error) {
    if (isNotFound(error)) return { list: [], totalCount: 0 };
    throw error;
  }
};

/** 클램프 텍스트 셀 — rule·lessonText·observation 처럼 문장이 오는 컬럼. */
function clamp(value: unknown) {
  return value ? (
    <span className="line-clamp-2 wrap-anywhere whitespace-normal" title={String(value)}>
      {String(value)}
    </span>
  ) : (
    '—'
  );
}

/**
 * 교훈 그리드 — `GET /lessons?status&limit=100` → `PersistedDataGrid`(key `quantAdvisorLessons`).
 * 행 액션 "폐기" 는 ACTIVE 에만 뜬다(CANDIDATE 는 아직 적용 전, RETIRED 는 이미 끝). 폐기는 `LessonRetireDialog`(sm + Textarea).
 * post* 지표는 "적용군 vs 미적용군" 초과수익 — 교훈이 실제로 도움이 됐는지의 근거라 나란히 둔다.
 */
export function LessonsGrid() {
  const [retiring, setRetiring] = useState<LessonRow | null>(null);

  const onRetire = useCallback((row: LessonGridRow) => setRetiring(asLesson(row)), []);

  const columns = useMemo(
    () =>
      defineColumns<LessonGridRow>([
        { id: 'lessonId', headerWord: '교훈', width: 80, hideable: false, pinned: true },
        {
          id: 'status',
          headerWord: '상태',
          width: 90,
          format: (value) => (
            <Badge tone={lessonStatusTone(String(value))} size="xs">
              {lessonStatusLabel(String(value))}
            </Badge>
          ),
        },
        {
          id: 'scope',
          headerWord: '범위',
          width: 90,
          format: (value) => lessonScopeLabel(String(value)),
        },
        { id: 'rule', headerWord: '규칙', width: 260, align: 'left', format: clamp },
        {
          id: 'lessonText',
          headerWord: '교훈 문장',
          width: 260,
          grow: 1,
          align: 'left',
          format: clamp,
        },
        {
          id: 'observation',
          headerWord: '관찰',
          width: 240,
          align: 'left',
          hidden: true,
          format: clamp,
        },
        {
          id: 'appliedCount',
          headerWord: '적용',
          width: 80,
          align: 'right',
          format: (value) => formatCompact(Number(value ?? 0)),
        },
        {
          id: 'postExcessApplied',
          headerWord: '적용군 초과 (n)',
          width: 130,
          align: 'right',
          format: (_value, row) => {
            const lesson = asLesson(row);
            return `${formatSignedPct(lesson.postExcessApplied)} (${lesson.postNApplied ?? 0})`;
          },
        },
        {
          id: 'postExcessNotApplied',
          headerWord: '미적용군 초과 (n)',
          width: 140,
          align: 'right',
          format: (_value, row) => {
            const lesson = asLesson(row);
            return `${formatSignedPct(lesson.postExcessNotApplied)} (${lesson.postNNotApplied ?? 0})`;
          },
        },
        {
          id: 'activatedAt',
          headerWord: '활성화',
          width: 120,
          format: (value) => (value ? formatUtcToLocal(String(value), 'yy-MM-dd HH:mm') : '—'),
        },
        {
          id: 'retiredAt',
          headerWord: '폐기',
          width: 120,
          format: (value) => (value ? formatUtcToLocal(String(value), 'yy-MM-dd HH:mm') : '—'),
        },
        {
          id: 'retiredReason',
          headerWord: '폐기 사유',
          width: 200,
          align: 'left',
          hidden: true,
          format: clamp,
        },
        { id: 'model', headerWord: '모델', width: 140, hidden: true },
        { id: 'runId', headerWord: 'Run', width: 80, hidden: true },
        {
          id: 'createdAt',
          headerWord: '생성',
          width: 120,
          hidden: true,
          format: (value) => (value ? formatUtcToLocal(String(value), 'yy-MM-dd HH:mm') : '—'),
        },
        {
          id: 'actions',
          headerWord: ' ',
          width: 60,
          resizable: false,
          sortable: false,
          hideable: false,
          format: (_value, row) => {
            const lesson = asLesson(row);
            if (lesson.status !== 'ACTIVE') return null;
            return (
              // 아이템 1개 — DropdownMenu 가 패널 없이 트리거를 그 아이템의 버튼으로 접어 준다.
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <IconButton
                    icon={Ellipsis}
                    label={`교훈 #${lesson.lessonId} 작업`}
                    size="xs"
                    iconSize="sm"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem icon={Archive} destructive onSelect={() => onRetire(row)}>
                    폐기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ] satisfies ColumnDef<LessonGridRow>[]),
    [onRetire],
  );

  const settings = useGridSettings(columns, 'quantAdvisorLessons');
  const grid = useServerGrid<LessonGridRow>({
    fetchData: fetchLessons,
    searchFields,
    paging: settings.paging,
  });

  return (
    <>
      <section className="admin-panel admin-table-shell admin-table-shell--bleed">
        <h2 className="mb-2 text-dl-sm font-semibold text-dl-fg">교훈</h2>
        <DynamicSearchFields
          searchFields={searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']}
          defaultSearchParams={{}}
          {...grid.search}
        />
        <PersistedDataGrid<LessonGridRow>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.lessonId)}
          isFetching={grid.loading}
          empty={GRID_EMPTY}
          sortOf={grid.sortOf}
          onToggleSort={grid.toggleSort}
          attachedToolbar
          maxHeight="auto"
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
              icon={RefreshCw}
              busy={grid.loading}
              onClick={grid.refresh}
            >
              새로 고침
            </Button>
          }
          onColumnSettings={settings.openSettings}
        />
      </section>
      <LessonRetireDialog
        lesson={retiring}
        onClose={() => setRetiring(null)}
        onRetired={grid.refresh}
      />
    </>
  );
}
