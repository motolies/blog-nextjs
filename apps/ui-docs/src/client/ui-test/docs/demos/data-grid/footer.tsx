'use client';

import { DataGrid, defineColumns } from '@hvy/ui';

type Row = {
  readonly id: string;
  readonly orderId: string;
  readonly qty: number;
  readonly amount: number;
};

const ROWS: readonly Row[] = [
  { id: '1', orderId: 'ORD-2026-0001', qty: 3, amount: 45000 },
  { id: '2', orderId: 'ORD-2026-0002', qty: 1, amount: 12000 },
  { id: '3', orderId: 'ORD-2026-0003', qty: 7, amount: 98000 },
  { id: '4', orderId: 'ORD-2026-0004', qty: 2, amount: 30000 },
];

const HEADER: Record<string, string> = { orderid: '주문번호', qty: '수량', amount: '금액' };

const money = new Intl.NumberFormat('ko-KR');

const COLUMNS = defineColumns<Row>([
  { id: 'orderId', headerWord: 'orderid', width: 180, pinned: true },
  {
    id: 'qty',
    headerWord: 'qty',
    width: 320,
    align: 'right',
    format: (v) => money.format(v as number),
  },
  {
    id: 'amount',
    headerWord: 'amount',
    width: 320,
    align: 'right',
    format: (v) => money.format(v as number),
  },
]);

/**
 * 합계행 — 값은 호출부가 계산해 넘긴다. 서버 페이징이라 전체 합계는 서버만 안다 —
 * 그리드가 보이는 행을 합산하면 "페이지 합계"를 전체로 오독하는 사고가 된다
 * (이 데모는 페이징이 없어 직접 합산했다).
 */
export function DataGridFooterDemo() {
  const totalQty = ROWS.reduce((sum, row) => sum + row.qty, 0);
  const totalAmount = ROWS.reduce((sum, row) => sum + row.amount, 0);
  return (
    <DataGrid
      columns={COLUMNS}
      rows={ROWS}
      getRowId={(row) => row.id}
      translateHeader={(code) => HEADER[code] ?? code}
      maxHeight={260}
      footer={{
        cells: {
          orderId: '합계',
          qty: money.format(totalQty),
          amount: money.format(totalAmount),
        },
      }}
    />
  );
}
