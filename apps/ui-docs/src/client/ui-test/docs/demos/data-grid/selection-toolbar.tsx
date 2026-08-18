'use client';

import { Button, DataGrid, defineColumns, GridToolbar, showToast, useGridSelection } from '@hvy/ui';

type Row = { readonly id: string; readonly orderId: string; readonly status: string };

const ROWS: readonly Row[] = [
  { id: '1', orderId: 'ORD-2026-0001', status: '접수' },
  { id: '2', orderId: 'ORD-2026-0002', status: '출고대기' },
  { id: '3', orderId: 'ORD-2026-0003', status: '출고완료' },
  { id: '4', orderId: 'ORD-2026-0004', status: '접수' },
];

const HEADER: Record<string, string> = { orderid: '주문번호', status: '상태' };

const COLUMNS = defineColumns<Row>([
  { id: 'orderId', headerWord: 'orderid', width: 180 },
  { id: 'status', headerWord: 'status', width: 140 },
]);

/**
 * 선택 컨텍스트 툴바 — 선택이 생기면 "N건 선택" 요약(+해제 ×)이 뜨고
 * actions 자리가 selection.actions 로 교대한다. 화면마다
 * `disabled={count === 0}` 삼항식을 반복하던 배선이 이 prop 하나로 끝난다.
 */
export function DataGridSelectionToolbarDemo() {
  const selection = useGridSelection({
    rows: ROWS,
    getRowId: (row) => row.id,
    resetKey: 'demo',
  });

  return (
    <div>
      <DataGrid
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(row) => row.id}
        translateHeader={(code) => HEADER[code] ?? code}
        attachedToolbar
        maxHeight={260}
        selection={{
          selectedIds: selection.selectedIds,
          onChange: selection.onChange,
          allState: selection.allState,
          toggleAll: selection.toggleAll,
          selectAllLabel: '전체 선택',
          selectRowLabel: '행 선택',
        }}
      />
      <GridToolbar
        actions={
          <Button size="sm" onClick={() => showToast('신규 등록 (데모)', 'info')}>
            신규 등록
          </Button>
        }
        selection={{
          count: selection.selectedCount,
          summary: (count) => `${count}건 선택`,
          clear: { label: '선택 해제', onClick: selection.clear },
          actions: (
            <>
              <Button
                size="sm"
                variant="outline-red"
                onClick={() => showToast(`${selection.selectedCount}건 삭제 (데모)`, 'success')}
              >
                선택 삭제
              </Button>
              <Button
                size="sm"
                variant="outline-strong"
                onClick={() =>
                  showToast(`${selection.selectedCount}건 출고 지시 (데모)`, 'success')
                }
              >
                출고 지시
              </Button>
            </>
          ),
        }}
      />
    </div>
  );
}
