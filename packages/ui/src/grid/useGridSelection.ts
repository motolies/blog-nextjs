'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type SelectAllState = 'none' | 'some' | 'all';

/**
 * 그리드 행 선택 상태.
 *
 * **`resetKey` 가 이 훅의 핵심이다.** 검색 조건이나 페이지가 바뀌면 선택을 비운다 —
 * 안 비우면 화면에 없는 행이 선택된 채로 남고, 사용자는 "3건 선택"만 보고
 * 자기가 지금 보는 3건인 줄 안다. 그 상태로 일괄 삭제를 누르면 사고가 난다.
 *
 * v3 §ds-03: 고를 수 없는 행은 **목록에서 빼지 않고** 회색으로 남기며,
 * 전체 선택은 고를 수 있는 행만 대상으로 한다.
 */
export function useGridSelection<T>({
  rows,
  getRowId,
  isSelectable,
  resetKey,
}: {
  readonly rows: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly isSelectable?: (row: T) => boolean;
  /**
   * 이 값이 바뀌면 선택을 비운다. 보통 정렬된 URL(검색조건+페이지+정렬)을 넘긴다 —
   * 그게 "지금 보고 있는 목록"의 신원이다.
   */
  readonly resetKey: string;
}): {
  readonly selectedIds: ReadonlySet<string>;
  readonly onChange: (next: ReadonlySet<string>) => void;
  readonly selectedCount: number;
  readonly allState: SelectAllState;
  readonly toggleAll: () => void;
  readonly clear: () => void;
} {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [resetKey]);

  const selectableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of rows) {
      if (isSelectable && !isSelectable(row)) continue;
      ids.add(getRowId(row));
    }
    return ids;
  }, [rows, getRowId, isSelectable]);

  const allState: SelectAllState = useMemo(() => {
    if (selectableIds.size === 0) return 'none';
    let picked = 0;
    for (const id of selectableIds) if (selectedIds.has(id)) picked += 1;
    if (picked === 0) return 'none';
    return picked === selectableIds.size ? 'all' : 'some';
  }, [selectableIds, selectedIds]);

  const toggleAll = useCallback(() => {
    // 일부만 선택된 상태에서 누르면 **전체 선택**이 된다 — 비우려면 한 번 더 누른다.
    setSelectedIds((prev) => {
      const everySelected =
        selectableIds.size > 0 && Array.from(selectableIds).every((id) => prev.has(id));
      if (everySelected) {
        const next = new Set(prev);
        for (const id of selectableIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...selectableIds]);
    });
  }, [selectableIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    onChange: setSelectedIds,
    selectedCount: selectedIds.size,
    allState,
    toggleAll,
    clear,
  };
}
