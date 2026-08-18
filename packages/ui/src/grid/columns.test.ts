import { describe, expect, it } from 'vitest';
import { applyColumnPreference, type ColumnDef, orderColumns } from './columns';

type Row = { a: string; b: string; c: string; d: string };

const COLUMNS: readonly ColumnDef<Row>[] = [
  { id: 'a', pinned: true, hideable: false },
  { id: 'b', pinned: true },
  { id: 'c' },
  { id: 'd' },
];

const ids = (columns: readonly ColumnDef<Row>[]) => columns.map((column) => column.id);

describe('orderColumns', () => {
  it('저장된 순서에 없는 컬럼을 잃지 않는다 — 배포로 컬럼이 늘어도 안 사라진다', () => {
    expect(ids(orderColumns(COLUMNS, ['c', 'a']))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('사라진 컬럼 id 는 흘린다 — 정상적인 스키마 변경이다', () => {
    expect(ids(orderColumns(COLUMNS, ['zzz', 'b']))).toEqual(['b', 'a', 'c', 'd']);
  });

  it('빈 순서는 원본을 그대로 둔다', () => {
    expect(ids(orderColumns(COLUMNS, []))).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('applyColumnPreference', () => {
  it('설정이 없으면 컬럼 정의의 초기 hidden 만 적용한다', () => {
    const columns: readonly ColumnDef<Row>[] = [{ id: 'a' }, { id: 'b', hidden: true }];
    expect(ids(applyColumnPreference(columns, null))).toEqual(['a']);
  });

  it('사용자가 숨긴 컬럼을 뺀다', () => {
    const result = applyColumnPreference(COLUMNS, { hidden: ['c'], order: ['a', 'b', 'c', 'd'] });
    expect(ids(result)).toEqual(['a', 'b', 'd']);
  });

  it('hideable: false 는 저장값보다 우선한다 — 저장소는 사용자가 손댈 수 있는 곳이다', () => {
    const result = applyColumnPreference(COLUMNS, { hidden: ['a'], order: ['a', 'b', 'c', 'd'] });
    expect(ids(result)).toContain('a');
  });

  it('저장 이후 추가된 컬럼은 컬럼 정의의 hidden 을 따른다', () => {
    // order 에 'd' 가 없다 = 설정을 저장한 뒤에 추가된 컬럼이다.
    const columns: readonly ColumnDef<Row>[] = [{ id: 'c' }, { id: 'd', hidden: true }];
    const result = applyColumnPreference(columns, { hidden: [], order: ['c'] });
    expect(ids(result)).toEqual(['c']);
  });

  it('저장된 순서가 고정열을 흩뜨리면 선두로 되돌린다', () => {
    // 사용자가 'c'(일반열)를 'b'(고정열) 앞으로 보낸 상태
    const result = applyColumnPreference(COLUMNS, { hidden: [], order: ['a', 'c', 'b', 'd'] });
    expect(ids(result)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('고정열 사이의 순서 변경은 그대로 둔다', () => {
    const result = applyColumnPreference(COLUMNS, { hidden: [], order: ['b', 'a', 'd', 'c'] });
    expect(ids(result)).toEqual(['b', 'a', 'd', 'c']);
  });
});
