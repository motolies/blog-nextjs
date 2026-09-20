'use client';

import {
  Badge,
  Button,
  type ColumnDef,
  defineColumns,
  type GridEmpty,
  Label,
  Select,
  type SelectOption,
  StatTile,
} from '@hvy/ui';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import { useClientGrid } from '@/hooks/useClientGrid';
import { quantKeys } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import {
  CHECKPOINT_MAX_ATTEMPTS,
  isAttemptsExhausted,
  resolveCheckpointStatus,
  resolveCollectJobType,
  usesCheckpoint,
} from '@/lib/quant/backfillValidation';
import { COLLECT_JOB_OPTIONS } from '@/lib/quant/jobCatalog';
import { QUANT_ROUTES, runHref } from '@/lib/quant/routes';
import type { BadgeTone } from '@/lib/quant/runStatus';
import { formatCompact } from '@/lib/statFormat';
import service from '@/service';
import { CHECKPOINT_STATUSES, type CheckpointStatus, type CollectJobType } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

/** 화면 전용 라벨 — `Record<Enum,string>` 이 strict:false 환경의 유일한 누락 방어다. */
const STATUS_LABEL: Record<CheckpointStatus, string> = {
  PENDING: '대기',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
  PAUSED: '일시 중지',
  EXHAUSTED: '소진',
  FAILED: '실패',
};

/** PLAN Badge tone 표 — PENDING neutral · IN_PROGRESS primary · DONE success · PAUSED warning · EXHAUSTED/FAILED danger. */
const STATUS_TONE: Record<CheckpointStatus, BadgeTone> = {
  PENDING: 'neutral',
  IN_PROGRESS: 'primary',
  DONE: 'success',
  PAUSED: 'warning',
  EXHAUSTED: 'danger',
  FAILED: 'danger',
};

/** 목록 상한 — 컨트롤러 MAX_LIMIT 과 같다. 넘치면 요약 타일(전체 기준)과 행 수가 어긋나므로 힌트로 알린다. */
const LIST_LIMIT = 500;
const DEFAULT_JOB: CollectJobType = 'PRICE_BACKFILL';

const EXHAUSTED_TITLE = `재개 대상 제외 — 수동 실행 탭에서 "체크포인트 초기화"를 켜고 재실행 (attemptCount ≥ ${CHECKPOINT_MAX_ATTEMPTS})`;

/**
 * 잡 select — 체크포인트를 쓰는 잡을 앞 그룹으로, 나머지도 고를 수 있게 둔다(백엔드가 잡을 추가해도 조회는 가능).
 * Select 그룹은 연속 배치가 전제라 정렬해 둔다.
 */
const JOB_OPTIONS: readonly SelectOption[] = (() => {
  const base = COLLECT_JOB_OPTIONS.map((option) => ({
    value: String(option.value),
    label: option.label,
  }));
  const withCheckpoint = base
    .filter((option) => usesCheckpoint(option.value))
    .map((option) => ({ ...option, group: '체크포인트 사용' }));
  const others = base
    .filter((option) => !usesCheckpoint(option.value))
    .map((option) => ({ ...option, group: '기타 잡' }));
  return [...withCheckpoint, ...others];
})();

/** 쿼리 키 — `quantKeys.all` 아래에 두어 `useRunActions` 의 invalidate(트리거·취소 뒤)가 여기도 새로 읽게 한다. */
const checkpointKeys = {
  list: (jobType: CollectJobType, status: CheckpointStatus | null) =>
    [...quantKeys.all, 'collect', 'checkpoints', jobType, status ?? 'ALL'] as const,
  summary: (jobType: CollectJobType) =>
    [...quantKeys.all, 'collect', 'checkpoints', jobType, 'summary'] as const,
};

/** 행 타입은 앱 관례대로 `Record<string, unknown>`(DataGrid 제약). 실제 모양은 `CollectCheckpointResponse` 다. */
type CheckpointRow = Record<string, unknown>;
const EMPTY_ROWS: CheckpointRow[] = [];

/** 컬럼 — 클로저가 없어 모듈 상수다(useGridSettings 가 참조 안정을 요구). */
const columns: readonly ColumnDef<CheckpointRow>[] = defineColumns<CheckpointRow>([
  { id: 'targetKey', headerWord: '대상', width: 110, hideable: false, pinned: true },
  {
    id: 'status',
    headerWord: '상태',
    width: 100,
    format: (value) => {
      const status = String(value) as CheckpointStatus;
      return (
        <Badge tone={STATUS_TONE[status] ?? 'neutral'} size="xs">
          {STATUS_LABEL[status] ?? String(value)}
        </Badge>
      );
    },
  },
  {
    id: 'cursorDate',
    headerWord: '커서',
    width: 110,
    format: (value) => (value ? String(value) : '—'),
  },
  {
    id: 'earliestLoaded',
    headerWord: '최초 적재',
    width: 110,
    format: (value) => (value ? String(value) : '—'),
  },
  {
    id: 'latestLoaded',
    headerWord: '최근 적재',
    width: 110,
    format: (value) => (value ? String(value) : '—'),
  },
  {
    id: 'attemptCount',
    headerWord: '시도',
    width: 80,
    align: 'right',
    format: (value) => {
      const count = Number(value ?? 0);
      return isAttemptsExhausted(count) ? (
        <span title={EXHAUSTED_TITLE}>
          <Badge tone="danger" size="xs">
            {count}
          </Badge>
          {/* title 은 스크린리더가 읽지 않는다 — 색만으로 전달되는 "재개 제외" 를 텍스트로도 남긴다 */}
          <span className="sr-only">재개 제외 — 체크포인트 초기화 뒤 재실행 필요</span>
        </span>
      ) : (
        String(count)
      );
    },
  },
  {
    id: 'lastRunId',
    headerWord: '마지막 run',
    width: 110,
    format: (value) =>
      value === null || value === undefined ? (
        '—'
      ) : (
        <Link
          href={runHref('STOCK', String(value))}
          className="text-dl-primary-ink hover:underline"
        >
          #{String(value)}
        </Link>
      ),
  },
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
    id: 'updatedAt',
    headerWord: '갱신',
    width: 150,
    format: (value) => formatUtcToLocal(String(value ?? ''), 'MM-dd HH:mm:ss'),
  },
]);

/**
 * 체크포인트 탭 — `?cpJob=`·`?cpStatus=` 가 필터의 진실(StatTile 의 active 판정도 여기서).
 * 실행 이력 탭의 `?jobType=`·`?status=` 와 이름을 갈라 둔 이유: 그 탭은 마운트 시 URL 을 초기 검색값으로 읽으므로
 * 같은 키를 쓰면 체크포인트 필터가 실행 이력 필터로 새어 들어간다.
 *
 * 데이터는 `useQuery` + `useClientGrid` — 500행 상한의 limit API 라 클라 정렬·페이징으로 충분하고,
 * 트리거 훅의 `quantKeys.all` invalidate 로 "초기화 후 재실행 → attemptCount 0" 이 자동 반영된다.
 * 폴링은 없다(DataGrid `isFetching` 오버레이 깜빡임) — 새로 고침 버튼으로 읽는다.
 */
export function CheckpointTab() {
  const [jobParam, setJobParam] = useSearchParamState('cpJob');
  const [statusParam, setStatusParam] = useSearchParamState('cpStatus');
  const jobType = resolveCollectJobType(jobParam) ?? DEFAULT_JOB;
  const status = resolveCheckpointStatus(statusParam);

  const listQuery = useQuery({
    queryKey: checkpointKeys.list(jobType, status),
    queryFn: () =>
      service.stockCollect.checkpoints({
        jobType,
        status: status ?? undefined,
        limit: LIST_LIMIT,
      }),
    staleTime: 10 * 1000,
  });
  const summaryQuery = useQuery({
    queryKey: checkpointKeys.summary(jobType),
    queryFn: () => service.stockCollect.checkpointSummary(jobType),
    staleTime: 10 * 1000,
  });

  // 참조 안정 — useClientGrid 는 data 를 useMemo 의존성으로 쓴다.
  const rows = useMemo<CheckpointRow[]>(
    () => (listQuery.data ? (listQuery.data as unknown as CheckpointRow[]) : EMPTY_ROWS),
    [listQuery.data],
  );
  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'quantCollectCheckpoints');
  const grid = useClientGrid<CheckpointRow>(rows, { paging: settings.paging });

  // 백엔드 summary 는 전 상태를 0 으로 채워 주지만 개발 목(msw)은 없는 키를 비우므로 둘 다 `?? 0` 으로 읽는다.
  const summary = summaryQuery.data ?? {};
  const total = CHECKPOINT_STATUSES.reduce((sum, key) => sum + (summary[key] ?? 0), 0);
  const truncated = total > LIST_LIMIT && status === null;

  const refresh = () => {
    listQuery.refetch();
    summaryQuery.refetch();
  };

  const empty: GridEmpty = listQuery.isError
    ? {
        state: 'error',
        title: '체크포인트를 불러오지 못했습니다',
        action: { label: '다시 시도', onAction: refresh },
      }
    : {
        title: '이 잡은 체크포인트를 쓰지 않거나 아직 실행되지 않았습니다',
        hint: usesCheckpoint(jobType)
          ? status
            ? `${STATUS_LABEL[status]} 상태인 체크포인트가 없습니다`
            : '수동 실행 탭에서 백필을 실행하면 종목별 체크포인트가 생깁니다'
          : '체크포인트를 쓰는 잡은 PRICE·INDEX·INVESTOR·ETF_NAV·FINANCIAL·OVERSEAS 백필과 RELOAD 입니다',
      };

  return (
    <div className="admin-panel admin-table-shell admin-table-shell--bleed">
      {/* ── 필터 + 요약 타일 (DynamicSearchFields 와 같은 카드 규격) ── */}
      <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-dl-container border bg-dl-surface p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex w-full flex-col gap-1 sm:w-80">
            <Label htmlFor="cp-job" className="text-dl-xs text-dl-fg-muted">
              잡
            </Label>
            <Select
              id="cp-job"
              size="sm"
              value={jobType}
              onValueChange={(value) => setJobParam(value)}
              options={JOB_OPTIONS}
              placeholder="잡 선택"
              searchPlaceholder="잡 이름·코드 검색"
            />
          </div>
          <Button
            variant="outline-gray"
            size="sm"
            icon={RefreshCw}
            busy={listQuery.isFetching || summaryQuery.isFetching}
            onClick={refresh}
          >
            새로 고침
          </Button>
          <span className="text-dl-xs text-[color:var(--admin-text-muted)] wrap-anywhere">
            시도 {CHECKPOINT_MAX_ATTEMPTS}회 이상은 재개 대상에서 빠집니다 —{' '}
            <Link
              href={`${QUANT_ROUTES.collect}?tab=trigger&job=${jobType}`}
              className="text-dl-primary-ink hover:underline"
            >
              수동 실행 탭
            </Link>
            에서 체크포인트 초기화로 재실행하세요.
          </span>
        </div>

        {/* 타일은 요약 API(전체 기준) — 목록(상한 500)과 데이터 원천이 달라 힌트를 명기한다 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <StatTile
            label="전체"
            hint={truncated ? `목록은 ${LIST_LIMIT}행까지` : '전체 기준'}
            value={summaryQuery.isPending ? '…' : formatCompact(total)}
            active={status === null}
            onClick={() => setStatusParam(null)}
          />
          {CHECKPOINT_STATUSES.map((key) => (
            <StatTile
              key={key}
              label={STATUS_LABEL[key]}
              value={summaryQuery.isPending ? '…' : formatCompact(summary[key] ?? 0)}
              tone={STATUS_TONE[key]}
              active={status === key}
              onClick={() => setStatusParam(status === key ? null : key)}
            />
          ))}
        </div>
      </div>

      <PersistedDataGrid<CheckpointRow>
        settings={settings}
        rows={listQuery.isError ? EMPTY_ROWS : grid.rows}
        getRowId={(row) => `${String(row.jobType)}:${String(row.targetKey)}`}
        isFetching={listQuery.isFetching}
        empty={empty}
        sortOf={grid.sortOf}
        onToggleSort={grid.toggleSort}
        attachedToolbar
        maxHeight="fill"
      />
      <GridPagingBar
        pageIndex={grid.pageIndex}
        pageCount={grid.pageCount}
        onPageChange={grid.setPageIndex}
        total={listQuery.isError ? 0 : grid.totalCount}
        pageSize={grid.pageSize}
        onPageSizeChange={grid.setPageSize}
        onColumnSettings={settings.openSettings}
      />
    </div>
  );
}
