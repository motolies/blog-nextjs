/**
 * 개요(전체 목록)의 export → 문서 위치 매핑 — **순수 데이터 모듈**이다.
 *
 * inventory-gallery(화면)와 registry.test.ts(정합 검사)가 함께 쓰므로 컴포넌트와
 * 분리해 둔다 — 테스트가 next/link · @hvy/ui 전체를 끌고 오지 않기 위해서다.
 * href 가 실제 등록된 문서를 가리키는지는 registry.test.ts 가 검사한다.
 */

export type ExportInfo = {
  /** 데모가 있는 문서 위치. 없으면 note 만 보여준다. */
  readonly href?: string;
  /** 훅·유틸처럼 시각 데모가 무의미한 것들의 한 줄 설명. */
  readonly note?: string;
};

const C = '/components';
const F = '/foundations';
const EX = '/examples';

export const EXPORT_INFO: Readonly<Record<string, ExportInfo>> = {
  Badge: { href: `${C}/badge` },
  badgeVariants: { note: 'Badge 의 cva 변형 — 클래스 문자열 생성용' },
  Button: { href: `${C}/button` },
  buttonVariants: { note: 'Button 의 cva 변형 — 클래스 문자열 생성용' },
  IconButton: { href: `${C}/button` },
  Card: { href: `${C}/card` },
  CardHeader: { href: `${C}/card` },
  Checkbox: { href: `${C}/checkbox` },
  ConfirmProvider: { note: '셸(shell.tsx)이 페이지 전체를 감싼다 — useConfirm 의 전제' },
  useConfirm: { href: `${C}/dialog` },
  ConfirmDialog: { href: `${C}/dialog` },
  ContentDialog: { href: `${C}/dialog` },
  PickerDialog: { href: `${C}/dialog` },
  ErrorState: { href: `${C}/feedback` },
  EmptyState: { href: `${C}/feedback` },
  Spinner: { href: `${C}/feedback` },
  Field: { href: `${C}/field` },
  FieldError: { href: `${EX}/form-save` },
  Label: { note: '플레이그라운드 컨트롤(playground.tsx)이 직접 쓴다' },
  RequiredMark: { href: `${EX}/form-save` },
  useFieldControl: { note: 'Field 컨텍스트 → 컨트롤 접근성 배선. 컴포넌트 내부용 훅' },
  FieldValue: { href: `${C}/form-grid` },
  FormGrid: { href: `${C}/form-grid` },
  Calendar: { href: `${C}/date-picker` },
  DatePicker: { href: `${C}/date-picker` },
  DateRangePicker: { href: `${C}/date-picker` },
  DateTimePicker: { href: `${C}/date-time-picker` },
  DateTimeRangePicker: { href: `${C}/date-time-picker` },
  parseIsoDate: { note: 'YYYY-MM-DD → Date(로컬). 무효·오버플로 날짜는 null' },
  toIsoDate: { note: 'Date → YYYY-MM-DD. toISOString 의 UTC 밀림이 없다' },
  Input: { href: `${C}/input` },
  Textarea: { href: `${C}/input` },
  NativeSelect: { href: `${C}/select` },
  Select: { href: `${C}/select` },
  MultiSelect: { href: `${C}/multi-select` },
  Radio: { href: `${C}/radio` },
  RadioGroup: { href: `${C}/radio` },
  Switch: { href: `${C}/switch` },
  Tooltip: { href: `${C}/tooltip` },
  Tabs: { href: `${C}/tabs` },
  Tab: { href: `${C}/tabs` },
  TabList: { href: `${C}/tabs` },
  TabPanel: { href: `${C}/tabs` },
  showToast: { href: `${C}/toast` },
  ToastViewport: { note: '셸이 콘텐츠 래퍼 안에 마운트한다 — absolute 기준면 규칙' },
  clampToGroup: { note: '재정렬 시 그룹 경계 제한 (순수 함수) — 고정열 규칙에 쓰인다' },
  findDropIndex: { note: '드래그 좌표 → 드롭 위치 계산 (순수 함수)' },
  moveItem: { note: '배열 항목 이동 (순수 함수)' },
  shiftFor: { note: '키보드 이동량 계산 (순수 함수)' },
  useListReorder: { note: '드래그+키보드 목록 재정렬 훅 — ColumnSettingsDialog 내부' },
  useFieldErrors: { href: `${EX}/form-save` },
  ColumnSettingsDialog: { href: `${C}/data-grid` },
  applyColumnPreference: { href: `${C}/data-grid` },
  applyLockedColumns: { note: '마스킹 잠금 컬럼의 editable 강제 해제 — 주문 목록이 쓴다' },
  defineColumns: { href: `${C}/data-grid` },
  orderColumns: { note: '저장된 컬럼 순서 적용 (순수 함수) — 컬럼 설정 모달 내부' },
  pinnedCount: { note: '선두 고정열 개수 계산 (순수 함수)' },
  DataGrid: { href: `${C}/data-grid` },
  GridToolbar: { href: `${C}/data-grid` },
  GridToolbarSeparator: { href: `${C}/data-grid` },
  Pager: { href: `${C}/data-grid` },
  PageSizeSelect: { href: `${C}/data-grid` },
  TotalCount: { href: `${C}/data-grid` },
  TreeGrid: { href: `${C}/tree-grid` },
  useColumnLayout: { note: '폭·오프셋·총폭 계산 — DataGrid 내부 훅' },
  gridStorageKey: { note: '그리드 설정 localStorage 키 생성 (user·menu·grid 3축)' },
  useGridPreference: { href: `${C}/data-grid` },
  useGridSelection: { href: `${C}/data-grid` },
  useGridEditing: { href: `${C}/data-grid` },
  isColumnEditable: { note: '편집 가능 컬럼 판정 (순수 함수) — editor 有 · editable !== false' },
  cellKey: { note: 'dirty/invalid 셀 키 생성 (순수 함수) — `rowId:columnId`' },
  NEW_ROW_ID_FIELD: { note: '추가 행의 임시 rowId 예약 필드 — 저장 계약 출력에서 제거된다' },
  Icon: { href: `${F}/icons` },
  FormMode: {
    note: '폼 모드(edit·view·disabled) 컨텍스트 — field 문서의 3모드 데모가 화면 대조 정본',
    href: `${C}/field`,
  },
  CONTROL_SIZES: { note: '5단 컨트롤 사이즈 상수 — size 파리티의 정본(lib/controlSize.ts)' },
  cn: { note: 'twMerge(clsx(...)) 클래스 병합' },
  useBeforeUnloadGuard: { href: `${C}/data-grid` },
  useTokenPx: { note: 'CSS 토큰을 px 숫자로 읽는 훅 — 그리드 행 높이 등' },
};
