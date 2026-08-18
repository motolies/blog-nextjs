'use client';

import {
  CONTROL_SIZES,
  type ControlSize,
  DataGrid,
  defineColumns,
  GRID_ROW_TOKEN,
  useGridEditing,
  useTokenPx,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_ORDERS, type DemoOrder } from '../../../mock-orders';
import { BoolControl } from '../../../playground';

/**
 * 그리드 밀도 5단 — 같은 그리드를 density 만 바꿔 세로로 쌓는다.
 *
 * 확인할 것 둘:
 *  1. 행 높이만 바뀌는 게 아니다 — 헤더·선택열 폭·셀 좌우 패딩·셀 에디터 컨트롤이
 *     **함께** 한 단계 움직인다. "편집 켜기" 를 눌러 셀을 더블클릭하면 에디터도
 *     같은 단계로 줄어드는 것이 보인다(행 − 컨트롤 = 어느 단계에서도 8px).
 *  2. 상단 테마 선택을 compact 로 바꾸면 **5단 전체가 한 번 더 축소된다** —
 *     density(그리드별)와 테마 스케일(전역)은 곱해지는 두 축이다.
 */

const COLUMNS = defineColumns<DemoOrder>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, resizable: false, pinned: true },
  { id: 'orderId', headerWord: '주문번호', width: 140, pinned: true },
  { id: 'receiver', headerWord: '수신자', width: 110, editor: { type: 'text', maxLength: 20 } },
  { id: 'orderDate', headerWord: '주문일', width: 120, editor: { type: 'date' }, grow: 1 },
]);

const ROWS = DEMO_ORDERS.slice(0, 3);

/**
 * 한 단계짜리 미니 그리드. **컴포넌트로 분리한 이유는 훅이다** —
 * `useTokenPx` 를 map 콜백 안에서 부를 수 없다(호출 순서가 조건부가 된다).
 */
function DensityRow({
  density,
  editable,
}: {
  readonly density: ControlSize;
  readonly editable: boolean;
}) {
  // 토큰을 다시 읽어 화면에 숫자로 적는다 — 그리드가 실제로 쓰는 값과 같은 경로다.
  const rowHeight = useTokenPx(GRID_ROW_TOKEN[density], 50);
  const editing = useGridEditing({ data: ROWS, getRowId: (row) => row.orderId, columns: COLUMNS });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="w-6 shrink-0 font-dl-mono text-dl-sm text-dl-fg-strong">{density}</span>
        <span className="text-dl-xs text-dl-fg-muted">행 {rowHeight}px</span>
      </div>
      <DataGrid
        density={density}
        columns={COLUMNS}
        rows={editable ? editing.rows : ROWS}
        getRowId={(row) => row.orderId}
        maxHeight={400}
        editing={editable ? editing.binding : undefined}
        selection={{
          selectedIds: new Set<string>(),
          onChange: () => undefined,
          allState: 'none',
          toggleAll: () => undefined,
          selectAllLabel: '전체 선택',
          selectRowLabel: '행 선택',
        }}
      />
    </div>
  );
}

export function DataGridDensityDemo() {
  const [editable, setEditable] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <BoolControl label="편집 켜기" checked={editable} onChange={setEditable} />
      {CONTROL_SIZES.map((size) => (
        <DensityRow key={size} density={size} editable={editable} />
      ))}
      <p className="text-dl-xs text-dl-fg-muted">
        상단 테마 선택을 <code className="font-dl-mono">compact</code> 로 바꾸면 5단 전체가 함께
        축소된다 — density(그리드별)와 테마 스케일(전역)이 곱해지는 두 축이기 때문이다. 글자
        크기·컬럼 폭·툴바는 의도적으로 따라가지 않는다.
      </p>
    </div>
  );
}
