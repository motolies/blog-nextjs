'use client';

import {
  applyColumnPreference,
  Badge,
  Button,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  GridToolbar,
  IconButton,
  Pager,
  type PagerLabels,
  PageSizeSelect,
  showToast,
  TotalCount,
  useGridPreference,
  useGridSelection,
} from '@hvy/ui';
import { Columns3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DEMO_ORDERS, DEMO_STATUS_META, type DemoOrder } from '../../../mock-orders';
import { BoolControl } from '../../../playground';

/**
 * DataGrid 풀 배선 — 주문 목록 화면(orders-screen.tsx)의 그리드 배선을 목데이터로 재현한다.
 *
 * 실전과 다른 점 하나: 정렬·페이징이 서버(useServerGrid + URL)가 아니라 **클라이언트
 * useMemo 파생**이다. 여기서 확인하는 것은 그리드 자체의 배선(정렬 토글 · 선택 초기화 ·
 * 컬럼 설정 저장 · 툴바 조합)이지 데이터 계층이 아니다.
 *
 * 페이지 크기는 실제 화면과 같은 계약으로 **컬럼 설정과 같은 저장 항목**에 영속된다 —
 * 로컬 state 가 아니라 `useGridPreference().pageSize` 가 진실이고, 허용 목록 밖이면 첫 옵션이다.
 */

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

/** 저장값 → 페이지 크기. 목록 밖이면 첫 옵션 — ui 는 목록을 모르므로 이 판단은 호출부의 몫이다. */
function resolvePageSize(saved: number | undefined): number {
  return saved !== undefined && (PAGE_SIZE_OPTIONS as readonly number[]).includes(saved)
    ? saved
    : PAGE_SIZE_OPTIONS[0];
}

const PAGER_LABELS: PagerLabels = {
  first: '첫 페이지',
  prev: '이전 페이지',
  next: '다음 페이지',
  last: '마지막 페이지',
  jump: '페이지 이동',
  atFirst: '첫 페이지입니다',
  atLast: '마지막 페이지입니다',
};

const COLUMN_SETTINGS_LABELS: ColumnSettingsLabels = {
  title: '컬럼 설정',
  description: '표시할 컬럼과 순서를 정합니다',
  reorder: '순서 변경',
  reorderHint: '드래그 또는 ↑↓ 키로 순서를 바꿉니다',
  reorderAnnouncement: (name, position, total) =>
    `${name}, ${position}번째로 이동(전체 ${total}개)`,
  visibleColumn: '표시 컬럼',
  alwaysVisible: '행 식별에 필요해 끌 수 없습니다',
  pinnedFixed: '고정 컬럼은 선두를 벗어날 수 없습니다',
  reset: '초기화',
  cancel: '취소',
  apply: '적용',
};

const numberFormat = new Intl.NumberFormat('ko-KR');

/** 원본 컬럼 정의 — 숨김 적용 전. 컬럼 설정 모달이 이걸 봐야 꺼진 컬럼도 다시 켠다. */
const ALL_COLUMNS = defineColumns<DemoOrder>([
  {
    id: 'rowNum',
    headerWord: 'No',
    width: 56,
    sortable: false,
    pinned: true,
    hideable: false,
    resizable: false,
  },
  {
    id: 'orderId',
    headerWord: '주문번호',
    width: 140,
    primary: true,
    pinned: true,
    hideable: false,
  },
  { id: 'receiver', headerWord: '수신자', width: 110 },
  {
    id: 'status',
    headerWord: '상태',
    width: 96,
    format: (_value, row) => (
      <Badge tone={DEMO_STATUS_META[row.status].tone}>{DEMO_STATUS_META[row.status].label}</Badge>
    ),
  },
  { id: 'serviceType', headerWord: '서비스타입', width: 96 },
  {
    id: 'amount',
    headerWord: '금액',
    width: 110,
    align: 'right',
    format: (value) => `${numberFormat.format(Number(value))} 원`,
  },
  { id: 'orderDate', headerWord: '주문일', width: 120, grow: 1 },
]);

type SortState = { readonly columnId: string; readonly direction: 'asc' | 'desc' } | null;

export function DataGridFullDemo() {
  const [sort, setSort] = useState<SortState>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [forceEmpty, setForceEmpty] = useState(false);
  const [forceFetching, setForceFetching] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /**
   * 컬럼 폭·표시·순서·페이지 크기의 브라우저 영속. menuUrl 은 인가가 아니라 localStorage 키
   * 스코프다 — 실제 메뉴 코드가 없는 화면이라 URL 리터럴을 그대로 쓴다.
   */
  const preference = useGridPreference({
    userKey: 'ui-test',
    menuUrl: '/',
    gridId: 'demoOrders',
  });
  /** 페이지 크기의 진실은 저장소다 — 로컬 state 를 두지 않는다. */
  const pageSize = resolvePageSize(preference.pageSize);

  /** asc → desc → 해제 순환. 정렬이 바뀌면 첫 페이지로 — 지금 보던 페이지 번호가 무의미해진다. */
  const toggleSort = (columnId: string) => {
    setPageIndex(0);
    setSort((previous) => {
      if (previous?.columnId !== columnId) return { columnId, direction: 'asc' };
      if (previous.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  const sorted = useMemo(() => {
    if (!sort) return DEMO_ORDERS;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...DEMO_ORDERS].sort((left, right) => {
      const a = left[sort.columnId];
      const b = right[sort.columnId];
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor;
      return String(a).localeCompare(String(b), 'ko') * factor;
    });
  }, [sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pagedRows = useMemo(
    () => sorted.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [sorted, pageIndex, pageSize],
  );
  const rows = forceEmpty ? [] : pagedRows;

  /** "지금 보고 있는 목록"의 신원 — 이 값이 바뀌면 선택이 비워진다. */
  const resetKey = `${pageIndex}:${pageSize}:${sort?.columnId ?? ''}:${sort?.direction ?? ''}:${forceEmpty}`;

  const selection = useGridSelection({
    rows,
    getRowId: (row) => row.orderId,
    resetKey,
  });

  const columns = useMemo(
    () => applyColumnPreference(ALL_COLUMNS, preference.preference),
    [preference.preference],
  );

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-6">
        <BoolControl label="강제 로딩" checked={forceFetching} onChange={setForceFetching} />
        <BoolControl label="강제 빈 상태" checked={forceEmpty} onChange={setForceEmpty} />
      </div>

      <DataGrid
        columns={columns}
        rows={rows}
        getRowId={(row) => row.orderId}
        isFetching={forceFetching}
        sortOf={(columnId) => (sort?.columnId === columnId ? sort.direction : null)}
        onToggleSort={toggleSort}
        // headerWord 가 이미 한국어 리터럴이다 — 사전 코드를 지어내지 않고 항등 해석기를 쓴다.
        translateHeader={(code) => code}
        onRowPrimaryAction={(row) => showToast(`${row.orderId} 상세 이동 (데모)`, 'info')}
        columnWidths={preference.widths}
        onColumnWidthsChange={preference.setWidths}
        resizeColumnLabel="컬럼 너비 조절"
        selection={{
          selectedIds: selection.selectedIds,
          onChange: selection.onChange,
          allState: selection.allState,
          toggleAll: selection.toggleAll,
          selectAllLabel: '전체 선택',
          selectRowLabel: '행 선택',
        }}
        empty={{
          title: '조회 결과가 없습니다',
          hint: forceEmpty ? '강제 빈 상태 토글을 끄면 데이터가 돌아옵니다' : undefined,
        }}
        loadingLabel="불러오는 중"
        maxHeight={420}
        attachedToolbar
      />

      <GridToolbar
        paging={
          <>
            <TotalCount
              total={forceEmpty ? 0 : sorted.length}
              prefix="총"
              suffix="건"
              format={numberFormat.format}
            />
            <Pager
              pageIndex={pageIndex}
              pageCount={pageCount}
              onChange={setPageIndex}
              labels={PAGER_LABELS}
            />
            <PageSizeSelect
              value={pageSize}
              onChange={(next) => {
                // 저장소에 쓰고(디바운스) 1페이지로 — 보던 페이지 번호가 무의미해진다.
                preference.setPageSize(next);
                setPageIndex(0);
              }}
              options={PAGE_SIZE_OPTIONS}
              label="페이지당 건수"
              suffix="건"
              format={numberFormat.format}
            />
          </>
        }
        actions={
          <>
            {selection.selectedCount > 0 ? (
              <span className="mr-1 text-dl-sm text-dl-tonal-fg">
                선택 {numberFormat.format(selection.selectedCount)}건
              </span>
            ) : null}
            <Button
              disabled={selection.selectedCount === 0}
              title="목록에서 행을 고르면 눌러집니다"
              onClick={() =>
                showToast(
                  `${selection.selectedCount}건 선택됨: ${[...selection.selectedIds].join(', ')}`,
                )
              }
            >
              선택 확인
            </Button>
          </>
        }
        viewControls={
          <IconButton
            icon={Columns3}
            label="컬럼 설정"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          />
        }
      />

      {/* 원본 컬럼(숨김 적용 전)을 넘겨야 꺼 둔 컬럼도 목록에 보인다 */}
      <ColumnSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        columns={ALL_COLUMNS}
        preference={preference.preference}
        onApply={preference.setPreference}
        onReset={() => {
          preference.reset();
          setSettingsOpen(false);
        }}
        translateHeader={(code) => code}
        labels={COLUMN_SETTINGS_LABELS}
      />
    </div>
  );
}
