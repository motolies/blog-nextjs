/**
 * 개요(전체 목록)의 export → 문서 위치 매핑 — **순수 데이터 모듈**이다.
 *
 * inventory-gallery(화면)와 registry.test.ts(정합 검사)가 함께 쓰므로 컴포넌트와
 * 분리해 둔다 — 테스트가 next/link 와 React 컴포넌트를 끌고 오지 않기 위해서다
 * (`@hvy/ui` 자체는 이미 문서 정의 → 데모 경로로 테스트에 들어온다).
 *
 * **이 맵은 barrel 전량을 덮어야 한다.** 빠지면 개요 화면에 빨간 "데모 없음" 배지가 뜨고,
 * registry.test.ts 가 CI 에서 먼저 깨뜨린다 — 배지는 사람이 볼 때만 드러나기 때문이다.
 * href 가 실제 등록된 문서를 가리키는지도 같은 테스트가 검사한다.
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
  Combobox: { href: `${C}/combobox` },
  Accordion: { href: `${C}/accordion` },
  AccordionItem: { href: `${C}/accordion` },
  AccordionTrigger: { href: `${C}/accordion` },
  AccordionContent: { href: `${C}/accordion` },
  CONTROL_SIZES: { note: '5단 컨트롤 사이즈 상수 — size 파리티의 정본(lib/controlSize.ts)' },
  CheckboxGroup: { href: `${C}/checkbox-group` },
  ConfirmProvider: { note: '셸(shell.tsx)이 페이지 전체를 감싼다 — useConfirm·useAlert 의 전제' },
  useConfirm: { href: `${C}/dialog` },
  useAlert: { href: `${C}/dialog` },
  ConfirmDialog: { href: `${C}/dialog` },
  ContentDialog: { href: `${C}/dialog` },
  PickerDialog: { href: `${C}/dialog` },
  DropdownMenu: { href: `${C}/dropdown-menu` },
  DropdownMenuTrigger: { href: `${C}/dropdown-menu` },
  DropdownMenuContent: { href: `${C}/dropdown-menu` },
  DropdownMenuItem: { href: `${C}/dropdown-menu` },
  DropdownMenuSeparator: { href: `${C}/dropdown-menu` },
  DropdownMenuLabel: { href: `${C}/dropdown-menu` },
  ErrorState: { href: `${C}/feedback` },
  EmptyState: { href: `${C}/feedback` },
  Spinner: { href: `${C}/feedback` },
  InlineNotice: { href: `${C}/inline-notice` },
  Field: { href: `${C}/field` },
  FieldError: { href: `${EX}/form-save` },
  Label: { note: '플레이그라운드 컨트롤(playground.tsx)이 직접 쓴다' },
  RequiredMark: { href: `${EX}/form-save` },
  useFieldControl: { note: 'Field 컨텍스트 → 컨트롤 접근성 배선. 컴포넌트 내부용 훅' },
  FieldValue: { href: `${C}/form-grid` },
  FileUpload: { href: `${C}/file-upload` },
  FormGrid: { href: `${C}/form-grid` },
  FormMode: { href: `${C}/field` },
  FormSection: { href: '/layout/form-section' },
  Calendar: { href: `${C}/calendar` },
  DatePicker: { href: `${C}/date-picker` },
  DateRangePicker: { href: `${C}/date-range-picker` },
  DateTimePicker: { href: `${C}/date-time-picker` },
  DateTimeRangePicker: { href: `${C}/date-time-range-picker` },
  parseIsoDate: {
    href: `${C}/calendar#iso-utils`,
    note: 'YYYY-MM-DD → Date(로컬). 무효·오버플로 날짜는 null',
  },
  toIsoDate: {
    href: `${C}/calendar#iso-utils`,
    note: 'Date → YYYY-MM-DD. toISOString 의 UTC 밀림이 없다',
  },
  presetRange: { href: `${C}/date-range-picker` },
  toDateTimeRange: { href: `${C}/date-time-range-picker` },
  DATE_PRESET_KINDS: { note: '기간 프리셋 종류 6개 목록 — 앱이 라벨을 붙여 presets 로 조립한다' },
  Input: { href: `${C}/input` },
  Textarea: { href: `${C}/input` },
  NativeSelect: { href: `${C}/select` },
  Select: { href: `${C}/select` },
  MultiSelect: { href: `${C}/multi-select` },
  NumberInput: { href: `${C}/number-input` },
  Radio: { href: `${C}/radio` },
  RadioGroup: { href: `${C}/radio` },
  StatTile: { href: `${C}/stat-tile` },
  Switch: { href: `${C}/switch` },
  Tooltip: { href: `${C}/tooltip` },
  Table: { href: `${C}/table` },
  TableHead: { href: `${C}/table` },
  TableBody: { href: `${C}/table` },
  TableRow: { href: `${C}/table` },
  TableHeaderCell: { href: `${C}/table` },
  TableCell: { href: `${C}/table` },
  Tabs: { href: `${C}/tabs` },
  Tab: { href: `${C}/tabs` },
  TabList: { href: `${C}/tabs` },
  TabPanel: { href: `${C}/tabs` },
  showToast: { href: `${C}/toast` },
  ToastViewport: { note: '셸이 콘텐츠 래퍼 안에 마운트한다 — absolute 기준면 규칙' },
  clampToGroup: {
    href: `${F}/list-reorder`,
    note: '재정렬 시 그룹 경계 제한 (순수 함수) — 고정열 규칙에 쓰인다',
  },
  findDropIndex: { href: `${F}/list-reorder`, note: '드래그 좌표 → 드롭 위치 계산 (순수 함수)' },
  moveItem: { href: `${F}/list-reorder`, note: '배열 항목 이동 (순수 함수)' },
  shiftFor: { href: `${F}/list-reorder`, note: '드래그 중 각 항목이 비켜날 거리 (순수 함수)' },
  useListReorder: {
    href: `${F}/list-reorder`,
    note: '드래그+키보드 목록 재정렬 훅 — 컬럼 설정·작업 탭 바가 쓴다',
  },
  useFieldErrors: { href: `${EX}/form-save` },
  ColumnSettingsDialog: { href: `${C}/column-settings` },
  applyColumnPreference: { href: `${C}/data-grid` },
  applyLockedColumns: {
    note: '마스킹 잠금 컬럼의 editable 강제 해제 — 잠금 컬럼이 있는 목록이 쓴다',
  },
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
  GridEmptyContent: { href: `${C}/data-grid` },
  GridEmptyOverlay: { href: `${C}/data-grid` },
  GRID_ROW_TOKEN: { note: '밀도 5단의 행 높이 토큰 이름 map — density 는 이름을 고르는 방식이다' },
  GRID_HEADER_TOKEN: { note: '밀도 5단의 헤더 높이 토큰 이름 map' },
  GRID_CHECK_TOKEN: { note: '밀도 5단의 선택열 폭 토큰 이름 map (체크박스 폭 × 2)' },
  GRID_CELL_PX_CLASS: { note: '밀도 5단의 셀 좌우 패딩 클래스 map' },
  useColumnLayout: { note: '폭·오프셋·총폭 계산 — DataGrid 내부 훅' },
  gridStorageKey: { note: '그리드 설정 localStorage 키 생성 (user·menu·grid 3축)' },
  useGridPreference: { href: `${C}/data-grid` },
  useGridSelection: { href: `${C}/data-grid` },
  useGridEditing: { href: `${C}/data-grid` },
  isColumnEditable: { note: '편집 가능 컬럼 판정 (순수 함수) — editor 有 · editable !== false' },
  cellKey: { note: 'dirty/invalid 셀 키 생성 (순수 함수) — `rowId:columnId`' },
  NEW_ROW_ID_FIELD: { note: '추가 행의 임시 rowId 예약 필드 — 저장 계약 출력에서 제거된다' },
  Icon: { href: `${F}/icons` },
  cn: { note: 'twMerge(clsx(...)) 클래스 병합' },
  useBeforeUnloadGuard: { href: `${C}/data-grid` },
  useTokenPx: { note: 'CSS 토큰을 px 숫자로 읽는 훅 — 그리드 행 높이 등' },

  // 작업 탭 — 컴포넌트 1 + 상태 순수 함수 9. 계산은 전부 순수 함수 쪽에 있고
  // 바(bar)는 그리기만 한다. 그래서 함수들도 화면 없이 검증할 수 있다.
  WorkTabsBar: { href: `${C}/work-tabs` },
  WORK_TABS_MAX: {
    href: `${C}/work-tabs#state-fns`,
    note: '탭 개수 상한 — 도달하면 새 탭을 거부한다(자동 퇴출이 아니다)',
  },
  canOpenTab: {
    href: `${C}/work-tabs#state-fns`,
    note: '이 id 로 탭을 열 수 있는가 (순수 함수) — 상한 판정을 미리 노출한다',
  },
  upsertTab: {
    href: `${C}/work-tabs#state-fns`,
    note: '열기 또는 갱신 (순수 함수) — 내용이 같으면 같은 참조를 돌려준다',
  },
  closeTab: { href: `${C}/work-tabs#state-fns`, note: '탭 하나 닫기 (순수 함수)' },
  closeOthers: { href: `${C}/work-tabs#state-fns`, note: '지목한 탭과 핀 탭만 남긴다 (순수 함수)' },
  closeRightOf: {
    href: `${C}/work-tabs#state-fns`,
    note: '오른쪽 탭 닫기 — 핀 탭은 남는다 (순수 함수)',
  },
  closeUnpinned: { href: `${C}/work-tabs#state-fns`, note: '핀 제외 전체 닫기 (순수 함수)' },
  togglePin: {
    href: `${C}/work-tabs#state-fns`,
    note: '핀 전환 (순수 함수) — 핀 그룹이 앞쪽 연속 구간이라는 불변식을 유지한다',
  },
  nextActiveAfterClose: {
    href: `${C}/work-tabs#state-fns`,
    note: '닫은 뒤 이동할 이웃 (순수 함수) — 오른쪽 우선, 없으면 왼쪽',
  },
};
