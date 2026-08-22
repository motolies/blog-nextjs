'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Checkbox } from '../components/checkbox';
import { FormMode } from '../components/form-mode';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { useTokenPx } from '../lib/useTokenPx';
import { warnOnce } from '../lib/warnOnce';
import { CellEditor, type CellEditorMove } from './CellEditor';
import { type ColumnDef, isColumnEditable, pinnedCount } from './columns';
import { type GridEmpty, GridEmptyOverlay } from './GridEmptyOverlay';
import {
  GRID_CELL_PX_CLASS,
  GRID_CHECK_FALLBACK,
  GRID_CHECK_TOKEN,
  GRID_HEADER_FALLBACK,
  GRID_HEADER_TOKEN,
  GRID_ROW_FALLBACK,
  GRID_ROW_TOKEN,
} from './gridDensity';
import { type ActiveCell, cellKey, findNextEditableCell, type GridEditing } from './gridEditing';
import { type ColumnWidths, useColumnLayout } from './useColumnLayout';
import type { SelectAllState } from './useGridSelection';

/**
 * 서버 페이징 그리드 — v3 §ds-03.
 *
 * 가상 스크롤을 쓰는 이유는 성능이 아니라 **업무 요구**다 — 한 페이지 기본 100행,
 * 최대 500행이라 DOM 노드가 수만 개가 된다.
 *
 * ⚠️ 행을 `transform: translateY()` 가 아니라 **`top`** 으로 배치한다.
 *    transform 은 containing block 을 만들어 그 안의 `position: sticky` 가
 *    뷰포트가 아니라 그 요소를 기준으로 동작한다 — 고정열이 가로 스크롤에 딸려간다.
 *    100~500행 규모에서 둘의 성능 차이는 측정되지 않는다.
 */

export type GridSelection<T> = {
  readonly selectedIds: ReadonlySet<string>;
  readonly onChange: (next: ReadonlySet<string>) => void;
  readonly allState: SelectAllState;
  readonly toggleAll: () => void;
  /**
   * 고를 수 없는 행. v3: **목록에서 빼지 않고** 회색으로 남긴다 —
   * 왜 못 고르는지 값으로 알 수 있어야 한다.
   */
  readonly isSelectable?: (row: T) => boolean;
  /** `ui` 는 사전을 모른다 — 스크린리더 문구를 주입받는다. */
  readonly selectAllLabel: string;
  readonly selectRowLabel: string;
};

/**
 * 합계행 — 본문 아래 sticky 로 붙는 요약 크롬(정산·수량 합계용).
 * 셀 값은 호출부가 계산해 넘긴다 — 서버 페이징이라 **전체 합계는 서버만 안다**.
 * 그리드가 보이는 행을 합산하면 "페이지 합계"를 전체로 오독하는 사고가 된다.
 */
export type GridFooter = {
  /** columnId → 표시값. 없는 컬럼은 빈칸이다. 라벨("합계")도 원하는 컬럼 칸에 넣는다. */
  readonly cells: Readonly<Record<string, ReactNode>>;
};

/**
 * `empty` 를 생략했을 때의 문구.
 *
 * `loadingLabel = '불러오는 중'` · `resizeColumnLabel = '컬럼 너비 조절'` 과 같은 규약이다 —
 * `ui` 는 사전을 모르지만 **문구가 아예 없는 것보다 한국어 기본값이 낫다**(앱이 덮는다).
 * 예전에는 이 prop 이 없으면 헤더만 남은 빈 껍데기가 그려졌다.
 *
 * 모듈 상수인 이유는 참조 동일성이다 — 기본값을 인라인 객체로 두면 렌더마다 새 객체가 되어
 * 자식의 memo 비교가 매번 깨진다.
 */
const DEFAULT_EMPTY: GridEmpty = { state: 'empty', title: '데이터가 없습니다' };

/** 공개 props — 앱 컴포지트가 `Omit` 으로 일부만 걷어내고 그대로 통과시킬 수 있게 이름을 붙여 export 한다. */
export type DataGridProps<T extends Record<string, unknown>> = {
  readonly columns: readonly ColumnDef<T>[];
  readonly rows: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly isFetching?: boolean;
  /**
   * 밀도 5단 — 행·헤더 높이, 선택열 폭, 셀 좌우 패딩, 셀 에디터 컨트롤이 **함께** 한 단계
   * 움직인다. 테마 축(`--dl-scale-*`)과 곱해진다: compact 테마의 xs 는 36px, default 는 40px.
   * 글자 크기·컬럼 폭·툴바는 따르지 않는다(`theme/default.css` 그리드 밀도 섹션 참조).
   */
  readonly density?: ControlSize;
  /**
   * 행이 없을 때 무엇을 보여줄지. 빈 상태는 본문 영역을 **덮는 오버레이**이고
   * 행 자리를 밀어내지 않는다(v3 §ds-03).
   *
   * **생략해도 기본 문구가 나온다** — 예전에는 생략하면 헤더만 남은 빈 껍데기였다.
   * `state` 로 0건과 조회 실패를 가른다 — 앱마다 `error ? … : …` 삼항식을 복제하던 것을
   * 여기로 올린 것이다.
   */
  readonly empty?: GridEmpty;
  readonly loadingLabel?: string;
  /**
   * `headerWord`(FieldWord 코드)를 표시 문구로 바꾼다.
   *
   * **번역기를 이 패키지가 직접 들고 있지 않는 이유**: `ui` 는 프레임워크 중립 패키지라
   * 어느 앱에나 그대로 옮겨간다. 사전을 알게 되는 순간 그 중립성이 깨진다.
   */
  readonly translateHeader?: (code: string) => string;
  readonly sortOf?: (columnId: string) => 'asc' | 'desc' | null;
  readonly onToggleSort?: (columnId: string) => void;
  readonly onRowPrimaryAction?: (row: T) => void;
  /**
   * 행 어디를 눌러도 실행되는 **보조** 열기 경로. 정본은 `column.primary` 링크다 —
   * 그건 "어디를 누르면 열리는지"가 눈에 보이지만 이건 보이지 않기 때문이다.
   * 목록 자체가 드릴다운 수단인 화면(집계표 → 상세)에서만 쓴다.
   *
   * 버튼·체크박스·셀 에디터에서 버블링된 클릭은 **무시한다** — 행 액션을 누른 사람은
   * 행을 연 것이 아니다. 그 구분이 없으면 삭제 버튼 한 번에 상세가 함께 열린다.
   */
  readonly onRowActivate?: (row: T) => void;
  /**
   * 행 단위 강조 클래스. 배경색 유틸리티만 준다 —
   * 높이·정렬을 건드리면 가상 스크롤의 행 높이 계산과 어긋난다.
   */
  readonly rowClassName?: (row: T) => string | undefined;
  readonly selection?: GridSelection<T>;
  /**
   * 인라인 편집 배선 — `useGridEditing().binding` 을 그대로 넘긴다(`selection` 과 같은 자리).
   * 없으면 편집 경로가 전혀 열리지 않는다 — 완전 opt-in 이다.
   */
  readonly editing?: GridEditing;
  /**
   * 저장 전 수정된 셀. key = `${rowId}:${columnId}` — 미저장 상태를 톤얼로 남긴다.
   * 생략하면 `editing.dirtyCells` 를 쓴다 — 직접 넘기는 쪽이 이긴다(기존 계약 유지).
   */
  readonly dirtyCells?: ReadonlySet<string>;
  /**
   * 합계행 — 값은 호출부(보통 서버 응답)가 계산해 넘긴다. 행이 0이면 그리지 않는다.
   * 헤더와 같은 sticky 크롬이라 세로 스크롤에도 하단에 남고 고정열 오프셋을 공유한다.
   */
  readonly footer?: GridFooter;
  /**
   * 그리드도 하나의 입력 요소로 본다(v3 §ds-05) — 표 전체에 빨간 보더를 두른다.
   * **문구는 여기 없다.** 카드 제목 옆에 두는 것이 규칙이고, 그건 호출부가 안다.
   */
  readonly invalid?: boolean;
  /** 아래에 툴바가 이어 붙으면 아래 모서리를 각지게 한다. */
  readonly attachedToolbar?: boolean;
  /**
   * 본문 스크롤 상한(px). `'auto'` 면 상한을 두지 않고 행 수만큼 늘어난다 —
   * 페이징 없이 전체를 한눈에 보는 집계표가 그렇다. 그 경우 가상 스크롤은
   * 사실상 꺼진다(모든 행이 뷰포트 안이므로) — 수백 행짜리 목록에는 쓰지 않는다.
   */
  readonly maxHeight?: number | 'auto';
  /** 컬럼 정의에 `width` 가 없을 때의 폭. 없으면 `--spacing-dl-grid-col`. */
  readonly defaultColumnWidth?: number;
  /**
   * 사용자가 조정한 컬럼 폭(id → px). 주면 controlled, 안 주면 그리드가 내부에서 들고 있는다.
   * **어느 쪽이든 `onColumnWidthsChange` 는 호출된다** — 앱은 이 값만 저장하면 된다.
   */
  readonly columnWidths?: ColumnWidths;
  readonly onColumnWidthsChange?: (next: ColumnWidths) => void;
  /** 전체 off 스위치. 컬럼별로는 `ColumnDef.resizable` 로 끈다. */
  readonly resizableColumns?: boolean;
  /** 리사이즈 핸들의 스크린리더 이름. `ui` 는 사전을 모른다 — 주입받는다. */
  readonly resizeColumnLabel?: string;
  /** dirty 셀 초기화 아이콘의 스크린리더 이름. */
  readonly revertCellLabel?: string;
};

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowId,
  isFetching,
  density = 'md',
  empty = DEFAULT_EMPTY,
  loadingLabel = '불러오는 중',
  translateHeader,
  sortOf,
  onToggleSort,
  onRowPrimaryAction,
  onRowActivate,
  rowClassName,
  selection,
  editing,
  dirtyCells,
  footer,
  invalid,
  attachedToolbar = false,
  maxHeight = 560,
  defaultColumnWidth,
  columnWidths,
  onColumnWidthsChange,
  resizableColumns = true,
  resizeColumnLabel = '컬럼 너비 조절',
  revertCellLabel = '수정 원복',
}: DataGridProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * 행 높이는 테마 토큰이 소유한다 — 숫자를 박아두면 테마를 바꿔도 그리드가 안 바뀐다.
   *
   * density 는 **토큰 이름을 고르는 방식**이라 `useTokenPx` 계약(루트에서 읽기 +
   * data-theme 구독)이 그대로다. 훅의 deps 가 `[tokenName, fallback]` 이므로 이름이
   * 바뀌면 재측정이 걸린다 — density 전환도 실측을 따라가는 근거다.
   */
  const rowHeight = useTokenPx(GRID_ROW_TOKEN[density], GRID_ROW_FALLBACK[density]);
  const headerHeight = useTokenPx(GRID_HEADER_TOKEN[density], GRID_HEADER_FALLBACK[density]);
  const selectColumnWidth = useTokenPx(GRID_CHECK_TOKEN[density], GRID_CHECK_FALLBACK[density]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
  });

  /**
   * rowHeight 가 갱신되면(하이드레이션 후 첫 실측 · 테마 전환 재실측) 측정 캐시를 비운다.
   * virtualizer 는 estimateSize 함수가 바뀌어도 이미 계산한 행 캐시를 유지하므로,
   * 이 호출이 없으면 SSR fallback(50) 크기로 그린 행이 실측값으로 영영 안 바뀐다(실측 확인).
   */
  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  const pinned = pinnedCount(columns);
  const hasSelection = selection !== undefined;

  /** 직접 넘긴 `dirtyCells` 가 이긴다 — 편집 배선 없이 쓰던 기존 계약을 깨지 않는다. */
  const resolvedDirtyCells = dirtyCells ?? editing?.dirtyCells;

  /**
   * Tab/Enter 의 다음 편집 셀로 활성 셀을 옮긴다. 대상이 가상 윈도 밖이면 먼저 스크롤한다 —
   * 스크롤해야 에디터가 마운트되어 포커스를 받을 수 있다.
   */
  const handleEditorMove = (from: ActiveCell, move: CellEditorMove) => {
    if (!editing) return;
    const target = findNextEditableCell({ columns, rows, getRowId, from, move });
    if (!target) {
      editing.onActiveCellChange(null);
      return;
    }
    const index = rows.findIndex((row) => getRowId(row) === target.rowId);
    if (index >= 0) virtualizer.scrollToIndex(index);
    editing.onActiveCellChange(target);
  };

  /**
   * 훅이 프로그램적으로 활성 셀을 옮긴 경우(검증 실패 → 첫 오류 셀, addRow 직후 등)에도
   * 그 행이 보이게 스크롤한다. align 기본값 'auto' 라 이미 보이는 행에는 아무 일도 없다.
   */
  const activeCell = editing?.activeCell ?? null;
  useEffect(() => {
    if (!activeCell) return;
    const index = rows.findIndex((row) => getRowId(row) === activeCell.rowId);
    if (index >= 0) virtualizer.scrollToIndex(index);
  }, [activeCell, rows, getRowId, virtualizer]);

  /**
   * 폭·오프셋·총폭을 **한 계산에서** 얻는다. 셋이 갈리면 고정열이 헤더와 본문에서
   * 다른 자리에 서고, 그건 스크롤해야만 보이는 종류의 어긋남이다.
   */
  const { widths, offsets, totalWidth, setWidth, resetWidth, minColumnWidth } = useColumnLayout({
    columns,
    scrollRef,
    leadingWidth: hasSelection ? selectColumnWidth : 0,
    defaultColumnWidth,
    widths: columnWidths,
    onWidthsChange: onColumnWidthsChange,
  });

  /**
   * 행 클릭이 유일한 열기 수단이면 키보드 사용자는 목록에서 아무 데도 못 간다.
   * 타입으로 묶지 않는 이유는 `Button.disabled`/`title` 과 같다 — 강제하면 우회로 돌아온다.
   */
  if (onRowActivate && !columns.some((column) => column.primary)) {
    warnOnce(
      'grid-row-activate-no-primary',
      'onRowActivate 만 있고 primary 컬럼이 없습니다. 행 클릭은 포인터 전용이라 키보드로는 상세에 갈 수 없습니다 — 핵심 키 컬럼에 primary: true 를 주세요.',
    );
  }

  /**
   * 행 액션 버튼·선택 체크박스·셀 에디터에서 버블링된 클릭은 행 열기가 아니다.
   * 삭제 아이콘 한 번에 상세까지 열리면 사용자는 무엇이 실행됐는지 알 수 없다.
   */
  const handleRowClick = (event: ReactMouseEvent<HTMLDivElement>, row: T) => {
    if (!onRowActivate) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, label, [role="separator"]')) return;
    onRowActivate(row);
  };
  const isEmpty = rows.length === 0;
  /**
   * 조회 중 — 행이 남아 있어도 오버레이로 **덮는다**. 재조회는 전부 사용자가 방금 누른
   * 명시적 조작(페이지·정렬·검색)이라 그 순간 이전 목록은 이미 무의미하기 때문이다.
   * 폴링·debounce 검색·무한 스크롤처럼 "누르지 않았는데 바뀌는" 경로가 생기면
   * 그때는 이전 데이터를 살려 두는 별도 표시(배지)가 다시 필요해진다.
   */
  const loading = isFetching === true;
  /**
   * 빈 상태에서 본문이 차지할 높이. 오버레이가 스크롤 컨테이너 **밖**이라 자리를
   * 여기서 만들어 준다 — 안에서 만들면 절대배치가 오버플로가 되어 행이 0인데
   * 세로 스크롤바가 생긴다(`GridEmptyOverlay` 헤더 주석 §2).
   * 하한 2행은 문구+힌트+액션이 눌리지 않는 최소치, 상한은 `maxHeight` 를 넘지 않게 한다.
   */
  // maxHeight 가 'auto'(blog 확장 — 내용만큼 늘어남)면 상한 클램프를 생략한다.
  const emptyBodyHeight = Math.max(
    rowHeight * 2,
    Math.min(rowHeight * 5, maxHeight === 'auto' ? rowHeight * 5 : maxHeight - headerHeight),
  );

  return (
    /* 그리드 크롬은 폼이 아니다 — 화면을 FormMode(view/disabled)로 감싸도
       행 선택 체크박스·셀 에디터가 잠기면 안 되므로 edit 로 핀한다. */
    <FormMode value="edit">
      <div
        className={cn(
          'relative border border-dl-border bg-dl-surface',
          attachedToolbar ? 'rounded-t-dl-container border-b-0' : 'rounded-dl-container',
          invalid && 'border-dl-error',
        )}
      >
        <div
          ref={scrollRef}
          className="overflow-auto"
          // 빈 상태에서는 높이를 확정한다 — 오버레이가 컨테이너 밖이라 자리를 만들지 않는다.
          style={{
            ...(maxHeight === 'auto' ? null : { maxHeight }),
            ...(isEmpty ? { height: headerHeight + emptyBodyHeight } : null),
          }}
        >
          <div className="relative" style={{ minWidth: totalWidth }}>
            {/* ── 헤더 ── 상단 고정. 고정열은 가로로도 고정된다. */}
            <div
              className="sticky top-0 z-[var(--dl-z-grid-header)] flex bg-dl-grid-header"
              style={{ height: headerHeight }}
            >
              {hasSelection ? (
                <div
                  className="sticky left-0 z-[var(--dl-z-grid-header-pinned)] flex shrink-0 items-center justify-center border-r border-dl-border bg-dl-grid-header"
                  style={{ width: selectColumnWidth }}
                >
                  <Checkbox
                    size={density}
                    checked={selection.allState === 'all'}
                    indeterminate={selection.allState === 'some'}
                    onChange={selection.toggleAll}
                    aria-label={selection.selectAllLabel}
                  />
                </div>
              ) : null}

              {columns.map((column, index) => {
                const direction = sortOf?.(column.id) ?? null;
                const sortable = column.sortable !== false && onToggleSort !== undefined;
                const isPinned = index < pinned;
                const width = widths[index] ?? 0;
                const canResize = resizableColumns && column.resizable !== false;

                /**
                 * 헤더 셀이 `<div>` 이고 정렬 버튼이 그 **안**에 있다.
                 * 셀 자체를 `<button>` 으로 두면 리사이즈 핸들이 버튼 안의 인터랙티브 요소가 되어
                 * 무효 HTML 이 되고, 핸들 클릭이 정렬 토글로 새어 나간다.
                 */
                return (
                  <div
                    key={column.id}
                    className={cn(
                      'relative flex shrink-0 bg-dl-grid-header',
                      /**
                       * 컬럼 경계선은 **한 줄만** 그린다.
                       * 조절 가능한 컬럼에서는 손잡이가 같은 자리(right-0)에 그 선을 대신 그리므로,
                       * 여기서 border-r 까지 켜면 3px 간격의 이중선이 컬럼마다 반복된다.
                       * 조절 불가 컬럼에만 셀이 직접 긋는다 — 그래야 경계선이 빠짐없이 이어진다.
                       */
                      !canResize && 'border-r border-dl-border',
                      isPinned && 'sticky z-[var(--dl-z-grid-header-pinned)]',
                    )}
                    style={{ width, ...(isPinned ? { left: offsets[index] } : null) }}
                  >
                    <button
                      type="button"
                      disabled={!sortable}
                      onClick={sortable ? () => onToggleSort?.(column.id) : undefined}
                      className="flex h-full w-full min-w-0 items-center justify-center gap-1 px-dl-cell-x text-dl-lg text-dl-grid-header-fg"
                    >
                      <span className="truncate">{resolveHeader(column, translateHeader)}</span>
                      {sortable ? <SortIcon direction={direction} /> : null}
                    </button>

                    {canResize ? (
                      <ColumnResizeHandle
                        label={resizeColumnLabel}
                        width={width}
                        min={column.minWidth ?? minColumnWidth}
                        max={column.maxWidth}
                        onResize={(next) => setWidth(column.id, next)}
                        onReset={() => resetWidth(column.id)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* ── 본문 ── */}
            <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;

                const rowId = getRowId(row);
                const selectable = selection?.isSelectable?.(row) ?? true;
                const checked = selection?.selectedIds.has(rowId) ?? false;
                const isAdded = editing?.addedRowIds.has(rowId) ?? false;

                return (
                  /**
                   * 행 클릭은 **포인터 전용 보조 경로**다 — 키보드·스크린리더의 열기 경로는
                   * `column.primary` 가 그리는 링크 버튼이고, 그게 없으면 위에서 경고가 울린다.
                   * 그래서 여기에 role/tabIndex 를 얹지 않는다: 링크와 행이 각각 포커스를 받으면
                   * 같은 목적지가 탭 순서에 두 번 서서 표를 훑는 비용만 두 배가 된다.
                   */
                  // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드 경로는 primary 링크가 갖는다(위 warnOnce 가 강제)
                  // biome-ignore lint/a11y/noStaticElementInteractions: 위와 동일
                  <div
                    key={rowId}
                    className={cn(
                      'absolute left-0 flex w-full border-b border-dl-divider',
                      // 고를 수 없는 행은 입력 칸의 '비활성'과 **같은 토큰**을 쓴다(v3 §ds-03)
                      selectable ? 'hover:bg-dl-grid-hover' : 'bg-dl-locked-bg text-dl-locked-fg',
                      // 추가('A') 행은 행 전체가 미저장이다 — 셀 단위 dirty 와 같은 톤얼로 알린다
                      isAdded && 'bg-dl-grid-dirty',
                      // 호출부 강조가 마지막이다 — 위 상태 배색을 덮을 수 있어야 뜻이 있다
                      rowClassName?.(row),
                    )}
                    style={{ height: virtualRow.size, top: virtualRow.start }}
                    onClick={onRowActivate ? (event) => handleRowClick(event, row) : undefined}
                  >
                    {hasSelection ? (
                      <div
                        className={cn(
                          'sticky left-0 z-[var(--dl-z-grid-pinned)] flex shrink-0 items-center justify-center',
                          selectable ? 'bg-dl-surface' : 'bg-dl-locked-bg',
                        )}
                        style={{ width: selectColumnWidth }}
                      >
                        <Checkbox
                          size={density}
                          checked={checked}
                          // undefined 여야 그리드의 FormMode edit 핀을 따른다 — "edit" 하드코딩 금지.
                          mode={selectable ? undefined : 'disabled'}
                          aria-label={selection.selectRowLabel}
                          onChange={(event) => {
                            const next = new Set(selection.selectedIds);
                            if (event.target.checked) next.add(rowId);
                            else next.delete(rowId);
                            selection.onChange(next);
                          }}
                        />
                      </div>
                    ) : null}

                    {columns.map((column, index) => (
                      <Cell
                        key={column.id}
                        column={column}
                        row={row}
                        rowId={rowId}
                        density={density}
                        width={widths[index] ?? 0}
                        pinned={index < pinned}
                        left={index < pinned ? offsets[index] : undefined}
                        selectable={selectable}
                        dirty={resolvedDirtyCells?.has(cellKey(rowId, column.id)) ?? false}
                        invalidMessage={editing?.invalidCells.get(cellKey(rowId, column.id))}
                        isAdded={isAdded}
                        headerLabel={resolveHeader(column, translateHeader)}
                        editing={editing}
                        revertCellLabel={revertCellLabel}
                        onPrimaryAction={onRowPrimaryAction}
                        onEditorMove={handleEditorMove}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* ── 합계행 ── 하단 sticky 크롬. 헤더와 같은 배색·고정열 오프셋을 쓴다.
                행이 0이면 없다 — 합계가 없는데 크롬만 남으면 빈 상태 오버레이와 겹친다. */}
            {footer && !isEmpty ? (
              <div
                className="sticky bottom-0 z-[var(--dl-z-grid-header)] flex border-dl-border border-t bg-dl-grid-header"
                style={{ height: rowHeight }}
              >
                {hasSelection ? (
                  <div
                    className="sticky left-0 z-[var(--dl-z-grid-header-pinned)] shrink-0 border-dl-border border-r bg-dl-grid-header"
                    style={{ width: selectColumnWidth }}
                  />
                ) : null}
                {columns.map((column, index) => {
                  const isPinned = index < pinned;
                  const align = column.align ?? 'center';
                  return (
                    <div
                      key={column.id}
                      className={cn(
                        'flex shrink-0 items-center font-semibold text-dl-fg text-dl-sm',
                        GRID_CELL_PX_CLASS[density],
                        align === 'right' && 'justify-end',
                        align === 'center' && 'justify-center',
                        isPinned && 'sticky z-[var(--dl-z-grid-header-pinned)] bg-dl-grid-header',
                      )}
                      style={{
                        width: widths[index] ?? 0,
                        ...(isPinned ? { left: offsets[index] } : null),
                      }}
                    >
                      <span className="truncate">{footer.cells[column.id]}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* 빈 상태와 조회 중이 본문 영역을 덮는다 — 행 자리를 밀어내지 않아 툴바 위치가
            흔들리지 않는다(행이 남은 채 덮으면 컨테이너 높이가 그대로라 점프가 없다).
            ⚠️ 스크롤 컨테이너 **밖**이어야 한다. 안에 두면 가운데정렬이 뷰포트가 아니라
            컬럼 총폭 기준이 되어 가로 스크롤 시 문구가 화면 밖으로 나간다. */}
        {isEmpty || loading ? (
          <GridEmptyOverlay
            top={headerHeight}
            empty={empty}
            loading={loading}
            loadingLabel={loadingLabel}
          />
        ) : null}
      </div>
    </FormMode>
  );
}

function Cell<T extends Record<string, unknown>>({
  column,
  row,
  rowId,
  density,
  width,
  pinned,
  left,
  selectable,
  dirty,
  invalidMessage,
  isAdded,
  headerLabel,
  editing,
  revertCellLabel,
  onPrimaryAction,
  onEditorMove,
}: {
  column: ColumnDef<T>;
  row: T;
  rowId: string;
  /** 그리드 밀도 — 셀 좌우 패딩과 안에 서는 컨트롤(체크박스·에디터)이 함께 따라간다. */
  density: ControlSize;
  /** 헤더와 **같은 계산**에서 온 폭이다. 여기서 따로 구하면 표가 어긋난다. */
  width: number;
  pinned: boolean;
  left: number | undefined;
  selectable: boolean;
  dirty: boolean;
  /** 검증 실패 문구. 있으면 dirty 보다 우선해 오류로 칠한다. */
  invalidMessage: string | undefined;
  /** 추가('A') 행 — primary 링크를 끈다(저장 전 행은 상세가 없다. 현행 `gridWrapper.js:445` 파리티). */
  isAdded: boolean;
  /** 번역된 헤더 문구 — checkbox 에디터의 스크린리더 이름으로 쓴다. */
  headerLabel: string;
  editing: GridEditing | undefined;
  revertCellLabel: string;
  onPrimaryAction?: (row: T) => void;
  onEditorMove: (from: ActiveCell, move: CellEditorMove) => void;
}) {
  const raw = row[column.id] as T[keyof T & string];
  const align = column.align ?? 'center';

  const editable = editing !== undefined && isColumnEditable(column);
  const isCheckbox = editable && column.editor?.type === 'checkbox';
  const isActive =
    editable &&
    !isCheckbox &&
    editing.activeCell?.rowId === rowId &&
    editing.activeCell.columnId === column.id;
  const editOnDoubleClick = editable && !isCheckbox && !isActive;
  /**
   * 셀 단위 초기화 — 편집이 셀 단위이므로 원복도 셀 단위다.
   * dirty(draft 있는) 셀에만 아이콘이 나타난다. 추가('A') 행은 원본이 없어 셀 원복이
   * 무의미하므로 제외한다 — 행 제거는 `removeRow`(선택 삭제)의 영역이다.
   */
  const canRevert = editing !== undefined && dirty && !isAdded && !isActive;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 편집 진입은 더블클릭 전용이다(레거시 dhtmlx 감각) — 행 전체 roving tabindex 는 그리드에 아직 없어, 셀에만 tabIndex 를 주면 표 전체 탭 순서가 셀 수백 개로 오염된다.
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 text-dl-sm',
        // 에디터가 행 안에 서려면 좌우 여백을 줄여야 한다 — 조회 모드만 셀 패딩을 쓴다.
        // 행과 컨트롤의 차이는 어느 density 에서도 8px 고정이라 이 규칙이 단계와 무관하게 성립한다.
        isActive ? 'px-1' : GRID_CELL_PX_CLASS[density],
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        pinned && 'sticky z-[var(--dl-z-grid-pinned)]',
        // 고정열은 배경이 있어야 아래 셀이 비쳐 보이지 않는다
        pinned && (selectable ? 'bg-dl-surface' : 'bg-dl-locked-bg'),
        // 저장 전 수정된 셀 — 미저장 상태를 톤얼로 남긴다(v3 §ds-03)
        dirty && 'bg-dl-grid-dirty',
        // 검증 실패는 dirty 보다 우선한다 — 저장이 막힌 이유가 셀에 보여야 한다
        invalidMessage !== undefined && 'bg-dl-error-bg ring-1 ring-dl-error ring-inset',
        // 편집 가능 셀은 커서를 바꾸지 않는다 — pointer 는 "한 번 클릭" 신호라 더블클릭 진입과 어긋난다.
      )}
      style={{ width, ...(pinned ? { left } : null) }}
      title={invalidMessage}
      onDoubleClick={
        editOnDoubleClick
          ? () => editing.onActiveCellChange({ rowId, columnId: column.id })
          : undefined
      }
    >
      {isActive && editing ? (
        <CellEditor
          column={column}
          row={row}
          value={raw}
          size={density}
          invalid={invalidMessage !== undefined}
          onCommitValue={(value) => editing.onCommit(rowId, column.id, value)}
          onClose={() => editing.onActiveCellChange(null)}
          onMove={(move) => onEditorMove({ rowId, columnId: column.id }, move)}
        />
      ) : (
        <CellContent
          column={column}
          row={row}
          rowId={rowId}
          density={density}
          raw={raw}
          isAdded={isAdded}
          headerLabel={headerLabel}
          editing={isCheckbox ? editing : undefined}
          onPrimaryAction={onPrimaryAction}
        />
      )}

      {canRevert && editing ? (
        <button
          type="button"
          aria-label={revertCellLabel}
          title={revertCellLabel}
          onClick={(event) => {
            event.stopPropagation();
            editing.onRevertCell(rowId, column.id);
          }}
          // 아이콘 더블클릭이 셀의 편집 진입으로 새면 "원복하려다 에디터가 열리는" 사고가 된다
          onDoubleClick={(event) => event.stopPropagation()}
          // size-6(24px)은 density 를 따르지 않는다 — 아이콘 버튼은 행 높이가 아니라
          // **아이콘 축**(--spacing-dl-ic-sm 16px)을 따르고, 가장 좁은 xs 행(40px)에도 들어간다.
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-dl-badge text-dl-fg-muted hover:bg-dl-tonal hover:text-dl-tonal-fg"
        >
          <Icon icon={X} size="sm" />
        </button>
      ) : null}

      {column.rowAction ? (
        <button
          type="button"
          aria-label={column.rowAction.label}
          title={column.rowAction.label}
          onClick={(event) => {
            // 셀의 편집 진입(더블클릭)과 겹치지 않게 한다 — 행 액션은 행 액션만 한다.
            event.stopPropagation();
            column.rowAction?.onAction(row);
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="flex size-6 shrink-0 items-center justify-center rounded-dl-badge text-dl-primary-ink hover:bg-dl-tonal hover:text-dl-tonal-fg"
        >
          <Icon icon={column.rowAction.icon} size="sm" />
        </button>
      ) : null}
    </div>
  );
}

/** 조회 모드 셀 내용 — checkbox 에디터만 상시 인터랙티브 컨트롤을 그린다. */
function CellContent<T extends Record<string, unknown>>({
  column,
  row,
  rowId,
  density,
  raw,
  isAdded,
  headerLabel,
  editing,
  onPrimaryAction,
}: {
  column: ColumnDef<T>;
  row: T;
  rowId: string;
  density: ControlSize;
  raw: T[keyof T & string];
  isAdded: boolean;
  headerLabel: string;
  /** checkbox 에디터일 때만 넘어온다 — 그 외에는 표시 전용이다. */
  editing: GridEditing | undefined;
  onPrimaryAction?: (row: T) => void;
}) {
  if (column.editor?.type === 'checkbox') {
    const checkedValue = column.editor.checkedValue ?? true;
    const uncheckedValue = column.editor.uncheckedValue ?? false;
    const checked = Object.is(raw, checkedValue);
    if (editing) {
      return (
        <Checkbox
          size={density}
          checked={checked}
          aria-label={headerLabel}
          onChange={(event) =>
            // 체크박스는 편집 모드 진입 없이 토글 즉시 커밋한다 — 클릭 두 번을 강요하지 않는다.
            editing.onCommit(rowId, column.id, event.target.checked ? checkedValue : uncheckedValue)
          }
        />
      );
    }
    /**
     * 편집 불가(비편집 그리드 · `editable: false` · `applyLockedColumns` 잠금) 체크박스 컬럼 —
     * raw 값 텍스트(true/false)가 아니라 **비활성 체크박스**로 그린다. 마스킹 잠금 컬럼이
     * 텍스트로 무너지면 잠긴 것이 아니라 다른 데이터로 읽힌다.
     */
    return <Checkbox size={density} checked={checked} mode="disabled" aria-label={headerLabel} />;
  }

  const content = column.format ? column.format(raw, row) : formatDefault(raw);

  // 추가('A') 행은 저장 전이라 상세가 없다 — 링크를 일반 텍스트로 내린다.
  if (column.primary && onPrimaryAction && !isAdded) {
    return (
      <button
        type="button"
        onClick={() => onPrimaryAction(row)}
        // 그리드 링크는 관습색(#0000FF)을 그대로 둔다 — v3 가 브랜드 색조로 끌어오지 않는다
        className="truncate text-dl-grid-link underline underline-offset-2"
      >
        {content}
      </button>
    );
  }
  return <span className="truncate">{content}</span>;
}

/** 키보드 화살표 1회당 조정 폭. Shift 를 누르면 5배로 움직인다. */
const RESIZE_STEP = 8;

/**
 * 컬럼 폭 조절 손잡이 — 헤더 셀 **오른쪽 안쪽**에 붙는다.
 *
 * ⚠️ 셀 밖으로(`-right-3px`) 내밀지 않는다. 헤더 셀은 형제 순서대로 그려지므로
 *    넘친 부분이 다음 셀 배경에 덮여 **잡히지 않는 손잡이**가 된다.
 *
 * 마우스가 아니라 Pointer Events 를 쓰는 이유는 `setPointerCapture` 다 —
 * 포인터가 표 밖으로 벗어나도 이벤트가 계속 이 요소로 오므로, 문서 전역에
 * 리스너를 붙였다 떼는 뒷정리가 필요 없다(현행 `gridWrapper.js` 가 하던 일).
 */
function ColumnResizeHandle({
  label,
  width,
  min,
  max,
  onResize,
  onReset,
}: {
  readonly label: string;
  readonly width: number;
  readonly min: number;
  readonly max: number | undefined;
  readonly onResize: (next: number) => void;
  readonly onReset: () => void;
}) {
  const drag = useRef<{ startX: number; startWidth: number; next: number; frame: number } | null>(
    null,
  );
  const [active, setActive] = useState(false);

  /**
   * 드래그 중 커서를 문서 전체에 강제한다.
   * 포인터 캡처 중에는 커서가 **포인터 아래 요소**의 것으로 바뀌어, 표 밖으로 나가면
   * 조절 중이라는 신호가 사라진다. cleanup 이 있으니 드래그 중 언마운트에도 안전하다.
   */
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.cursor;
    document.body.style.cursor = 'col-resize';
    return () => {
      document.body.style.cursor = previous;
    };
  }, [active]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    // 텍스트 선택과 드래그 고스트를 막는다 — 둘 다 조절 중 화면을 지저분하게 만든다.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { startX: event.clientX, startWidth: width, next: width, frame: 0 };
    setActive(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    state.next = state.startWidth + (event.clientX - state.startX);

    // `pointermove` 는 한 프레임에 여러 번 온다. 그때마다 setState 하면
    // 가시행 × 컬럼 전체가 다시 그려져 드래그가 끊긴다 — 프레임당 한 번으로 합친다.
    if (state.frame !== 0) return;
    state.frame = requestAnimationFrame(() => {
      const current = drag.current;
      if (!current) return;
      current.frame = 0;
      onResize(current.next);
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    if (state.frame !== 0) cancelAnimationFrame(state.frame);
    drag.current = null;
    setActive(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    /**
     * **움직이지 않았으면 아무것도 기록하지 않는다.**
     * 그냥 눌렀다 뗀 것까지 폭으로 저장하면 그 컬럼이 "사용자가 조정한 컬럼"으로 남아
     * `grow` 분배에서 영구히 빠진다 — 손댄 적 없다고 생각하는 컬럼의 폭이 굳는다.
     * 더블클릭(=기본 폭 복원)도 클릭 두 번을 동반하므로 이 가드가 없으면 서로 싸운다.
     */
    if (state.next === state.startWidth) return;
    // 취소한 프레임에 마지막 이동이 실려 있을 수 있다 — 놓은 자리를 확정한다.
    onResize(state.next);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? RESIZE_STEP * 5 : RESIZE_STEP;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onResize(width - step);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onResize(width + step);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: <hr> 는 포커스도 포인터 드래그도 받을 수 없다. 조작 가능한 구분자는 ARIA window splitter(role=separator + tabIndex + aria-value*)가 표준이고, 그게 이 손잡이의 정확한 의미다.
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      {...(max !== undefined ? { 'aria-valuemax': max } : null)}
      tabIndex={0}
      title={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      className={cn(
        // touch-none 이 없으면 터치 기기에서 드래그가 스크롤로 가로채인다
        'absolute top-0 right-0 h-full w-[7px] cursor-col-resize touch-none select-none',
        /**
         * 평상시 이 선이 곧 **컬럼 경계선**이다 — 헤더 셀의 border-r 을 대신하므로
         * 톤도 그것과 같은 border 다. 손잡이라고 따로 티내지 않아 헤더가 조용해진다.
         */
        'after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-dl-border',
        'after:transition-[width,background-color] after:duration-100',
        /**
         * 잡는 자리는 갖다 댔을 때 살아난다 — 색만 바꾸면 1px 선이라 눈에 안 띄어서
         * 폭까지 2px 로 굵힌다. 굵어지는 방향은 셀 **안쪽**이라 옆 컬럼을 침범하지 않는다.
         */
        'hover:after:w-[2px] hover:after:bg-dl-primary',
        // 기본 포커스링은 7px 짜리 얇은 요소에 어울리지 않는다 — 강조선이 그 역할을 대신한다(tabs 와 같은 규약).
        'focus-visible:outline-none focus-visible:after:w-[2px] focus-visible:after:bg-dl-primary',
        active && 'after:w-[2px] after:bg-dl-primary',
      )}
    />
  );
}

/**
 * 헤더 표시 문구를 정한다. 번역기가 없으면 코드를 그대로 보여준다 —
 * 사전 연동 전이거나 `ui` 를 다른 앱에서 쓸 때의 동작이다.
 */
function resolveHeader<T extends Record<string, unknown>>(
  column: ColumnDef<T>,
  translateHeader: ((code: string) => string) | undefined,
): string {
  const code = column.headerWord ?? column.id;
  return translateHeader ? translateHeader(code) : code;
}

function formatDefault(value: unknown): ReactNode {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Y' : 'N';
  return String(value);
}

/**
 * 정렬 방향 표시 — QA 세트의 `arrow-up`/`arrow-down` 을 그대로 쓴다.
 * 미지정 상태는 down 을 흐리게 둔다: "누르면 이 방향으로 정렬된다"는 예고다.
 */
function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  if (direction === 'asc') return <Icon icon={ArrowUp} size="sm" />;
  if (direction === 'desc') return <Icon icon={ArrowDown} size="sm" />;
  return <Icon icon={ArrowDown} size="sm" className="opacity-40" />;
}
