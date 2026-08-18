'use client';

import { DataGrid, defineColumns, type GridEmpty, showToast } from '@hvy/ui';
import { useState } from 'react';
import type { DemoOrder } from '../../../mock-orders';
import { EnumControl } from '../../../playground';

/**
 * 빈 상태 4종 — "행이 없다" 는 한 가지 사실이 아니다.
 *
 * `idle`(아직 조회 안 함) · `empty`(조회했고 0건) · `error`(조회 실패) · 로딩(첫 조회)은
 * 서로 다른 사실이고, 문구·색·다음 행동이 각각 다르다. 예전에는 이 구분이 앱마다
 * `error ? … : …` 삼항식으로 복제되어 있었고, `empty` 를 아예 안 넘기면 헤더만 남은
 * 빈 껍데기가 그려졌다.
 *
 * **컬럼 총폭을 데모 폭보다 넓게 잡았다** — 가로로 끝까지 스크롤해도 문구가 화면
 * 중앙에 그대로 있는지 확인하기 위해서다. 오버레이가 스크롤 컨테이너 안에 있으면
 * 가운데정렬 기준이 뷰포트가 아니라 컬럼 총폭이 되어 문구가 화면 밖으로 나간다.
 * 세로 스크롤바가 생기지 않는 것도 함께 본다.
 */

/** 폭을 넉넉히 잡아 **총폭 > 데모 폭**을 만든다 — 가로 스크롤이 있어야 볼 수 있는 결함이다. */
const COLUMNS = defineColumns<DemoOrder>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, pinned: true },
  { id: 'orderId', headerWord: '주문번호', width: 180, pinned: true },
  { id: 'receiver', headerWord: '수신자', width: 180 },
  { id: 'status', headerWord: '상태', width: 180 },
  { id: 'serviceType', headerWord: '서비스타입', width: 180 },
  { id: 'amount', headerWord: '금액', width: 180, align: 'right' },
  { id: 'orderDate', headerWord: '주문일', width: 240 },
]);

/** `default` 는 `empty` 를 **아예 넘기지 않는** 경우다 — 예전에는 여기가 빈 껍데기였다. */
const STATES = ['default', 'idle', 'empty', 'error', 'loading'] as const;
type DemoState = (typeof STATES)[number];

/** 상태별 `empty` 계약. `ui` 는 사전을 모르므로 문구·액션 라벨은 전부 앱이 준다. */
const EMPTY_BY_STATE: Readonly<Record<Exclude<DemoState, 'default'>, GridEmpty>> = {
  idle: {
    state: 'idle',
    title: '조회 조건을 입력하세요',
    hint: '기간과 주문상태를 고른 뒤 조회를 누릅니다',
  },
  empty: {
    state: 'empty',
    title: '조회 결과가 없습니다',
    hint: '조건을 바꿔 다시 조회해 보세요',
  },
  error: {
    state: 'error',
    title: '조회에 실패했습니다',
    action: { label: '다시 시도', onAction: () => showToast('다시 조회했습니다') },
  },
  // 로딩은 rows 0 + isFetching 이 만든다 — empty 자체는 조회가 끝났을 때의 문구다.
  loading: { state: 'empty', title: '조회 결과가 없습니다' },
};

export function DataGridEmptyStatesDemo() {
  const [state, setState] = useState<DemoState>('default');

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-sm">
        <EnumControl label="state" value={state} options={STATES} onChange={setState} />
      </div>

      <DataGrid
        columns={COLUMNS}
        rows={[]}
        getRowId={(row) => row.orderId}
        // 'default' 는 prop 자체를 넘기지 않는다 — 그리드가 스스로 기본 문구를 그린다.
        empty={state === 'default' ? undefined : EMPTY_BY_STATE[state]}
        isFetching={state === 'loading'}
        loadingLabel="불러오는 중"
        maxHeight={420}
      />

      <p className="text-dl-xs text-dl-fg-muted">
        가로로 끝까지 스크롤해도 문구는 화면 중앙에 남는다(오버레이가 스크롤 컨테이너 밖에 있다).
        행이 0이므로 세로 스크롤바도 생기지 않는다. <code className="font-dl-mono">empty</code> 를
        아예 넘기지 않으면 &quot;데이터가 없습니다&quot; 기본 문구가 나온다.
      </p>
    </div>
  );
}
