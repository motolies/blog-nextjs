import type { ColumnDef } from './columns';

/**
 * 컬럼 폭 계산 — **순수 함수만 둔다.**
 *
 * 이 파일이 `'use client'` 도 React 도 모르는 이유는 두 가지다.
 * 1. 고정열의 `left` 오프셋이 앞 컬럼 폭의 누적합이라, 폭이 런타임에 바뀌면
 *    셀 폭 · 오프셋 · 총폭이 **반드시 같은 계산 결과**를 봐야 한다. 계산을 한 곳에 모은다.
 * 2. 이 레포의 vitest 환경은 `node` 다(`vitest.config.ts`). DOM 이 없어서
 *    **여기 있는 것만 단위 테스트가 가능**하다. 폭 계산은 틀리면 조용히 표가 어긋나는 종류라
 *    테스트가 붙어 있어야 한다.
 */

export type ColumnLayout = {
  /** 컬럼 인덱스별 최종 폭(px). */
  readonly widths: readonly number[];
  /** 고정열이 쓰는 `left` 오프셋. 선행 영역(선택열) 폭부터 누적된다. */
  readonly offsets: readonly number[];
  /** 선행 영역을 포함한 표 전체 폭. */
  readonly totalWidth: number;
};

/** 폭의 절대 하한. 이보다 좁으면 컬럼이 선(線)이 되어 다시 넓힐 수도 없다. */
const ABSOLUTE_MIN_WIDTH = 24;

/** 컬럼별 min/max 안으로 폭을 가둔다. min 이 max 보다 크면 min 이 이긴다(사라지는 것보단 낫다). */
export function clampColumnWidth<T>(
  column: ColumnDef<T>,
  value: number,
  minFallback: number,
): number {
  const min = Math.max(column.minWidth ?? minFallback, ABSOLUTE_MIN_WIDTH);
  const max = Math.max(column.maxWidth ?? Number.POSITIVE_INFINITY, min);
  return Math.round(Math.min(Math.max(value, min), max));
}

/**
 * 컬럼 폭·오프셋·총폭을 한 번에 계산한다.
 *
 * 순서: **기본폭 → grow 분배 → 누적 오프셋**.
 */
export function resolveColumnLayout<T>({
  columns,
  widths,
  defaultWidth,
  minWidth,
  leadingWidth = 0,
  containerWidth = 0,
}: {
  readonly columns: readonly ColumnDef<T>[];
  /** 사용자가 조정한 폭(컬럼 id → px). 여기 있는 컬럼은 grow 대상에서 빠진다. */
  readonly widths: Readonly<Record<string, number>>;
  /** 컬럼 정의에 `width` 가 없을 때 쓰는 폭(`--spacing-dl-grid-col`). */
  readonly defaultWidth: number;
  /** 컬럼 정의에 `minWidth` 가 없을 때 쓰는 하한(`--spacing-dl-grid-col-min`). */
  readonly minWidth: number;
  /** 컬럼 앞에 놓이는 고정 영역(선택 체크박스 열)의 폭. */
  readonly leadingWidth?: number;
  /** 스크롤 컨테이너의 가시 폭. 0 이면 grow 를 계산하지 않는다(측정 전). */
  readonly containerWidth?: number;
}): ColumnLayout {
  const base = columns.map((column) =>
    clampColumnWidth(column, widths[column.id] ?? column.width ?? defaultWidth, minWidth),
  );

  const resolved = distributeGrow({
    columns,
    base,
    widths,
    minWidth,
    leadingWidth,
    containerWidth,
  });

  const offsets: number[] = [];
  let cursor = leadingWidth;
  for (const width of resolved) {
    offsets.push(cursor);
    cursor += width;
  }

  return { widths: resolved, offsets, totalWidth: cursor };
}

/**
 * 남는 가로 공간을 `grow` 가중치로 나눠 더한다(현행 `autoFillWidth` + `gravity` 대응).
 *
 * **사용자가 조정한 컬럼(`widths[id]` 존재)은 대상에서 뺀다.** 이게 리사이즈와 grow 가
 * 충돌하는 유일한 지점이다 — 빼지 않으면 드래그로 줄인 폭을 다음 렌더가 도로 늘려서,
 * 사용자 눈에는 "핸들을 놓는 순간 폭이 튕겨 돌아오는" 버그로 보인다.
 *
 * 반올림 잔여 px 는 마지막 대상이 흡수한다. 총합이 컨테이너 폭과 1px 이라도 어긋나면
 * 가로 스크롤바가 생겼다 사라졌다 하며 깜빡인다.
 */
function distributeGrow<T>({
  columns,
  base,
  widths,
  minWidth,
  leadingWidth,
  containerWidth,
}: {
  readonly columns: readonly ColumnDef<T>[];
  readonly base: readonly number[];
  readonly widths: Readonly<Record<string, number>>;
  readonly minWidth: number;
  readonly leadingWidth: number;
  readonly containerWidth: number;
}): readonly number[] {
  if (containerWidth <= 0) return base;

  const targets: number[] = [];
  let totalWeight = 0;
  columns.forEach((column, index) => {
    const weight = column.grow ?? 0;
    if (weight <= 0 || widths[column.id] !== undefined) return;
    targets.push(index);
    totalWeight += weight;
  });
  if (targets.length === 0 || totalWeight <= 0) return base;

  const used = base.reduce((sum, width) => sum + width, leadingWidth);
  const extra = containerWidth - used;
  if (extra <= 0) return base;

  const next = [...base];
  let given = 0;

  targets.forEach((index, order) => {
    const column = columns[index];
    if (!column) return;

    const isLast = order === targets.length - 1;
    // 마지막 대상이 반올림 잔여를 흡수한다 — 총합이 정확히 컨테이너 폭이 된다.
    const share = isLast ? extra - given : Math.floor((extra * (column.grow ?? 0)) / totalWeight);

    // ⚠️ `maxWidth` 가 걸리면 그만큼은 채워지지 않고 오른쪽에 여백으로 남는다.
    //    grow 컬럼에 `maxWidth` 를 주지 않는 것이 규칙이다(`ColumnDef.maxWidth` 주석).
    next[index] = clampColumnWidth(column, (base[index] ?? 0) + share, minWidth);
    given += share;
  });

  return next;
}
