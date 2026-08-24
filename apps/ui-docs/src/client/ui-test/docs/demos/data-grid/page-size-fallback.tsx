'use client';

import {
  Button,
  DataGrid,
  defineColumns,
  type GridPreferenceScope,
  GridToolbar,
  gridStorageKey,
  PageSizeSelect,
  TotalCount,
  useGridPreference,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_ORDERS, type DemoOrder } from '../../../mock-orders';

/**
 * 페이지 크기 저장값의 검증·폴백 — 손으로 써넣은 JSON 을 훅이 어떻게 읽는지 본다.
 *
 * 버튼이 `localStorage` 에 **원문 JSON 을 직접 쓰고** 그리드 블록을 리마운트한다(훅 인스턴스가
 * 새로 떠서 다시 읽는다 — 중복 키 경고 없음). 두 층의 규칙이 나뉘어 있는 것이 핵심이다:
 *  - `ui`(parsePreference): version 불일치면 **전부 폐기**, pageSize 는 양의 정수가 아니면 **그 항목만** 탈락.
 *    레거시 JSON(pageSize 키 없음)은 그대로 통과한다 — version 을 올리지 않은 이유.
 *  - 앱(여기서는 데모): 허용 목록 `[10, 20, 50, 100]` 밖이면 첫 옵션. ui 는 목록을 모른다.
 *
 * 확인: 레거시 → pageSize undefined, 주문번호 폭 180 **유지** / 25 → ui 는 25 를 그대로 주지만 셀렉트는 10 /
 * 0·'20' → undefined, 폭 유지(항목 단위 탈락) / version 2 → 전부 폐기(폭도 기본 140).
 */

const SCOPE: GridPreferenceScope = {
  userKey: 'ui-test',
  menuUrl: '/',
  gridId: 'demoPageSizeFallback',
};
const STORAGE_KEY = gridStorageKey(SCOPE);

const OPTIONS = [10, 20, 50, 100] as const;

/** 저장값 → 셀렉트 값. 목록 밖이면 첫 옵션 — 앱 규칙이라 ui 밖(여기)에 있다. */
function resolvePageSize(saved: number | undefined): number {
  return saved !== undefined && (OPTIONS as readonly number[]).includes(saved) ? saved : OPTIONS[0];
}

type Fixture = {
  readonly id: string;
  readonly label: string;
  /** localStorage 에 그대로 써넣는 원문 — 훅은 이 문자열만 본다. */
  readonly raw: string;
  readonly expectation: string;
};

const FIXTURES: readonly Fixture[] = [
  {
    id: 'legacy',
    label: '레거시 JSON (pageSize 없음)',
    raw: '{"version":1,"widths":{"orderId":180},"hidden":[],"order":[]}',
    expectation: 'pageSize undefined → 셀렉트 10 · 주문번호 폭 180 유지',
  },
  {
    id: 'out-of-list',
    label: '목록 밖 값 25',
    raw: '{"version":1,"widths":{"orderId":180},"hidden":[],"order":[],"pageSize":25}',
    expectation: 'ui 는 25 를 그대로 준다 → 셀렉트는 10(목록은 앱이 안다) · 폭 180 유지',
  },
  {
    id: 'zero',
    label: '불량 값 0',
    raw: '{"version":1,"widths":{"orderId":180},"hidden":[],"order":[],"pageSize":0}',
    expectation: 'pageSize 항목만 탈락(undefined) · 폭 180 유지',
  },
  {
    id: 'string',
    label: "불량 값 '20' (문자열)",
    raw: '{"version":1,"widths":{"orderId":180},"hidden":[],"order":[],"pageSize":"20"}',
    expectation: '숫자가 아니면 항목 단위 탈락(undefined) · 폭 180 유지',
  },
  {
    id: 'version',
    label: 'version 2',
    raw: '{"version":2,"widths":{"orderId":180},"hidden":[],"order":[],"pageSize":20}',
    expectation: '전부 폐기(preference null) → 셀렉트 10 · 폭 기본 140',
  },
];

const numberFormat = new Intl.NumberFormat('ko-KR');

const COLUMNS = defineColumns<DemoOrder>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, resizable: false, pinned: true },
  { id: 'orderId', headerWord: '주문번호', width: 140, pinned: true },
  { id: 'receiver', headerWord: '수신자', width: 110 },
  { id: 'orderDate', headerWord: '주문일', width: 120, grow: 1 },
]);

/** 로드 결과 한 칸 — 라벨 + 값. */
function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0 rounded-dl-control border border-dl-border bg-dl-canvas px-3 py-2">
      <div className="text-dl-xs text-dl-fg-muted">{label}</div>
      <div className="truncate font-dl-mono text-dl-sm text-dl-fg-strong">{value}</div>
    </div>
  );
}

/**
 * 그리드 블록 — `key` 로 통째로 리마운트된다. 훅이 새 인스턴스라 저장소를 처음부터 다시 읽는다.
 * (컴포넌트로 분리한 이유가 이것이다 — 훅은 같은 인스턴스 안에서는 키가 바뀔 때만 다시 읽는다.)
 */
function FallbackBlock() {
  const preference = useGridPreference(SCOPE);
  const pageSize = resolvePageSize(preference.pageSize);
  const orderIdWidth = preference.widths.orderId;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat
          label="preference (ui 로드 결과)"
          value={preference.preference === null ? 'null — 없음/폐기' : '로드됨'}
        />
        <Stat label="preference.pageSize (ui 가 준 값)" value={String(preference.pageSize)} />
        <Stat label="셀렉트 값 (앱 규칙: 목록 밖이면 10)" value={String(pageSize)} />
        <Stat
          label="preference.widths.orderId"
          value={orderIdWidth === undefined ? 'undefined — 기본 140' : String(orderIdWidth)}
        />
      </div>

      <div className="flex flex-col">
        <DataGrid
          columns={COLUMNS}
          rows={DEMO_ORDERS.slice(0, pageSize)}
          getRowId={(row) => row.orderId}
          translateHeader={(code) => code}
          columnWidths={preference.widths}
          onColumnWidthsChange={preference.setWidths}
          resizeColumnLabel="컬럼 너비 조절"
          maxHeight={{ rows: 3 }}
          attachedToolbar
        />
        <GridToolbar
          paging={
            <>
              <TotalCount
                total={DEMO_ORDERS.length}
                prefix="총"
                suffix="건"
                format={numberFormat.format}
              />
              <PageSizeSelect
                value={pageSize}
                onChange={preference.setPageSize}
                options={OPTIONS}
                label="페이지당 건수"
                suffix="건"
                format={numberFormat.format}
              />
            </>
          }
        />
      </div>
    </div>
  );
}

export function DataGridPageSizeFallbackDemo() {
  const [mountKey, setMountKey] = useState(0);
  const [applied, setApplied] = useState<Fixture | null>(null);

  /**
   * 원문을 직접 쓰고 블록을 리마운트한다. 언마운트되는 옛 블록이 미룬 쓰기(디바운스)를 flush 하며
   * 이 원문을 덮을 수 있다 — 폭을 드래그한 직후 300ms 안에 누르는 경우뿐이라 데모에서는 감수한다.
   */
  const apply = (fixture: Fixture | null) => {
    try {
      if (fixture) localStorage.setItem(STORAGE_KEY, fixture.raw);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 프라이빗 모드 — 쓰지 못하면 리마운트해도 같은 결과가 보일 뿐이다.
    }
    setApplied(fixture);
    setMountKey((key) => key + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FIXTURES.map((fixture) => (
          <Button key={fixture.id} size="sm" variant="outline-gray" onClick={() => apply(fixture)}>
            {fixture.label}
          </Button>
        ))}
        <Button size="sm" variant="outline-strong" onClick={() => apply(null)}>
          저장 삭제
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-dl-xs text-dl-fg-muted">
          써넣은 원문 — <code className="font-dl-mono">localStorage["{STORAGE_KEY}"]</code>
          {applied ? ` · 기대: ${applied.expectation}` : ' · 버튼을 눌러 원문을 써넣는다'}
        </span>
        <pre className="overflow-auto rounded-dl-control bg-dl-canvas px-4 py-3 font-dl-mono text-dl-xs leading-relaxed text-dl-fg">
          {applied ? applied.raw : '(저장된 항목 없음)'}
        </pre>
      </div>

      <FallbackBlock key={mountKey} />
    </div>
  );
}
