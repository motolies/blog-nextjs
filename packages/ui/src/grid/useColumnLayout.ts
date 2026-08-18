'use client';

import { type RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useElementWidth } from '../lib/useElementWidth';
import { useTokenPx } from '../lib/useTokenPx';
import { type ColumnLayout, clampColumnWidth, resolveColumnLayout } from './columnLayout';
import type { ColumnDef } from './columns';

export type ColumnWidths = Readonly<Record<string, number>>;

/**
 * 컬럼 폭 상태 + 레이아웃 계산.
 *
 * **controlled / uncontrolled 를 둘 다 지원한다.** `widths` 를 주면 그 값이 진실이고,
 * 안 주면 내부 state 를 쓴다 — 어느 쪽이든 `onWidthsChange` 는 호출한다.
 * `<input>` 의 `value`/`onChange` 와 같은 계약이며, 이 구조라서 `ui` 패키지가
 * localStorage 나 URL 을 몰라도 앱이 폭을 영속화할 수 있다.
 */
export function useColumnLayout<T extends Record<string, unknown>>({
  columns,
  scrollRef,
  leadingWidth,
  defaultColumnWidth,
  widths: controlledWidths,
  onWidthsChange,
}: {
  readonly columns: readonly ColumnDef<T>[];
  /** 가로 스크롤 컨테이너. 남는 폭(`grow`) 계산의 기준이다. */
  readonly scrollRef: RefObject<HTMLElement | null>;
  readonly leadingWidth: number;
  /** 컬럼 정의에 `width` 가 없을 때의 폭. 없으면 `--spacing-dl-grid-col`. */
  readonly defaultColumnWidth?: number;
  readonly widths?: ColumnWidths;
  readonly onWidthsChange?: (next: ColumnWidths) => void;
}): ColumnLayout & {
  /** 컬럼 하나의 폭을 정한다(min/max 는 여기서 가둔다). */
  readonly setWidth: (columnId: string, next: number) => void;
  /** 사용자 조정을 지워 기본 폭으로 되돌린다 — 핸들 더블클릭. */
  readonly resetWidth: (columnId: string) => void;
  readonly minColumnWidth: number;
} {
  const tokenWidth = useTokenPx('--spacing-dl-grid-col', 120);
  const minColumnWidth = useTokenPx('--spacing-dl-grid-col-min', 56);
  const defaultWidth = defaultColumnWidth ?? tokenWidth;

  const [internalWidths, setInternalWidths] = useState<ColumnWidths>({});
  const widths = controlledWidths ?? internalWidths;

  /**
   * 드래그 중에는 `pointermove` → `setWidth` 가 프레임마다 돈다.
   * `widths` 를 클로저로 잡으면 한 프레임 늦은 값을 보고 폭이 튄다 — 항상 최신을 ref 로 읽는다.
   */
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  const containerWidth = useElementWidth(scrollRef);

  const layout = useMemo(
    () =>
      resolveColumnLayout({
        columns,
        widths,
        defaultWidth,
        minWidth: minColumnWidth,
        leadingWidth,
        containerWidth,
      }),
    [columns, widths, defaultWidth, minColumnWidth, leadingWidth, containerWidth],
  );

  const commit = useCallback(
    (next: ColumnWidths) => {
      if (controlledWidths === undefined) setInternalWidths(next);
      onWidthsChange?.(next);
    },
    [controlledWidths, onWidthsChange],
  );

  const setWidth = useCallback(
    (columnId: string, next: number) => {
      const column = columns.find((candidate) => candidate.id === columnId);
      if (!column) return;
      commit({
        ...widthsRef.current,
        [columnId]: clampColumnWidth(column, next, minColumnWidth),
      });
    },
    [columns, commit, minColumnWidth],
  );

  const resetWidth = useCallback(
    (columnId: string) => {
      if (widthsRef.current[columnId] === undefined) return;
      // 키를 지운다 — 0 이나 기본폭을 넣으면 "사용자가 조정한 컬럼"으로 남아 grow 대상에서 빠진다.
      const { [columnId]: _removed, ...rest } = widthsRef.current;
      commit(rest);
    },
    [commit],
  );

  return { ...layout, setWidth, resetWidth, minColumnWidth };
}
