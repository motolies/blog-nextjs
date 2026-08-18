'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { warnOnce } from '../lib/warnOnce';
import type { ColumnDef } from './columns';
import {
  type ActiveCell,
  type AddedRow,
  applyCellDraft,
  cellKey,
  collectInvalidCells,
  type DraftMap,
  deriveDirtyCells,
  deriveModifiedData,
  type GridEditing,
  type ModifiedData,
  mergeEditingRows,
  NEW_ROW_ID_FIELD,
  parseCellKey,
  type SaveRequestData,
  toSaveRequestData,
} from './gridEditing';

/**
 * `useGridEditing` 이 돌려주는 편집 API.
 *
 * 그리드 배선 3종(`rows`/`getRowId`/`binding`)을 `DataGrid` 에 그대로 넘기고,
 * 저장 계약 4종(`isModified`/`getModifiedData`/`getSaveRequestData`/`reset`)은
 * 레거시 `gridWrapper.js` 와 이름·형태가 같다.
 */
export type GridEditingApi<T> = {
  /** 추가 행 + draft 가 병합된 표시용 행 — `DataGrid` 의 `rows` 에 넘긴다. */
  readonly rows: readonly T[];
  /** 신규 행 임시 id 를 우선 읽는 래퍼 — `DataGrid` 의 `getRowId` 에 넘긴다. */
  readonly getRowId: (row: T) => string;
  /** `DataGrid` 의 `editing` prop 에 그대로 넘긴다. */
  readonly binding: GridEditing;
  readonly dirtyCells: ReadonlySet<string>;

  /** 행을 추가하고 임시 rowId 를 돌려준다. 기본 위치는 레거시 `addRow` 처럼 맨 아래다. */
  readonly addRow: (initial?: Partial<T>, options?: { readonly at?: 'start' | 'end' }) => string;
  /** 추가('A') 행만 즉시 제거한다 — 저장 계약에 deleteList 가 없다(레거시 파리티). */
  readonly removeRow: (rowId: string) => void;
  readonly setCell: (rowId: string, columnId: keyof T & string, value: unknown) => void;
  readonly isModified: boolean;
  readonly getModifiedData: () => ModifiedData<T>;
  readonly getSaveRequestData: () => SaveRequestData<T>;
  /** 전부 초기화. 저장 성공 후 `invalidateQueries` 와 함께 부른다 — dirty 표시가 꺼지는 지점이다. */
  readonly reset: () => void;

  /** 셀 하나를 원본 값으로 되돌린다. */
  readonly revertCell: (rowId: string, columnId: string) => void;
  /** 행 전체를 되돌린다. 'A' 행이면 `removeRow` 와 같다. */
  readonly revertRow: (rowId: string) => void;

  readonly invalidCells: ReadonlyMap<string, string>;
  /** 저장 전 전수 검증. 실패하면 첫 invalid 셀로 activeCell 을 옮기고 false 를 돌려준다. */
  readonly validateAll: () => boolean;

  readonly activeCell: ActiveCell | null;
  readonly setActiveCell: (next: ActiveCell | null) => void;
};

/** invalid 맵에서 한 행의 키를 전부 지운 새 맵. 변화가 없으면 원본을 그대로 돌려준다. */
function clearRowInvalid(
  invalid: ReadonlyMap<string, string>,
  rowId: string,
): ReadonlyMap<string, string> {
  let next: Map<string, string> | null = null;
  for (const key of invalid.keys()) {
    if (parseCellKey(key).rowId !== rowId) continue;
    next ??= new Map(invalid);
    next.delete(key);
  }
  return next ?? invalid;
}

/**
 * 그리드 인라인 편집 상태 훅 — 설계 문서 §7.4 의 `useGridEditing` 구현.
 *
 * 스냅샷(비교 기준)은 `data` 에서 파생하고 별도 복사본을 들지 않는다 —
 * 재조회로 `data` 가 바뀌면 비교 기준도 자연히 따라간다.
 *
 * `columns` 는 **숨김 적용 전 전체 목록**을 받아야 한다. 검증(`validate`)의 소유자가
 * 이 훅인데, preference 적용본을 받으면 사용자가 숨긴 편집 컬럼이 검증에서 빠진다.
 */
export function useGridEditing<T extends Record<string, unknown>>({
  data,
  getRowId,
  columns,
  resetKey,
}: {
  readonly data: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly columns: readonly ColumnDef<T>[];
  /** 바뀌면 편집 상태를 전부 비운다. `useGridSelection` 의 resetKey 와 같은 규약이다. */
  readonly resetKey?: string;
}): GridEditingApi<T> {
  const [drafts, setDrafts] = useState<DraftMap<T>>(() => new Map());
  const [added, setAdded] = useState<readonly AddedRow<T>[]>([]);
  const [invalidCells, setInvalidCells] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  /** 신규 행 임시 id 의 단조 카운터 — `Date.now`/`Math.random` 없이 결정적이다. */
  const newRowSeq = useRef(0);

  useEffect(() => {
    // 검색조건·페이지가 바뀌었는데 draft 가 남으면, 화면에 없는 행의 수정이 저장에 실려 나간다.
    setDrafts(new Map());
    setAdded([]);
    setInvalidCells(new Map());
    setActiveCell(null);
  }, [resetKey]);

  const snapshot = useMemo(
    () => new Map(data.map((row) => [getRowId(row), row])),
    [data, getRowId],
  );

  const resolveRowId = useCallback(
    (row: T) => {
      const newId = row[NEW_ROW_ID_FIELD];
      return typeof newId === 'string' ? newId : getRowId(row);
    },
    [getRowId],
  );

  const rows = useMemo(
    () => mergeEditingRows({ data, getRowId, drafts, added }),
    [data, getRowId, drafts, added],
  );

  const dirtyCells = useMemo(() => deriveDirtyCells(drafts), [drafts]);

  const addedRowIds = useMemo<ReadonlySet<string>>(
    () => new Set(added.map((entry) => resolveRowId(entry.row))),
    [added, resolveRowId],
  );

  const columnById = useMemo(
    () => new Map(columns.map((column) => [column.id as string, column])),
    [columns],
  );

  const setCell = useCallback(
    (rowId: string, columnId: keyof T & string, value: unknown) => {
      if (addedRowIds.has(rowId)) {
        // 추가 행은 draft 를 거치지 않고 행을 직접 교체한다 — 상태가 항상 'A' 다.
        setAdded((prev) =>
          prev.map((entry) =>
            resolveRowId(entry.row) === rowId
              ? { ...entry, row: { ...entry.row, [columnId]: value } }
              : entry,
          ),
        );
      } else {
        setDrafts((prev) => applyCellDraft({ drafts: prev, snapshot, rowId, columnId, value }));
      }

      // 커밋 시점 셀 검증 — 통과하면 남아 있던 오류를 지운다.
      const column = columnById.get(columnId);
      if (!column?.validate) return;
      const current = rows.find((row) => resolveRowId(row) === rowId);
      const message = current ? column.validate(value, { ...current, [columnId]: value }) : null;
      setInvalidCells((prev) => {
        const key = cellKey(rowId, columnId);
        if (message === null && !prev.has(key)) return prev;
        const next = new Map(prev);
        if (message === null) next.delete(key);
        else next.set(key, message);
        return next;
      });
    },
    [addedRowIds, resolveRowId, snapshot, columnById, rows],
  );

  const addRow = useCallback(
    (initial?: Partial<T>, options?: { readonly at?: 'start' | 'end' }) => {
      newRowSeq.current += 1;
      const rowId = `nx-new-${newRowSeq.current}`;
      // 누락 필드는 undefined 로 남는다 — `formatDefault` 가 빈 문자열로 그린다.
      const row = { ...initial, [NEW_ROW_ID_FIELD]: rowId } as unknown as T;
      setAdded((prev) => [...prev, { at: options?.at ?? 'end', row }]);
      return rowId;
    },
    [],
  );

  const removeRow = useCallback(
    (rowId: string) => {
      if (!addedRowIds.has(rowId)) {
        warnOnce(
          `grid-editing-remove-existing:${rowId}`,
          `removeRow 는 추가된('A') 행만 제거합니다. 기존 행 삭제는 저장 계약(addList/updateList)에 없습니다 — 별도 삭제 API 로 처리하세요.`,
        );
        return;
      }
      setAdded((prev) => prev.filter((entry) => resolveRowId(entry.row) !== rowId));
      setInvalidCells((prev) => clearRowInvalid(prev, rowId));
      setActiveCell((prev) => (prev?.rowId === rowId ? null : prev));
    },
    [addedRowIds, resolveRowId],
  );

  const revertCell = useCallback((rowId: string, columnId: string) => {
    setDrafts((prev) => {
      const rowDraft = prev.get(rowId);
      if (!rowDraft || !(columnId in rowDraft)) return prev;
      const nextDraft: Record<string, unknown> = { ...rowDraft };
      delete nextDraft[columnId];
      const next = new Map(prev);
      if (Object.keys(nextDraft).length === 0) next.delete(rowId);
      else next.set(rowId, nextDraft as Partial<T>);
      return next;
    });
    setInvalidCells((prev) => {
      const key = cellKey(rowId, columnId);
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const revertRow = useCallback(
    (rowId: string) => {
      if (addedRowIds.has(rowId)) {
        removeRow(rowId);
        return;
      }
      setDrafts((prev) => {
        if (!prev.has(rowId)) return prev;
        const next = new Map(prev);
        next.delete(rowId);
        return next;
      });
      setInvalidCells((prev) => clearRowInvalid(prev, rowId));
    },
    [addedRowIds, removeRow],
  );

  const validateAll = useCallback(() => {
    // 추가 행은 서버 id 가 없다 — 원시 getRowId 가 아니라 임시 id 를 읽는 래퍼를 넘겨야
    // invalid 키가 화면의 rowId 와 일치한다.
    const invalid = collectInvalidCells({ columns, data, getRowId: resolveRowId, drafts, added });
    setInvalidCells(invalid);
    const firstKey = invalid.keys().next().value;
    if (firstKey !== undefined) {
      // 첫 오류 셀로 이동시켜 "저장이 왜 안 되나"를 화면이 직접 가리키게 한다.
      setActiveCell(parseCellKey(firstKey));
      return false;
    }
    return true;
  }, [columns, data, resolveRowId, drafts, added]);

  const getModifiedData = useCallback(
    () => deriveModifiedData({ data, getRowId, drafts, added }),
    [data, getRowId, drafts, added],
  );

  const getSaveRequestData = useCallback(
    () => toSaveRequestData(deriveModifiedData({ data, getRowId, drafts, added })),
    [data, getRowId, drafts, added],
  );

  const reset = useCallback(() => {
    setDrafts(new Map());
    setAdded([]);
    setInvalidCells(new Map());
    setActiveCell(null);
  }, []);

  const binding = useMemo<GridEditing>(
    () => ({
      activeCell,
      onActiveCellChange: setActiveCell,
      onCommit: (rowId, columnId, value) => setCell(rowId, columnId as keyof T & string, value),
      onRevertCell: revertCell,
      dirtyCells,
      invalidCells,
      addedRowIds,
    }),
    [activeCell, setCell, revertCell, dirtyCells, invalidCells, addedRowIds],
  );

  return {
    rows,
    getRowId: resolveRowId,
    binding,
    dirtyCells,
    addRow,
    removeRow,
    setCell,
    isModified: drafts.size > 0 || added.length > 0,
    getModifiedData,
    getSaveRequestData,
    reset,
    revertCell,
    revertRow,
    invalidCells,
    validateAll,
    activeCell,
    setActiveCell,
  };
}
