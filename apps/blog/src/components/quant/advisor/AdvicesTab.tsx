'use client';

import { Badge, Button, type ColumnDef, defineColumns } from '@hvy/ui';
import { RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import DynamicSearchFields from '@/components/common/DynamicSearchFields';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY } from '@/components/common/grid/gridLabels';
import { PersistedDataGrid } from '@/components/common/grid/PersistedDataGrid';
import { useGridSettings } from '@/components/common/grid/useGridSettings';
import { useRunActions } from '@/components/quant/useRunActions';
import { isNumericId } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { useServerGrid } from '@/hooks/useServerGrid';
import type { PageResponse, SearchField, SearchRequest } from '@/lib/gridSearch';
import { isNotFound } from '@/lib/quant/apiOutcome';
import { todayKst } from '@/lib/quant/kstDate';
import { toRunPage } from '@/lib/quant/runPage';
import { addDays } from '@/lib/quant/usage';
import { pickAdviceFilters } from '@/lib/urlFilters';
import service from '@/service';
import {
  ADVICE_KINDS,
  ADVICE_VARIANTS,
  type AdviceHeader,
  type AdviceKind,
  type AdviceVariant,
} from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { AdviceDetailDialog } from './AdviceDetailDialog';
import { AdvisorDisabledPanel } from './AdvisorDisabledPanel';
import {
  dataQualityLabel,
  dataQualityTone,
  directionLabel,
  kindLabel,
  kindOptions,
  kindTone,
  regimeLabel,
  VARIANT_OPTIONS,
  variantLabel,
  variantTone,
} from './advisorLabels';
import { formatRate } from './kpiFormat';

/** 그리드 행 — 앱 관례(`Record<string, unknown>`, RunGrid 와 같은 이유). 셀 안에서만 `asAdvice` 로 되돌린다. */
type AdviceRow = Record<string, unknown>;
const asAdvice = (row: AdviceRow) => row as unknown as AdviceHeader;

/**
 * 검색 필드 — 모듈 스코프 상수(useServerGrid effect 의존성). dateRange 값 계약은 `YYYY-MM-DD`(백엔드 `from/to` ISO.DATE).
 * 종류는 "전체" 가 없다(`allowEmpty: false`) — 백엔드가 kind 생략을 DAILY 로 읽어 "전체" 가 DAILY 만 보여주는 거짓 선택지가 된다.
 */
const searchFields: SearchField[] = [
  {
    name: 'kind',
    label: '종류',
    type: 'select',
    pinned: true,
    options: kindOptions(ADVICE_KINDS),
    allowEmpty: false,
    defaultValue: 'DAILY',
  },
  { name: 'variant', label: '변형', type: 'select', pinned: true, options: VARIANT_OPTIONS },
  {
    type: 'dateRange',
    fromName: 'from',
    toName: 'to',
    fromLabel: '기준일 시작',
    toLabel: '기준일 종료',
    pinned: true,
  },
];

/** 기본 조회 기간 — 백엔드 기본(최근 30일)과 같게 두되 화면에 명시한다(빈 칸이면 어디까지 조회됐는지 알 수 없다). */
const DEFAULT_RANGE_DAYS = 30;

/** limit 상한 500(백엔드 clamp). 하루 최대 5변형 × 종류 1개라 30일이면 넉넉하다. */
const ADVICE_LIMIT = 500;

/**
 * 판단 이력 탭 — 종류·기간·variant 필터 → `GET /advices` → `PersistedDataGrid`(key `quantAdvisorAdvices`).
 * 상세 열림은 `?advice=`(URL 이 진실 — GateWidget 의 "오늘 LIVE 판단" 링크·Slack 딥링크가 같은 목적지).
 * 필터 초기값은 실행 이력 탭과 같은 관례로 URL(`?kind=&variant=&from=&to=`)에서 읽는다 — 채팅·Slack 이 MORNING 판단 목록을 딥링크할 수 있다.
 *
 * advisor 404 는 이 탭이 직접 판정한다 — `advices` 엔드포인트 자체가 404 면 게이트 API 유무(백엔드 버전)와 무관하게
 * 모듈 비활성이다. fetchData 클로저가 상태를 세팅하되 참조는 `useCallback([])` 로 고정한다(setState 는 안정 참조).
 */
export function AdvicesTab() {
  const [today] = useState(() => todayKst());
  const [adviceParam, setAdviceId] = useSearchParamState('advice');
  // `?advice=` 는 숫자만 상세로 연다(경로 변수 안전).
  const adviceId = isNumericId(adviceParam) ? adviceParam : null;
  const [unavailable, setUnavailable] = useState(false);
  const searchString = useSearchParams().toString();
  const [defaultSearchParams] = useState(() => ({
    kind: 'DAILY',
    from: addDays(today, -(DEFAULT_RANGE_DAYS - 1)),
    to: today,
    ...pickAdviceFilters(searchString, { kinds: ADVICE_KINDS, variants: ADVICE_VARIANTS }),
  }));

  const gridRef = useRef<{ refresh: () => void } | null>(null);
  const actions = useRunActions({ onChanged: () => gridRef.current?.refresh() });

  const fetchAdvices = useCallback(
    async (request: SearchRequest): Promise<PageResponse<AdviceRow>> => {
      try {
        const rows = await service.advisor.advices({
          from: request.from as string | undefined,
          to: request.to as string | undefined,
          kind: request.kind as AdviceKind | undefined,
          variant: request.variant as AdviceVariant | undefined,
          limit: ADVICE_LIMIT,
        });
        setUnavailable(false);
        return toRunPage(rows as unknown as AdviceRow[], request);
      } catch (error) {
        if (isNotFound(error)) {
          setUnavailable(true);
          return { list: [], totalCount: 0 };
        }
        throw error;
      }
    },
    [],
  );

  const onOpen = useCallback(
    (row: AdviceRow) => setAdviceId(String(asAdvice(row).adviceId)),
    [setAdviceId],
  );

  const columns = useMemo(
    () =>
      defineColumns<AdviceRow>([
        {
          id: 'adviceId',
          headerWord: '판단',
          width: 90,
          primary: true,
          hideable: false,
          pinned: true,
        },
        { id: 'baseDate', headerWord: '기준일', width: 110 },
        {
          id: 'adviceKind',
          headerWord: '종류',
          width: 110,
          format: (value) => (
            <Badge tone={kindTone(value as string | null)} size="xs">
              {kindLabel(value as string | null)}
            </Badge>
          ),
        },
        {
          id: 'variant',
          headerWord: '변형',
          width: 150,
          format: (value) => (
            <Badge tone={variantTone(String(value))} size="xs">
              {variantLabel(String(value))}
            </Badge>
          ),
        },
        {
          id: 'regimeCode',
          headerWord: '국면',
          width: 100,
          format: (value) => regimeLabel(value as string | null),
        },
        {
          id: 'kospiDir',
          headerWord: 'KOSPI / KOSDAQ',
          width: 130,
          format: (_value, row) => {
            const advice = asAdvice(row);
            return `${directionLabel(advice.kospiDir)} / ${directionLabel(advice.kosdaqDir)}`;
          },
        },
        {
          id: 'pUp',
          headerWord: 'p(상승)',
          width: 90,
          align: 'right',
          format: (value) => formatRate(value as number | null, 0),
        },
        {
          id: 'dataQuality',
          headerWord: '품질',
          width: 90,
          format: (value) => (
            <Badge tone={dataQualityTone(value as string | null)} size="xs">
              {dataQualityLabel(value as string | null)}
            </Badge>
          ),
        },
        { id: 'model', headerWord: '모델', width: 150, align: 'left' },
        { id: 'promptVersion', headerWord: '프롬프트', width: 110 },
        {
          id: 'publishedAt',
          headerWord: '발행',
          width: 130,
          format: (value) => (value ? formatUtcToLocal(String(value), 'MM-dd HH:mm') : '미발행'),
        },
        { id: 'weightSetId', headerWord: '가중치', width: 90, hidden: true },
        {
          id: 'parentAdviceId',
          headerWord: '원 판단',
          width: 90,
          hidden: true,
          format: (value) => (value === null || value === undefined ? '—' : `#${String(value)}`),
        },
        { id: 'runId', headerWord: 'Run', width: 90, hidden: true },
        {
          id: 'summary',
          headerWord: '요약',
          width: 320,
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
      ] satisfies ColumnDef<AdviceRow>[]),
    [],
  );

  // settings 가 grid 보다 먼저다 — 저장된 페이지 크기(paging)를 grid 에 넘겨야 한다.
  const settings = useGridSettings(columns, 'quantAdvisorAdvices');
  const grid = useServerGrid<AdviceRow>({
    fetchData: fetchAdvices,
    searchFields,
    defaultSearchParams,
    paging: settings.paging,
  });
  gridRef.current = grid;

  if (unavailable && !grid.loading && grid.totalCount === 0) {
    return <AdvisorDisabledPanel />;
  }

  return (
    <>
      <div className="admin-panel admin-table-shell admin-table-shell--bleed">
        <DynamicSearchFields
          searchFields={searchFields as Parameters<typeof DynamicSearchFields>[0]['searchFields']}
          defaultSearchParams={defaultSearchParams}
          {...grid.search}
        />
        <PersistedDataGrid<AdviceRow>
          settings={settings}
          rows={grid.rows}
          getRowId={(row) => String(row.adviceId)}
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
      </div>
      <AdviceDetailDialog
        adviceId={adviceId}
        onClose={() => setAdviceId(null)}
        onDeleted={grid.refresh}
        actions={actions}
      />
    </>
  );
}
