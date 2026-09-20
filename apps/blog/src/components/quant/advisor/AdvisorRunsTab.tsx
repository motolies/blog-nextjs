'use client';

import { Button, InlineNotice, useConfirm } from '@hvy/ui';
import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import { RunDetailDialog } from '@/components/quant/RunDetailDialog';
import {
  asAdvisor,
  RunGrid,
  type RunGridRow,
  type ServerGrid,
  useRunColumns,
} from '@/components/quant/RunGrid';
import { useRunActions } from '@/components/quant/useRunActions';
import { isAdvisorDisabled, isNumericId, useGate } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { PageResponse, SearchField, SearchRequest } from '@/lib/gridSearch';
import { isNotFound } from '@/lib/quant/apiOutcome';
import { ADVISOR_JOB_OPTIONS } from '@/lib/quant/jobCatalog';
import { todayKst } from '@/lib/quant/kstDate';
import { toRunPage } from '@/lib/quant/runPage';
import { ADVISOR_RUN_STATUS_OPTIONS } from '@/lib/quant/runStatus';
import { advisorRerunArgs } from '@/lib/quant/stepRetry';
import { pickQuantRunFilters } from '@/lib/urlFilters';
import service from '@/service';
import {
  ADVISOR_JOB_TYPES,
  ADVISOR_STATUSES,
  type AdvisorJobType,
  type AdvisorStatus,
} from '@/types/quant';

/** 모듈 스코프 상수 — CollectRunsTab 과 같은 이유. 상태 옵션에 SKIPPED 가 더 있다. */
const searchFields: SearchField[] = [
  { name: 'jobType', label: '잡', type: 'select', pinned: true, options: ADVISOR_JOB_OPTIONS },
  {
    name: 'status',
    label: '상태',
    type: 'select',
    pinned: true,
    options: ADVISOR_RUN_STATUS_OPTIONS,
  },
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
 * advisor 가 꺼진 환경(`advisor.enabled=false`)은 목록이 404 다 — 오류 토스트가 아니라 빈 표로 두고
 * 탭 상단 안내(`useGate` 의 disabled)가 사정을 말한다. 그 외 오류는 useServerGrid 가 토스트한다.
 */
const fetchAdvisorRuns = async (request: SearchRequest): Promise<PageResponse<RunGridRow>> => {
  try {
    const rows = await service.advisor.runs({
      jobType: request.jobType as AdvisorJobType | undefined,
      status: request.status as AdvisorStatus | undefined,
      from: request.from as string | undefined,
      to: request.to as string | undefined,
      limit: 500,
    });
    return toRunPage(rows as unknown as RunGridRow[], request);
  } catch (error) {
    if (isNotFound(error)) return { list: [], totalCount: 0 };
    throw error;
  }
};

/**
 * AI 판단 실행 이력 탭 — 수집 탭과 같은 그리드·다이얼로그, 재실행만 `advisorRerunArgs`(requested 재현) 규칙이 다르다.
 */
export function AdvisorRunsTab() {
  const [today] = useState(() => todayKst());
  const searchString = useSearchParams().toString();
  const [runParam, setRunId] = useSearchParamState('run');
  // `?run=` 은 숫자만 상세로 연다(경로 변수 안전).
  const runId = isNumericId(runParam) ? runParam : null;
  const [defaultSearchParams] = useState(() =>
    pickQuantRunFilters(searchString, { jobTypes: ADVISOR_JOB_TYPES, statuses: ADVISOR_STATUSES }),
  );
  const askConfirm = useConfirm();
  const gate = useGate(today);

  const gridRef = useRef<ServerGrid | null>(null);
  const actions = useRunActions({ onChanged: () => gridRef.current?.refresh() });
  // 의존성은 쓰는 메서드만 — 메서드 참조는 고정이라 컬럼(useRunColumns 의 useMemo)이 busy 표시에 흔들리지 않는다.
  const { cancel, rerunAdvisor } = actions;

  const onOpen = useCallback((row: RunGridRow) => setRunId(String(row.runId)), [setRunId]);

  const onCancel = useCallback(
    async (row: RunGridRow) => {
      const run = asAdvisor(row);
      const ok = await askConfirm({
        message: `${run.jobDescription} run #${run.runId} 를 취소합니다. 다음 단계·IC 청크 경계에서 멈추고 저장된 데이터는 남습니다.`,
        confirmLabel: '취소 요청',
      });
      if (ok) await cancel('ADVISOR', run);
    },
    [askConfirm, cancel],
  );

  const onRerun = useCallback(
    async (row: RunGridRow) => {
      const run = asAdvisor(row);
      const args = advisorRerunArgs(run, today);
      const ok = await askConfirm({
        message: `${run.jobDescription} 을 다시 실행합니다 (${args.baseDate ? `기준일 ${args.baseDate}` : '오늘 기준 — 스케줄 run 재현'}).${run.jobType === 'ADVISE' ? ' 이미 LIVE 판단이 있으면 SKIPPED 로 닫힙니다 — 판단 삭제 후 재판단하세요.' : ''}`,
        confirmLabel: '재실행',
      });
      if (ok) await rerunAdvisor(run, today);
    },
    [askConfirm, rerunAdvisor, today],
  );

  const columns = useRunColumns('ADVISOR', { onOpen, onCancel, onRerun });
  const settings = useGridSettings(columns, 'quantAdvisorRuns');
  const grid = useServerGrid<RunGridRow>({
    fetchData: fetchAdvisorRuns,
    searchFields,
    defaultSearchParams,
    paging: settings.paging,
  });
  gridRef.current = grid;

  const advisorUnavailable = isAdvisorDisabled(gate.data) && !grid.loading && grid.totalCount === 0;

  return (
    <>
      {advisorUnavailable ? (
        <InlineNotice tone="muted" className="mb-3 shrink-0">
          AI 어드바이저 API 에 연결할 수 없습니다 — advisor.enabled=false 환경이거나 백엔드
          구버전(게이트 API 없음)입니다.
        </InlineNotice>
      ) : null}
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
        module="ADVISOR"
        runId={runId}
        onClose={() => setRunId(null)}
        today={today}
        actions={actions}
      />
    </>
  );
}
