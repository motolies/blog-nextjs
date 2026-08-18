/**
 * 결정적 목데이터 — 그리드 · 결합 시나리오 데모 공용.
 *
 * ⚠️ `Math.random()` · `Date.now()` 를 쓰지 않는다. 서버 렌더와 클라이언트 하이드레이션이
 * 다른 값을 만들면 hydration mismatch 가 난다 — 값은 전부 인덱스에서 파생한다.
 */

export type DemoStatus = 'READY' | 'SHIPPING' | 'DONE' | 'CANCELED' | 'ERROR';

/** Badge 의 tone 유니온과 같은 값이다 — `ui` 의 진행 국면 구분(v3 §ds-09)을 따른다. */
export type DemoStatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export const DEMO_STATUS_META: Readonly<
  Record<DemoStatus, { readonly label: string; readonly tone: DemoStatusTone }>
> = {
  READY: { label: '접수', tone: 'primary' },
  SHIPPING: { label: '배송중', tone: 'warning' },
  DONE: { label: '배송완료', tone: 'success' },
  CANCELED: { label: '취소', tone: 'neutral' },
  ERROR: { label: '오류', tone: 'danger' },
};

export const DEMO_STATUSES: readonly DemoStatus[] = [
  'READY',
  'SHIPPING',
  'DONE',
  'CANCELED',
  'ERROR',
];

/** `DataGrid<T extends Record<string, unknown>>` 제약을 만족시키는 인덱스 시그니처를 둔다. */
export type DemoOrder = {
  readonly rowNum: number;
  readonly orderId: string;
  readonly receiver: string;
  readonly status: DemoStatus;
  readonly serviceType: string;
  readonly amount: number;
  readonly orderDate: string;
  readonly [key: string]: unknown;
};

const RECEIVERS = [
  '김민준',
  '이서연',
  '박지호',
  '최수아',
  '정도윤',
  '한지우',
  '오하은',
  '서준서',
] as const;

const SERVICE_TYPES = ['항공', '해상', '특송'] as const;

/**
 * 57건인 이유: 페이지당 20건 기준 3페이지 + **부분 끝 페이지**(17건)가 생겨
 * Pager 의 경계 동작(마지막 페이지 비활성 · 건수 어긋남)이 눈에 보인다.
 */
export const DEMO_ORDERS: readonly DemoOrder[] = Array.from({ length: 57 }, (_, index) => ({
  rowNum: index + 1,
  orderId: `ORD-${100001 + index}`,
  receiver: RECEIVERS[index % RECEIVERS.length] ?? '',
  status: DEMO_STATUSES[index % DEMO_STATUSES.length] ?? 'READY',
  serviceType: SERVICE_TYPES[index % SERVICE_TYPES.length] ?? '항공',
  amount: 12000 + (index % 9) * 3500,
  orderDate: `2026-07-${String((index % 28) + 1).padStart(2, '0')}`,
}));

/** 인라인 편집 데모용 — checkbox 에디터가 매핑할 'Y'/'N' 코드 컬럼을 추가한 행. */
export type DemoEditableOrder = DemoOrder & { readonly useYn: 'Y' | 'N' };

/** 30건이면 스크롤이 생겨 "가상 스크롤로 밀려난 에디터의 커밋 유지"를 확인할 수 있다. */
export const DEMO_EDITABLE_ORDERS: readonly DemoEditableOrder[] = DEMO_ORDERS.slice(0, 30).map(
  (order, index) => ({ ...order, useYn: index % 4 === 0 ? 'N' : 'Y' }),
);
