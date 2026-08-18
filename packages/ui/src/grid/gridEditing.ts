import { type ColumnDef, isColumnEditable } from './columns';

/**
 * 인라인 편집의 순수 계층 — 현행 `gridWrapper.js` 의 `getModifiedData()` 계약 대응.
 *
 * `columnLayout.ts` 와 같은 이유로 React 무의존이다: vitest 환경이 `node`(DOM 없음)라
 * diff·이동·검증 규칙을 여기서 순수 함수로 검증하고, 훅(`useGridEditing`)은 배선만 한다.
 *
 * 상태 모델(설계 문서 §7.4):
 * - **스냅샷** = 서버 조회 원본 `Map<rowId, T>` — 별도 복사 없이 조회 데이터에서 파생한다.
 * - **드래프트** = `Map<rowId, Partial<T>>` — 스냅샷과 다른 필드만 남긴다.
 *   값이 원복되면 필드가 지워지고, 행의 draft 가 비면 엔트리째 사라진다 → **U 자동 해제**.
 * - **추가 행** = 별도 배열. 항상 rowStatus 'A' 다 — draft 를 거치지 않고 행을 직접 교체한다.
 */

/** 레거시 `gridWrapper.dataStatus` 의 A(추가)/U(수정). R(조회)은 diff 에 안 나타나므로 없다. */
export type RowStatus = 'A' | 'U';

export type ActiveCell = { readonly rowId: string; readonly columnId: string };

/**
 * 신규 행의 임시 rowId 예약 필드. 신규 행은 서버 id 가 없어 `getRowId` 가 실패하므로
 * 훅이 이 필드를 심고 자신의 `getRowId` 래퍼에서 우선 읽는다.
 * **저장 계약 출력(`getModifiedData`)에서는 제거된다** — 서버가 모르는 필드다.
 */
export const NEW_ROW_ID_FIELD = '__nxNewRowId';

/** `getModifiedData()` 반환 — 레거시와 동일하게 상태 코드가 곧 키다. */
export type ModifiedData<T> = {
  readonly isModified: boolean;
  readonly A: readonly T[];
  readonly U: readonly T[];
};

/** `getSaveRequestData()` 반환 — 레거시 저장 요청 body 계약. */
export type SaveRequestData<T> = {
  readonly addList: readonly T[];
  readonly updateList: readonly T[];
};

/**
 * DataGrid 의 `editing` prop 계약 — `GridSelection` 과 같은 자리다.
 * 그리드는 이걸 통해 렌더(dirty/invalid/추가 행)와 이벤트(셀 활성화·커밋)만 담당하고,
 * 상태는 전부 훅이 소유한다. 행 타입과 무관한 좌표(rowId/columnId) 계약이라 제네릭이 없다.
 */
export type GridEditing = {
  /** 지금 에디터가 열려 있는 셀. null 이면 조회 모드다. */
  readonly activeCell: ActiveCell | null;
  readonly onActiveCellChange: (next: ActiveCell | null) => void;
  /** 에디터가 값을 확정했다. 검증·draft 반영은 훅의 몫이다. */
  readonly onCommit: (rowId: string, columnId: string, value: unknown) => void;
  /** dirty 셀의 초기화 아이콘이 부른다 — 그 셀만 원본 값으로 되돌린다. */
  readonly onRevertCell: (rowId: string, columnId: string) => void;
  /** 수정된 셀. key = `${rowId}:${columnId}` — 기존 `dirtyCells` prop 과 같은 형식. */
  readonly dirtyCells: ReadonlySet<string>;
  /** 검증 실패 셀 → 번역된 오류 문구. */
  readonly invalidCells: ReadonlyMap<string, string>;
  /** 추가된 행(rowStatus 'A'). 행 전체 dirty 배경 + primary 링크 비활성의 근거다. */
  readonly addedRowIds: ReadonlySet<string>;
};

/** 행 draft 맵. 값은 스냅샷과 **다른** 필드만 담는다. */
export type DraftMap<T> = ReadonlyMap<string, Readonly<Partial<T>>>;

/** 추가 행 엔트리 — 표시 위치(`at`)까지 있어야 merge 가 결정적이다. */
export type AddedRow<T> = {
  readonly at: 'start' | 'end';
  readonly row: T;
};

/** dirty/invalid 셀 키. `DataGrid` 의 `dirtyCells` 계약과 동일한 형식이다. */
export function cellKey(rowId: string, columnId: string): string {
  return `${rowId}:${columnId}`;
}

/**
 * 셀 키를 도로 좌표로 푼다. rowId 에 `:` 가 들어갈 수 있으므로 **마지막** 구분자로 가른다 —
 * columnId 는 `keyof T` 식별자라 `:` 를 포함할 수 없다.
 */
export function parseCellKey(key: string): ActiveCell {
  const separator = key.lastIndexOf(':');
  return { rowId: key.slice(0, separator), columnId: key.slice(separator + 1) };
}

/**
 * 셀 하나의 수정을 draft 맵에 반영한 **새 맵**을 돌려준다.
 *
 * 핵심 규칙: 스냅샷 값과 `Object.is` 로 같아지면 draft 에서 **필드를 지운다**.
 * 행의 draft 가 비면 엔트리째 지운다 — 이게 "값을 원복하면 UPDATE 가 해제된다"는
 * 설계 문서 §7.4 의 규칙이고, 현행(한 번 건드리면 계속 U)보다 정확하다.
 */
export function applyCellDraft<T extends Record<string, unknown>>({
  drafts,
  snapshot,
  rowId,
  columnId,
  value,
}: {
  readonly drafts: DraftMap<T>;
  readonly snapshot: ReadonlyMap<string, T>;
  readonly rowId: string;
  readonly columnId: keyof T & string;
  readonly value: unknown;
}): DraftMap<T> {
  const original = snapshot.get(rowId);
  const rowDraft: Record<string, unknown> = { ...drafts.get(rowId) };

  if (original !== undefined && Object.is(original[columnId], value)) {
    delete rowDraft[columnId];
  } else {
    rowDraft[columnId] = value;
  }

  const next = new Map(drafts);
  if (Object.keys(rowDraft).length === 0) {
    next.delete(rowId);
  } else {
    next.set(rowId, rowDraft as Partial<T>);
  }
  return next;
}

/**
 * 표시용 행을 조립한다: 앞쪽 추가 행 + (조회 행 ⊕ draft) + 뒤쪽 추가 행.
 *
 * `at: 'start'` 는 레거시 `addRowFirst` 처럼 **나중에 추가한 행이 위**에 온다.
 * `at: 'end'` 는 추가한 순서대로 아래에 붙는다.
 */
export function mergeEditingRows<T extends Record<string, unknown>>({
  data,
  getRowId,
  drafts,
  added,
}: {
  readonly data: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly drafts: DraftMap<T>;
  readonly added: readonly AddedRow<T>[];
}): readonly T[] {
  const startRows: T[] = [];
  const endRows: T[] = [];
  for (const entry of added) {
    if (entry.at === 'start') startRows.unshift(entry.row);
    else endRows.push(entry.row);
  }

  const merged = data.map((row) => {
    const draft = drafts.get(getRowId(row));
    return draft ? { ...row, ...draft } : row;
  });

  return [...startRows, ...merged, ...endRows];
}

/** draft 맵에서 dirty 셀 키 집합을 파생한다. */
export function deriveDirtyCells<T>(drafts: DraftMap<T>): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const [rowId, draft] of drafts) {
    for (const columnId of Object.keys(draft)) {
      keys.add(cellKey(rowId, columnId));
    }
  }
  return keys;
}

/** 신규 행 임시 id 필드를 떼어낸다 — 저장 계약 출력 직전에만 쓴다. */
function stripNewRowId<T extends Record<string, unknown>>(row: T): T {
  if (!(NEW_ROW_ID_FIELD in row)) return row;
  const { [NEW_ROW_ID_FIELD]: _ignored, ...rest } = row;
  return rest as unknown as T;
}

/**
 * `getModifiedData()` — U 는 스냅샷⊕draft 병합본, A 는 임시 id 를 뗀 추가 행.
 * 레거시와 동일하게 상태 코드('A'/'U')가 곧 결과의 키다.
 */
export function deriveModifiedData<T extends Record<string, unknown>>({
  data,
  getRowId,
  drafts,
  added,
}: {
  readonly data: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly drafts: DraftMap<T>;
  readonly added: readonly AddedRow<T>[];
}): ModifiedData<T> {
  const updated: T[] = [];
  for (const row of data) {
    const draft = drafts.get(getRowId(row));
    if (draft) updated.push({ ...row, ...draft });
  }
  const addedRows = added.map((entry) => stripNewRowId(entry.row));

  return {
    isModified: addedRows.length > 0 || updated.length > 0,
    A: addedRows,
    U: updated,
  };
}

/** `getSaveRequestData()` — 저장 요청 body 형태로 이름만 바꾼다. */
export function toSaveRequestData<T>(modified: ModifiedData<T>): SaveRequestData<T> {
  return { addList: modified.A, updateList: modified.U };
}

/**
 * 키보드 이동이 멈출 수 있는 컬럼인지.
 * checkbox 는 에디터 전환이 없는 상시 컨트롤이라 activeCell 이동 대상에서 뺀다 —
 * 이동해 봐야 화면에 아무 변화가 없다.
 */
function isNavigableColumn<T>(column: ColumnDef<T>): boolean {
  return isColumnEditable(column) && column.editor?.type !== 'checkbox';
}

/**
 * Tab/Shift+Tab/Enter 의 다음 편집 셀을 찾는다. **보이는 컬럼**(preference 적용본) 기준이다.
 *
 * - `next`/`prev`: 같은 행의 좌우 편집 컬럼 → 행 끝에서 다음/이전 행으로 wrap → 그리드 끝이면 null
 * - `down`: 같은 컬럼의 아래 행. 마지막 행이면 null
 */
export function findNextEditableCell<T extends Record<string, unknown>>({
  columns,
  rows,
  getRowId,
  from,
  move,
}: {
  readonly columns: readonly ColumnDef<T>[];
  readonly rows: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly from: ActiveCell;
  readonly move: 'next' | 'prev' | 'down';
}): ActiveCell | null {
  const rowIndex = rows.findIndex((row) => getRowId(row) === from.rowId);
  if (rowIndex < 0) return null;

  if (move === 'down') {
    const nextRow = rows[rowIndex + 1];
    return nextRow ? { rowId: getRowId(nextRow), columnId: from.columnId } : null;
  }

  const columnIndex = columns.findIndex((column) => column.id === from.columnId);
  if (columnIndex < 0) return null;
  const step = move === 'next' ? 1 : -1;

  // 같은 행에서 좌/우로 훑고, 끝에 닿으면 다음/이전 행의 반대쪽 끝에서 잇는다.
  let r = rowIndex;
  let c = columnIndex + step;
  while (r >= 0 && r < rows.length) {
    while (c >= 0 && c < columns.length) {
      const column = columns[c];
      if (column && isNavigableColumn(column)) {
        const row = rows[r];
        if (!row) return null;
        return { rowId: getRowId(row), columnId: column.id };
      }
      c += step;
    }
    r += step;
    c = step > 0 ? 0 : columns.length - 1;
  }
  return null;
}

/**
 * `validateAll()` 의 코어 — 저장 직전 전수 검사.
 *
 * - **A 행**: 편집 가능한(editor 有·잠기지 않은) 모든 컬럼을 검사한다. 새 행은 전 필드가 입력이다.
 * - **U 행**: **draft 필드만** 검사한다. 사용자가 안 건드린 필드의 기존 오류가
 *   저장을 막으면, 고칠 수단이 없는 오류에 갇힌다.
 *
 * 컬럼은 **숨김 적용 전 전체 목록**을 받아야 한다 — 숨긴 편집 컬럼의 검증이 빠지면
 * 보이지 않는 곳으로 불량 데이터가 저장된다.
 */
export function collectInvalidCells<T extends Record<string, unknown>>({
  columns,
  data,
  getRowId,
  drafts,
  added,
}: {
  readonly columns: readonly ColumnDef<T>[];
  readonly data: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly drafts: DraftMap<T>;
  readonly added: readonly AddedRow<T>[];
}): ReadonlyMap<string, string> {
  const invalid = new Map<string, string>();
  const columnById = new Map(columns.map((column) => [column.id as string, column]));

  for (const entry of added) {
    const rowId = getRowId(entry.row);
    for (const column of columns) {
      if (!isColumnEditable(column) || !column.validate) continue;
      const message = column.validate(entry.row[column.id], entry.row);
      if (message !== null) invalid.set(cellKey(rowId, column.id), message);
    }
  }

  for (const row of data) {
    const rowId = getRowId(row);
    const draft = drafts.get(rowId);
    if (!draft) continue;
    const merged = { ...row, ...draft };
    for (const columnId of Object.keys(draft)) {
      const column = columnById.get(columnId);
      if (!column?.validate) continue;
      const message = column.validate(merged[columnId], merged);
      if (message !== null) invalid.set(cellKey(rowId, columnId), message);
    }
  }

  return invalid;
}
