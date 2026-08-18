import { describe, expect, it } from 'vitest';
import { clampColumnWidth, resolveColumnLayout } from './columnLayout';
import type { ColumnDef } from './columns';

type Row = { a: string; b: string; c: string };

const DEFAULT_WIDTH = 120;
const MIN_WIDTH = 56;

function layout(
  columns: readonly ColumnDef<Row>[],
  options: {
    widths?: Record<string, number>;
    leadingWidth?: number;
    containerWidth?: number;
  } = {},
) {
  return resolveColumnLayout({
    columns,
    widths: options.widths ?? {},
    defaultWidth: DEFAULT_WIDTH,
    minWidth: MIN_WIDTH,
    leadingWidth: options.leadingWidth ?? 0,
    containerWidth: options.containerWidth ?? 0,
  });
}

describe('clampColumnWidth', () => {
  it('컬럼의 minWidth 가 없으면 토큰 하한을 쓴다', () => {
    expect(clampColumnWidth<Row>({ id: 'a' }, 10, MIN_WIDTH)).toBe(MIN_WIDTH);
  });

  it('컬럼의 minWidth·maxWidth 가 토큰 하한보다 우선한다', () => {
    const column: ColumnDef<Row> = { id: 'a', minWidth: 80, maxWidth: 200 };
    expect(clampColumnWidth(column, 10, MIN_WIDTH)).toBe(80);
    expect(clampColumnWidth(column, 999, MIN_WIDTH)).toBe(200);
  });

  it('min 이 max 보다 크면 min 이 이긴다 — 컬럼이 사라지는 것보다 낫다', () => {
    expect(clampColumnWidth<Row>({ id: 'a', minWidth: 150, maxWidth: 80 }, 999, MIN_WIDTH)).toBe(
      150,
    );
  });
});

describe('resolveColumnLayout — 기본폭', () => {
  it('사용자 조정폭 > 컬럼 정의 width > 기본폭 순으로 이긴다', () => {
    const result = layout([{ id: 'a', width: 200 }, { id: 'b' }, { id: 'c', width: 80 }], {
      widths: { c: 300 },
    });
    expect(result.widths).toEqual([200, DEFAULT_WIDTH, 300]);
  });

  it('오프셋은 선행 영역(선택열) 폭부터 누적되고 총폭이 그 합이다', () => {
    const result = layout(
      [
        { id: 'a', width: 100 },
        { id: 'b', width: 60 },
      ],
      { leadingWidth: 40 },
    );
    expect(result.offsets).toEqual([40, 140]);
    expect(result.totalWidth).toBe(200);
  });
});

describe('resolveColumnLayout — grow 분배', () => {
  const columns: readonly ColumnDef<Row>[] = [
    { id: 'a', width: 100 },
    { id: 'b', width: 100, grow: 1 },
    { id: 'c', width: 100, grow: 3 },
  ];

  it('남는 폭을 가중치대로 나누고 총폭이 컨테이너 폭과 정확히 맞는다', () => {
    const result = layout(columns, { containerWidth: 700 });
    // 남는 폭 400 을 1:3 으로 → b +100, c +300
    expect(result.widths).toEqual([100, 200, 400]);
    expect(result.totalWidth).toBe(700);
  });

  it('반올림 잔여는 마지막 대상이 흡수한다 — 1px 어긋나면 스크롤바가 깜빡인다', () => {
    const result = layout(
      [
        { id: 'a', width: 100, grow: 1 },
        { id: 'b', width: 100, grow: 1 },
        { id: 'c', width: 100, grow: 1 },
      ],
      { containerWidth: 601 },
    );
    expect(result.totalWidth).toBe(601);
  });

  it('사용자가 조정한 컬럼은 분배에서 빠진다 — 드래그한 폭이 튕겨 돌아오면 안 된다', () => {
    const result = layout(columns, { containerWidth: 700, widths: { c: 150 } });
    // c 는 사용자 조정값 150 그대로, 남는 폭 700-(100+100+150)=350 을 전부 b 가 먹는다
    expect(result.widths).toEqual([100, 450, 150]);
    expect(result.totalWidth).toBe(700);
  });

  it('컨테이너가 좁거나 아직 측정 전(0)이면 분배하지 않는다', () => {
    expect(layout(columns, { containerWidth: 0 }).widths).toEqual([100, 100, 100]);
    expect(layout(columns, { containerWidth: 200 }).widths).toEqual([100, 100, 100]);
  });

  it('grow 컬럼이 없으면 남는 폭은 그대로 여백으로 둔다', () => {
    const result = layout([{ id: 'a', width: 100 }], { containerWidth: 800 });
    expect(result.totalWidth).toBe(100);
  });

  it('선행 영역 폭도 남는 폭 계산에 포함된다', () => {
    const result = layout([{ id: 'a', width: 100, grow: 1 }], {
      leadingWidth: 40,
      containerWidth: 300,
    });
    expect(result.widths).toEqual([260]);
    expect(result.totalWidth).toBe(300);
  });
});
