'use client';

import { Button, useConfirm } from '@hvy/ui';
import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import { RunDetailDialog } from '@/components/quant/RunDetailDialog';
import {
  asStock,
  RunGrid,
  type RunGridRow,
  type ServerGrid,
  useRunColumns,
} from '@/components/quant/RunGrid';
import { useRunActions } from '@/components/quant/useRunActions';
import { isNumericId } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { PageResponse, SearchField, SearchRequest } from '@/lib/gridSearch';
import { COLLECT_JOB_OPTIONS } from '@/lib/quant/jobCatalog';
import { todayKst } from '@/lib/quant/kstDate';
import { toRunPage } from '@/lib/quant/runPage';
import { RUN_STATUS_OPTIONS } from '@/lib/quant/runStatus';
import {
  describeBackfillRequest,
  isTickersTruncated,
  restoreBackfillRequest,
} from '@/lib/quant/stepRetry';
import { pickQuantRunFilters } from '@/lib/urlFilters';
import service from '@/service';
import {
  COLLECT_JOB_TYPES,
  COLLECT_STATUSES,
  type CollectJobType,
  type CollectStatus,
} from '@/types/quant';

/**
 * 검색 필드 — **모듈 스코프 상수**(useServerGrid 의 effect 의존성이라 렌더마다 새 배열이면 무한 재조회).
 * 셋 다 pinned 인 이유: 이 화면의 상시 용도가 "어제 실패한 DAILY 찾기" 라 접어 둘 필드가 없다.
 * dateRange 값 계약은 `YYYY-MM-DD` — 백엔드 `from/to` 가 `@DateTimeFormat(ISO.DATE)` 라 그대로 보낸다.
 */
const searchFields: SearchField[] = [
  { name: 'jobType', label: '잡', type: 'select', pinned: true, options: COLLECT_JOB_OPTIONS },
  { name: 'status', label: '상태', type: 'select', pinned: true, options: RUN_STATUS_OPTIONS },
  {
    type: 'dateRange',
    fromName: 'from',
    toName: 'to',
    fromLabel: '시작일',
    toLabel: '종료일',
    pinned: true,
  },
];

/**
 * `fetchData` — 모듈 스코프 상수. limit 전용 API 응답을 `toRunPage` 로 페이지 계약에 맞춘다(limit 500 = 2주 이상).
 * jobType·status 는 select 옵션 값이라 enum 밖 값이 갈 일이 없다(URL 값은 `pickQuantRunFilters` 가 걸러 준다).
 */
const fetchCollectRuns = async (request: SearchRequest): Promise<PageResponse<RunGridRow>> => {
  const rows = await service.stockCollect.runs({
    jobType: request.jobType as CollectJobType | undefined,
    status: request.status as CollectStatus | undefined,
    from: request.from as string | undefined,
    to: request.to as string | undefined,
    limit: 500,
  });
  return toRunPage(rows as unknown as RunGridRow[], request);
};

const TRUNCATED_REASON = '종목 20개 초과 — 수동 실행 탭에서 재지정';

/**
 * 수집 실행 이력 탭. 상세 열림은 `?run=`(URL 이 진실 — 409 토스트·운영 현황·Slack 딥링크가 같은 목적지).
 * 그리드 밖(행 메뉴)은 `useConfirm`, 다이얼로그 안은 인라인 확인 바 — 모달 위 모달 금지.
 */
export function CollectRunsTab() {
  const [today] = useState(() => todayKst());
  const searchString = useSearchParams().toString();
  const [runParam, setRunId] = useSearchParamState('run');
  // `?run=` 은 숫자만 상세로 연다 — 경로 변수로 나가는 값이라 URL 의 임의 문자열을 그대로 쓰지 않는다.
  const runId = isNumericId(runParam) ? runParam : null;
  // URL 딥링크는 마운트 시점 1회만 초기값으로 — 이후 `?run=` 변화가 검색 조건을 되돌리면 안 된다.
  const [defaultSearchParams] = useState(() =>
    pickQuantRunFilters(searchString, { jobTypes: COLLECT_JOB_TYPES, statuses: COLLECT_STATUSES }),
  );
  const askConfirm = useConfirm();

  // 액션 → grid.refresh 순환을 ref 로 끊는다(actions 가 grid 보다 먼저 만들어져야 컬럼 핸들러가 참조할 수 있다).
  const gridRef = useRef<ServerGrid | null>(null);
  const actions = useRunActions({ onChanged: () => gridRef.current?.refresh() });
  // 의존성은 쓰는 메서드만 — `actions` 객체는 busy 표시가 바뀔 때마다 새로 만들어지지만 메서드 참조는 고정이다.
  const { cancel, rerunStock } = actions;

  const onOpen = useCallback((row: RunGridRow) => setRunId(String(row.runId)), [setRunId]);

  const onCancel = useCallback(
    async (row: RunGridRow) => {
      const run = asStock(row);
      const ok = await askConfirm({
        message: `${run.jobDescription} run #${run.runId} 를 취소합니다. 다음 종목/단계 경계에서 멈추고 저장된 데이터는 남습니다.`,
        confirmLabel: '취소 요청',
      });
      if (ok) await cancel('STOCK', run);
    },
    [askConfirm, cancel],
  );

  const onRerun = useCallback(
    async (row: RunGridRow) => {
      const run = asStock(row);
      const body = restoreBackfillRequest(run) ?? {};
      const ok = await askConfirm({
        message: `${run.jobDescription} 을 같은 인자로 다시 실행합니다 — ${describeBackfillRequest(body)}. 체크포인트 커서부터 이어받습니다(초기화는 상세에서).${run.jobType === 'DAILY' ? ' DAILY 는 오늘(KST) 기준 증분 수집입니다.' : ''}`,
        confirmLabel: '재실행',
      });
      if (ok) await rerunStock(run, false);
    },
    [askConfirm, rerunStock],
  );

  const rerunDisabledReason = useCallback(
    (row: RunGridRow) => (isTickersTruncated(asStock(row)) ? TRUNCATED_REASON : null),
    [],
  );

  const columns = useRunColumns('STOCK', { onOpen, onCancel, onRerun, rerunDisabledReason });
  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'quantCollectRuns');
  const grid = useServerGrid<RunGridRow>({
    fetchData: fetchCollectRuns,
    searchFields,
    defaultSearchParams,
    paging: settings.paging,
  });
  gridRef.current = grid;

  return (
    <>
      <div className="admin-panel admin-table-shell admin-table-shell--bleed">
        <DynamicSearchFields
          searchFields={searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']}
          defaultSearchParams={defaultSearchParams}
          {...grid.search}
        />
        <RunGrid
          settings={settings}
          grid={grid}
          onOpen={onOpen}
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
        />
      </div>
      <RunDetailDialog
        module="STOCK"
        runId={runId}
        onClose={() => setRunId(null)}
        today={today}
        actions={actions}
      />
    </>
  );
}
