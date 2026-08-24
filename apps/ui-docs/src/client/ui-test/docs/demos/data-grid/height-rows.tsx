'use client';

import { CONTROL_SIZES, type ControlSize, DataGrid, defineColumns } from '@hvy/ui';
import { useState } from 'react';
import { DEMO_ORDERS, type DemoOrder } from '../../../mock-orders';
import { BoolControl, EnumControl } from '../../../playground';

/**
 * 높이 ② `maxHeight={{ rows: N }}` — 헤더 + N행(+합계행)으로 고정한다.
 *
 * "한 화면에 그리드가 둘"인 시나리오 그대로 같은 데이터를 좌우에 둔다. px 가 아니라 **행 단위**라
 * density·테마(토큰 실측)를 따라간다. 합계행은 스크롤 영역 안의 sticky 라 보이는 행에서 한 줄을
 * 먹으므로, 오른쪽에 합계행을 켜면 그리드가 정확히 한 줄만큼 높아지고 데이터 행은 그대로 N행이다.
 *
 * 확인: 어느 조합에서도 정확히 N행이 보이고 N+1행 윗선이 비치지 않는다 / 합계행을 켜도 N행 유지 /
 * 상단 테마를 compact 로 바꿔도 N행(행 높이를 토큰에서 실측하기 때문).
 */

const ROW_OPTIONS = ['3', '5', '8'] as const;
type RowOption = (typeof ROW_OPTIONS)[number];

const numberFormat = new Intl.NumberFormat('ko-KR');

const COLUMNS = defineColumns<DemoOrder>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, resizable: false, pinned: true },
  { id: 'orderId', headerWord: '주문번호', width: 130, pinned: true },
  {
    id: 'amount',
    headerWord: '금액',
    width: 100,
    align: 'right',
    format: (value) => numberFormat.format(Number(value)),
  },
  { id: 'orderDate', headerWord: '주문일', width: 110, grow: 1 },
]);

/** 합계는 호출부가 계산한다(footer 데모와 같은 계약) — 페이징이 없어 전 행을 직접 합산했다. */
const TOTAL_AMOUNT = DEMO_ORDERS.reduce((sum, row) => sum + row.amount, 0);

export function DataGridHeightRowsDemo() {
  const [rowOption, setRowOption] = useState<RowOption>('5');
  const [density, setDensity] = useState<ControlSize>('md');
  const [withFooter, setWithFooter] = useState(false);

  const rows = Number(rowOption);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid max-w-xl grid-cols-1 gap-2 md:grid-cols-2">
        <EnumControl
          label="행 수"
          value={rowOption}
          options={ROW_OPTIONS}
          onChange={setRowOption}
        />
        <EnumControl
          label="density"
          value={density}
          options={CONTROL_SIZES}
          onChange={setDensity}
        />
        <BoolControl label="합계행" checked={withFooter} onChange={setWithFooter} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-dl-xs text-dl-fg-muted">
            {`maxHeight={{ rows: ${rows} }}`} — 헤더 + {rows}행
          </span>
          <DataGrid
            columns={COLUMNS}
            rows={DEMO_ORDERS}
            getRowId={(row) => row.orderId}
            translateHeader={(code) => code}
            density={density}
            maxHeight={{ rows }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-dl-xs text-dl-fg-muted">
            {`maxHeight={{ rows: ${rows} }}`}
            {withFooter ? ` + 합계행 — 헤더 + ${rows}행 + 합계행` : ' — 합계행 꺼짐(왼쪽과 동일)'}
          </span>
          <DataGrid
            columns={COLUMNS}
            rows={DEMO_ORDERS}
            getRowId={(row) => row.orderId}
            translateHeader={(code) => code}
            density={density}
            maxHeight={{ rows }}
            footer={
              withFooter
                ? { cells: { orderId: '합계', amount: numberFormat.format(TOTAL_AMOUNT) } }
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
