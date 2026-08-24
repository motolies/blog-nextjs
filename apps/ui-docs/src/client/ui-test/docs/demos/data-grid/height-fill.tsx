'use client';

import { DataGrid, defineColumns, GridToolbar, TotalCount } from '@hvy/ui';
import { useState } from 'react';
import { DEMO_ORDERS, type DemoOrder } from '../../../mock-orders';
import { BoolControl } from '../../../playground';

/**
 * 높이 ① `maxHeight="fill"` — flex-column 부모가 남긴 높이를 채운다(CSS 만, JS 측정 없음).
 *
 * 점선 상자가 admin 목록 화면의 `.admin-table-shell`(column flex + 확정 높이) 역할이다.
 * 확인할 것 넷:
 *  1. "행 3개만" — 그리드가 3행 높이로 끝나고 상자 아래가 빈다. fill 은 **grow 하지 않는다**
 *     (`flex: 0 1 auto`) — 행이 적을 때 카드가 화면 끝까지 늘어나 빈 카드가 되면 안 된다.
 *  2. 57건 — 상자를 채우고 안에서 스크롤한다. 헤더는 sticky, 아래 툴바는 항상 보인다.
 *  3. 우하단 핸들로 상자를 늘리면 행이 더 보이고, 줄이면 **헤더+2행 하한**에서 그리드가 멈춘다
 *     (그 아래로는 상자가 잘린다 — 빈 상태 오버레이의 최소치와 같은 값이다).
 *  4. "강제 빈 상태" — 빈 상태 본문은 2~5행 높이이고 세로 스크롤바가 생기지 않는다.
 */

const COLUMNS = defineColumns<DemoOrder>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, resizable: false, pinned: true },
  { id: 'orderId', headerWord: '주문번호', width: 140, pinned: true },
  { id: 'receiver', headerWord: '수신자', width: 110 },
  { id: 'serviceType', headerWord: '서비스타입', width: 96 },
  { id: 'orderDate', headerWord: '주문일', width: 120, grow: 1 },
]);

const FEW_ROWS = DEMO_ORDERS.slice(0, 3);
const NO_ROWS: readonly DemoOrder[] = [];

const numberFormat = new Intl.NumberFormat('ko-KR');

export function DataGridHeightFillDemo() {
  const [fewRows, setFewRows] = useState(false);
  const [forceEmpty, setForceEmpty] = useState(false);

  const source = fewRows ? FEW_ROWS : DEMO_ORDERS;
  const rows = forceEmpty ? NO_ROWS : source;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-6">
        <BoolControl label="행 3개만" checked={fewRows} onChange={setFewRows} />
        <BoolControl label="강제 빈 상태" checked={forceEmpty} onChange={setForceEmpty} />
      </div>

      {/*
        flex-column 부모 — 그리드는 flex 아이템으로서 남은 높이 안에서 줄어든다.
        CSS `resize` 는 overflow 가 visible 이 아니어야 동작하므로 overflow-hidden 이
        리사이즈 조건이자 "넘치면 잘린다"를 눈으로 보는 장치다.
      */}
      <div className="flex h-[360px] resize-y flex-col overflow-hidden rounded-dl-container border border-dashed border-dl-border p-3">
        <p className="mb-2 shrink-0 text-dl-xs text-dl-fg-muted">
          flex-column 부모 · 높이 360px (우하단 핸들로 조절) — 목록 화면의 표 패널 역할
        </p>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          getRowId={(row) => row.orderId}
          translateHeader={(code) => code}
          maxHeight="fill"
          attachedToolbar
          empty={{
            title: '조회 결과가 없습니다',
            hint: '강제 빈 상태 토글을 끄면 데이터가 돌아옵니다',
          }}
        />
        {/* 툴바는 줄어들면 안 된다 — shrink-0 이라 그리드가 부족분을 전부 흡수한다 */}
        <GridToolbar
          className="shrink-0"
          paging={
            <TotalCount total={rows.length} prefix="총" suffix="건" format={numberFormat.format} />
          }
        />
      </div>
    </div>
  );
}
