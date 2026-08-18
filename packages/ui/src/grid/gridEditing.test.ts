import { describe, expect, it } from 'vitest';
import type { ColumnDef } from './columns';
import {
  type AddedRow,
  applyCellDraft,
  cellKey,
  collectInvalidCells,
  type DraftMap,
  deriveDirtyCells,
  deriveModifiedData,
  findNextEditableCell,
  mergeEditingRows,
  NEW_ROW_ID_FIELD,
  parseCellKey,
  toSaveRequestData,
} from './gridEditing';

type Row = Record<string, unknown> & {
  id: string;
  name: string;
  qty: number;
  status: string;
  useYn: string;
};

const getRowId = (row: Row) => (row[NEW_ROW_ID_FIELD] as string) ?? row.id;

const row = (id: string, patch?: Partial<Row>): Row => ({
  id,
  name: `이름${id}`,
  qty: 1,
  status: 'OPEN',
  useYn: 'Y',
  ...patch,
});

const DATA: readonly Row[] = [row('r1'), row('r2'), row('r3')];
const SNAPSHOT = new Map(DATA.map((r) => [r.id, r]));

const COLUMNS: readonly ColumnDef<Row>[] = [
  { id: 'id', primary: true },
  { id: 'name', editor: { type: 'text' } },
  { id: 'qty', editor: { type: 'number' } },
  { id: 'status', editor: { type: 'select', options: [], placeholder: '선택' }, editable: false },
  { id: 'useYn', editor: { type: 'checkbox', checkedValue: 'Y', uncheckedValue: 'N' } },
];

const EMPTY_DRAFTS: DraftMap<Row> = new Map();

describe('applyCellDraft', () => {
  it('스냅샷과 다른 값은 draft 로 남는다', () => {
    const drafts = applyCellDraft({
      drafts: EMPTY_DRAFTS,
      snapshot: SNAPSHOT,
      rowId: 'r1',
      columnId: 'name',
      value: '고침',
    });
    expect(drafts.get('r1')).toEqual({ name: '고침' });
  });

  it('값이 원복되면 필드가 지워지고, 행 draft 가 비면 엔트리째 사라진다 — U 자동 해제', () => {
    let drafts = applyCellDraft({
      drafts: EMPTY_DRAFTS,
      snapshot: SNAPSHOT,
      rowId: 'r1',
      columnId: 'name',
      value: '고침',
    });
    drafts = applyCellDraft({
      drafts,
      snapshot: SNAPSHOT,
      rowId: 'r1',
      columnId: 'name',
      value: '이름r1',
    });
    expect(drafts.has('r1')).toBe(false);
  });

  it('필드끼리 독립이다 — 한 필드의 원복이 다른 필드를 지우지 않는다', () => {
    let drafts = applyCellDraft({
      drafts: EMPTY_DRAFTS,
      snapshot: SNAPSHOT,
      rowId: 'r1',
      columnId: 'name',
      value: '고침',
    });
    drafts = applyCellDraft({ drafts, snapshot: SNAPSHOT, rowId: 'r1', columnId: 'qty', value: 9 });
    drafts = applyCellDraft({
      drafts,
      snapshot: SNAPSHOT,
      rowId: 'r1',
      columnId: 'name',
      value: '이름r1',
    });
    expect(drafts.get('r1')).toEqual({ qty: 9 });
  });
});

describe('mergeEditingRows', () => {
  it('draft 를 표시 행에 오버레이한다', () => {
    const drafts: DraftMap<Row> = new Map([['r2', { qty: 7 }]]);
    const rows = mergeEditingRows({ data: DATA, getRowId, drafts, added: [] });
    expect(rows[1]?.qty).toBe(7);
    // 원본 배열은 건드리지 않는다
    expect(DATA[1]?.qty).toBe(1);
  });

  it("at: 'start' 는 나중에 추가한 행이 위, at: 'end' 는 추가한 순서대로 아래", () => {
    const added: readonly AddedRow<Row>[] = [
      { at: 'start', row: row('n1', { [NEW_ROW_ID_FIELD]: 'nx-new-1' }) },
      { at: 'start', row: row('n2', { [NEW_ROW_ID_FIELD]: 'nx-new-2' }) },
      { at: 'end', row: row('n3', { [NEW_ROW_ID_FIELD]: 'nx-new-3' }) },
    ];
    const rows = mergeEditingRows({ data: DATA, getRowId, drafts: EMPTY_DRAFTS, added });
    expect(rows.map(getRowId)).toEqual(['nx-new-2', 'nx-new-1', 'r1', 'r2', 'r3', 'nx-new-3']);
  });
});

describe('deriveDirtyCells / cellKey', () => {
  it('draft 필드마다 "rowId:columnId" 키가 나온다', () => {
    const drafts: DraftMap<Row> = new Map([
      ['r1', { name: '고침', qty: 9 }],
      ['r2', { status: 'DONE' }],
    ]);
    expect(deriveDirtyCells(drafts)).toEqual(new Set(['r1:name', 'r1:qty', 'r2:status']));
  });

  it('parseCellKey 는 rowId 에 구분자가 있어도 마지막 `:` 로 가른다', () => {
    expect(parseCellKey(cellKey('a:b:c', 'name'))).toEqual({ rowId: 'a:b:c', columnId: 'name' });
  });
});

describe('deriveModifiedData / toSaveRequestData', () => {
  it('U 는 스냅샷⊕draft 병합본, A 는 임시 id 를 뗀 추가 행이다', () => {
    const drafts: DraftMap<Row> = new Map([['r2', { qty: 7 }]]);
    const added: readonly AddedRow<Row>[] = [
      { at: 'end', row: row('', { [NEW_ROW_ID_FIELD]: 'nx-new-1', name: '신규' }) },
    ];
    const modified = deriveModifiedData({ data: DATA, getRowId, drafts, added });

    expect(modified.isModified).toBe(true);
    expect(modified.U).toEqual([{ ...row('r2'), qty: 7 }]);
    expect(modified.A).toEqual([row('', { name: '신규' })]);
    expect(NEW_ROW_ID_FIELD in (modified.A[0] as Row)).toBe(false);

    expect(toSaveRequestData(modified)).toEqual({ addList: modified.A, updateList: modified.U });
  });

  it('변경이 없으면 isModified 가 false 다', () => {
    const modified = deriveModifiedData({ data: DATA, getRowId, drafts: EMPTY_DRAFTS, added: [] });
    expect(modified).toEqual({ isModified: false, A: [], U: [] });
  });
});

describe('findNextEditableCell', () => {
  const args = { columns: COLUMNS, rows: DATA, getRowId };

  it('next 는 editor 없는 컬럼·잠긴 컬럼·checkbox 를 건너뛴다', () => {
    // name 다음: qty (status 는 editable:false, useYn 은 checkbox, id 는 editor 없음)
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r1', columnId: 'name' }, move: 'next' }),
    ).toEqual({ rowId: 'r1', columnId: 'qty' });
  });

  it('행 끝에서 다음 행 첫 편집 컬럼으로 wrap 한다', () => {
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r1', columnId: 'qty' }, move: 'next' }),
    ).toEqual({ rowId: 'r2', columnId: 'name' });
  });

  it('prev 는 역방향으로 같은 규칙을 탄다', () => {
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r2', columnId: 'name' }, move: 'prev' }),
    ).toEqual({ rowId: 'r1', columnId: 'qty' });
  });

  it('그리드 끝에서는 null — 편집 종료 신호다', () => {
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r3', columnId: 'qty' }, move: 'next' }),
    ).toBeNull();
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r1', columnId: 'name' }, move: 'prev' }),
    ).toBeNull();
  });

  it('down 은 같은 컬럼 아래 행, 마지막 행이면 null', () => {
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r1', columnId: 'name' }, move: 'down' }),
    ).toEqual({ rowId: 'r2', columnId: 'name' });
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'r3', columnId: 'name' }, move: 'down' }),
    ).toBeNull();
  });

  it('사라진 행에서 시작하면 null — 스크롤·재조회로 행이 없어진 경우다', () => {
    expect(
      findNextEditableCell({ ...args, from: { rowId: 'zzz', columnId: 'name' }, move: 'next' }),
    ).toBeNull();
  });
});

describe('collectInvalidCells', () => {
  const required = (value: unknown) => (value === '' || value == null ? '필수 입력입니다' : null);
  const columns: readonly ColumnDef<Row>[] = [
    { id: 'id' },
    { id: 'name', editor: { type: 'text' }, validate: required },
    {
      id: 'qty',
      editor: { type: 'number' },
      validate: (v) => (Number(v) > 0 ? null : '0보다 커야 합니다'),
    },
    // 잠긴 컬럼 — A 행이라도 검증하지 않는다(사용자가 고칠 수단이 없다)
    { id: 'status', editor: { type: 'text' }, editable: false, validate: () => '항상 실패' },
  ];

  it('A 행은 편집 가능한 모든 editor 컬럼을 검사한다', () => {
    const added: readonly AddedRow<Row>[] = [
      { at: 'start', row: row('', { [NEW_ROW_ID_FIELD]: 'nx-new-1', name: '', qty: 0 }) },
    ];
    const invalid = collectInvalidCells({
      columns,
      data: DATA,
      getRowId,
      drafts: EMPTY_DRAFTS,
      added,
    });
    expect(invalid).toEqual(
      new Map([
        ['nx-new-1:name', '필수 입력입니다'],
        ['nx-new-1:qty', '0보다 커야 합니다'],
      ]),
    );
  });

  it('U 행은 draft 필드만 검사한다 — 안 건드린 필드의 기존 오류로 저장이 막히지 않는다', () => {
    // r1 의 qty 원본이 이미 불량(0)이어도, name 만 고쳤으면 name 만 검사한다
    const data = [row('r1', { qty: 0 })];
    const drafts: DraftMap<Row> = new Map([['r1', { name: '' }]]);
    const invalid = collectInvalidCells({ columns, data, getRowId, drafts, added: [] });
    expect(invalid).toEqual(new Map([['r1:name', '필수 입력입니다']]));
  });

  it('전부 통과하면 빈 Map 이다', () => {
    const drafts: DraftMap<Row> = new Map([['r1', { name: '유효한 값' }]]);
    const invalid = collectInvalidCells({ columns, data: DATA, getRowId, drafts, added: [] });
    expect(invalid.size).toBe(0);
  });
});
