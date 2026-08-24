'use client';

import { DataGrid, defineColumns, GridToolbar, TotalCount } from '@hvy/ui';
import { useState } from 'react';
import { DEMO_ORDERS, type DemoOrder } from '../../../mock-orders';
import { BoolControl } from '../../../playground';

/**
 * 높이 ④ `'fill'` 이 **조용히 실패하는** 조건 — flex 사슬.
 *
 * 같은 `maxHeight="fill"` 그리드(57건)를 두 상자에 넣는다. 에러도 경고도 없이 결과만 다르다:
 *  (a) `flex h-[300px] flex-col overflow-hidden` — 정상 사슬. 그리드가 상자를 채우고 안에서 스크롤,
 *      아래 툴바가 보인다.
 *  (b) `h-[300px] overflow-hidden` — **flex 가 아닌** 부모. 자식이 flex 아이템이 아니라 수축 규칙 자체가
 *      없어 그리드는 'auto' 처럼 내용 높이(57행)로 늘어나고, 상자 밖(툴바 포함)이 잘린다.
 *
 * (a) 안에는 중간 래퍼(column flex)가 한 겹 더 있다 — 실제 admin 화면의 프레임 → workspace →
 * 표 패널처럼 사슬은 보통 여러 겹이다. "부모 min-height:0 제거" 를 켜면 그 래퍼에서 `min-h-0` 만 빠진다:
 * flex 아이템의 자동 최소 높이(`min-height: auto`)는 **내용 높이**라 래퍼가 57행 높이 아래로 줄지 못하고,
 * 상자는 flex-column 인데도 (b) 와 똑같이 넘쳐 잘린다. 사슬의 **모든 고리**가 flex-column 이면서
 * min-height:0(또는 확정 높이)이어야 하는 이유이고, 앱의 `.admin-table-shell` 이 column flex +
 * min-height:0 인 이유다. `admin-page-frame--fixed` 가 lg 미만에서 풀리면 같은 방식으로 'auto' 로
 * 퇴화한다(그때는 의도된 동작 — 페이지 스크롤).
 */

const COLUMNS = defineColumns<DemoOrder>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, resizable: false, pinned: true },
  { id: 'orderId', headerWord: '주문번호', width: 130, pinned: true },
  { id: 'receiver', headerWord: '수신자', width: 100 },
  { id: 'orderDate', headerWord: '주문일', width: 110, grow: 1 },
]);

const numberFormat = new Intl.NumberFormat('ko-KR');

/** 두 상자에 똑같이 들어가는 그리드+툴바 — 차이는 오직 부모다. */
function FillGrid() {
  return (
    <>
      <DataGrid
        columns={COLUMNS}
        rows={DEMO_ORDERS}
        getRowId={(row) => row.orderId}
        translateHeader={(code) => code}
        maxHeight="fill"
        attachedToolbar
      />
      <GridToolbar
        className="shrink-0"
        paging={
          <TotalCount
            total={DEMO_ORDERS.length}
            prefix="총"
            suffix="건"
            format={numberFormat.format}
          />
        }
      />
    </>
  );
}

export function DataGridHeightFillChainDemo() {
  const [dropMinHeight, setDropMinHeight] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <BoolControl
        label="부모 min-height:0 제거"
        checked={dropMinHeight}
        onChange={setDropMinHeight}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* (a) 정상 사슬 — 확정 높이 flex-column 상자 → 래퍼(flex-column + min-h-0) → 그리드 */}
        <div className="flex h-[300px] flex-col overflow-hidden rounded-dl-container border border-dashed border-dl-border p-3">
          <p className="mb-2 shrink-0 text-dl-xs text-dl-fg-muted">
            (a) flex-column 부모 · 300px — 중간 래퍼{' '}
            {dropMinHeight ? 'min-height:0 없음' : 'min-height:0'}
          </p>
          {/* Tailwind 는 문자열 리터럴만 스캔한다 — 클래스를 조립하지 않고 두 리터럴 중 하나를 고른다 */}
          <div className={dropMinHeight ? 'flex flex-col' : 'flex min-h-0 flex-col'}>
            <FillGrid />
          </div>
        </div>

        {/* (b) 끊긴 사슬 — block 부모. 그리드의 flex 수축 규칙이 적용될 컨테이너가 없다 */}
        <div className="h-[300px] overflow-hidden rounded-dl-container border border-dashed border-dl-border p-3">
          <p className="mb-2 text-dl-xs text-dl-fg-muted">
            (b) block 부모 · 300px — flex 가 아니라 'auto' 로 퇴화, 툴바가 잘린다
          </p>
          <FillGrid />
        </div>
      </div>
    </div>
  );
}
