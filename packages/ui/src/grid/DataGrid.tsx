'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Checkbox } from '../components/checkbox';
import { Spinner } from '../components/feedback';
import { FormMode } from '../components/form-mode';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { useTokenPx } from '../lib/useTokenPx';
import { CellEditor, type CellEditorMove } from './CellEditor';
import { type ColumnDef, isColumnEditable, pinnedCount } from './columns';
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

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowId,
  isFetching,
  empty,
  loadingLabel = '불러오는 중',
  translateHeader,
  sortOf,
  onToggleSort,
  onRowPrimaryAction,
  selection,
  editing,
  dirtyCells,
  invalid,
  attachedToolbar = false,
  maxHeight = 560,
  defaultColumnWidth,
  columnWidths,
  onColumnWidthsChange,
  resizableColumns = true,
  resizeColumnLabel = '컬럼 너비 조절',
  revertCellLabel = '수정 원복',
}: {
  readonly columns: readonly ColumnDef<T>[];
  readonly rows: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly isFetching?: boolean;
  /** 빈 상태는 본문 영역을 **덮는 오버레이**다 — 행 자리를 밀어내지 않는다(v3 §ds-03). */
  readonly empty?: { readonly title: ReactNode; readonly hint?: ReactNode };
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
   * 그리드도 하나의 입력 요소로 본다(v3 §ds-05) — 표 전체에 빨간 보더를 두른다.
   * **문구는 여기 없다.** 카드 제목 옆에 두는 것이 규칙이고, 그건 호출부가 안다.
   */
  readonly invalid?: boolean;
  /** 아래에 툴바가 이어 붙으면 아래 모서리를 각지게 한다. */
  readonly attachedToolbar?: boolean;
  readonly maxHeight?: number;
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
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 행 높이는 테마 토큰이 소유한다 — 숫자를 박아두면 테마를 바꿔도 그리드가 안 바뀐다.
  const rowHeight = useTokenPx('--spacing-dl-grid-row', 50);
  const headerHeight = useTokenPx('--spacing-dl-grid-header', 50);
  const selectColumnWidth = useTokenPx('--spacing-dl-grid-check', 40);

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
        {isFetching ? (
          // 재조회 중에도 이전 데이터를 유지한다(keepPreviousData) — 화면이 비면 체감이 나빠진다.
          <div className="absolute top-2 right-2 z-[var(--dl-z-grid-empty)] flex items-center gap-1 rounded-dl-control bg-dl-surface/90 px-2 py-1">
            <Spinner />
            <span className="text-dl-xs text-dl-fg-muted">{loadingLabel}</span>
          </div>
        ) : null}

        <div ref={scrollRef} className="overflow-auto" style={{ maxHeight }}>
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
                      // 구분선은 surface(흰색)가 아니라 border 다 — 회색 헤더 위에서 흰 선은 묻혀서
                      // 리사이즈 손잡이가 어디 있는지 보이지 않는다. (QA 는 헤더 세로선을 제거하지만
                      // 그건 리사이즈가 없던 dhtmlx 규칙이다 — 잡는 자리는 보여야 한다.)
                      'relative flex shrink-0 border-r border-dl-border bg-dl-grid-header',
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
                  <div
                    key={rowId}
                    className={cn(
                      'absolute left-0 flex w-full border-b border-dl-divider',
                      // 고를 수 없는 행은 입력 칸의 '비활성'과 **같은 토큰**을 쓴다(v3 §ds-03)
                      selectable ? 'hover:bg-dl-grid-hover' : 'bg-dl-locked-bg text-dl-locked-fg',
                      // 추가('A') 행은 행 전체가 미저장이다 — 셀 단위 dirty 와 같은 톤얼로 알린다
                      isAdded && 'bg-dl-grid-dirty',
                    )}
                    style={{ height: virtualRow.size, top: virtualRow.start }}
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
                          checked={checked}
                          disabled={!selectable}
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

            {/* 빈 상태는 본문 영역을 덮는다 — 행 자리를 밀어내지 않아 툴바 위치가 흔들리지 않는다 */}
            {rows.length === 0 && empty ? (
              <div
                className="absolute right-0 left-0 z-[var(--dl-z-grid-empty)] flex flex-col items-center justify-center gap-1.5 bg-dl-surface text-center"
                style={{ top: headerHeight, height: Math.max(rowHeight * 8, 160) }}
              >
                <p className="text-dl-base font-semibold text-dl-fg-muted">{empty.title}</p>
                {empty.hint ? <p className="text-dl-sm text-dl-fg-subtle">{empty.hint}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </FormMode>
  );
}

function Cell<T extends Record<string, unknown>>({
  column,
  row,
  rowId,
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
        // 에디터(42px)가 50px 행에 서려면 좌우 여백을 줄여야 한다 — 조회 모드만 셀 패딩을 쓴다
        isActive ? 'px-1' : 'px-dl-cell-x',
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
          className="flex size-6 shrink-0 items-center justify-center rounded-dl-badge text-dl-primary hover:bg-dl-tonal hover:text-dl-tonal-fg"
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
  raw,
  isAdded,
  headerLabel,
  editing,
  onPrimaryAction,
}: {
  column: ColumnDef<T>;
  row: T;
  rowId: string;
  raw: T[keyof T & string];
  isAdded: boolean;
  headerLabel: string;
  /** checkbox 에디터일 때만 넘어온다 — 그 외에는 표시 전용이다. */
  editing: GridEditing | undefined;
  onPrimaryAction?: (row: T) => void;
}) {
  if (editing && column.editor?.type === 'checkbox') {
    const checkedValue = column.editor.checkedValue ?? true;
    const uncheckedValue = column.editor.uncheckedValue ?? false;
    return (
      <Checkbox
        checked={Object.is(raw, checkedValue)}
        aria-label={headerLabel}
        onChange={(event) =>
          // 체크박스는 편집 모드 진입 없이 토글 즉시 커밋한다 — 클릭 두 번을 강요하지 않는다.
          editing.onCommit(rowId, column.id, event.target.checked ? checkedValue : uncheckedValue)
        }
      />
    );
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
        // 기본에도 separator(#ccc)로 살짝 보인다 — 상하 4px 들여진 짧은 선이라
        // 풀하이트 셀 구분선과 구별되어 "잡는 손잡이"로 읽힌다. 상호작용 시 primary 로 강조.
        'after:absolute after:top-1 after:right-[3px] after:bottom-1 after:w-px after:bg-dl-separator',
        'hover:after:bg-dl-primary focus-visible:after:bg-dl-primary',
        active && 'after:bg-dl-primary',
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
