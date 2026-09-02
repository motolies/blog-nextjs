/**
 * `@hvy/ui` — shadcn 방식 헤드리스 컴포넌트 + 기본 테마 (deleo-one-ui 의 @deleo/ui 에서 분기).
 *
 * **프레임워크 중립을 유지한다.** 의존은 radix · cva · clsx · react-virtual · lucide 뿐이고
 * `next/*`, `@tanstack/react-query`, axios 를 **import 하지 않는다** —
 * 그래야 다른 앱이 UI 만 가져다 쓸 수 있다. 데이터 계층 배선은 앱(apps/blog)이 한다.
 *
 * Primitive(여기) vs Composite(앱으로 복사)의 구분 기준:
 * 접근성·포커스 트랩·키보드 조작·가상 스크롤처럼 **틀리면 조용히 위험하거나 어려운** 코드만
 * 중앙 관리한다. 화면 조합물(SearchForm, DetailPanel 등)은 앱이 자유롭게 수정한다.
 */
/** 아코디언 — blog 추가분(조합형 4파트). 접이식 가이드 패널 등. */
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './components/accordion';
export { Badge, type BadgeProps, badgeVariants } from './components/badge';
export {
  Button,
  type ButtonProps,
  buttonVariants,
  IconButton,
  type IconButtonProps,
} from './components/button';
export { Calendar, type CalendarProps, parseIsoDate, toIsoDate } from './components/calendar';
export { Card, CardHeader } from './components/card';
export { Checkbox, type CheckboxProps } from './components/checkbox';
/** RadioGroup 의 다중 선택 대칭 — 값 계약은 readonly string[], 전송은 formData.getAll. */
export {
  CheckboxGroup,
  type CheckboxGroupOption,
  type CheckboxGroupProps,
} from './components/checkbox-group';
/** 콤보박스(피커형) — blog 추가분. 값을 고정하지 않고 onPick 콜백만 — 칩 추가·게시글 선택 등. */
export { Combobox, type ComboboxOption, type ComboboxProps } from './components/combobox';
/** 확인(`Promise<boolean>`)과 알림(`Promise<void>`) — Provider 는 하나를 공유한다. */
export {
  type AlertOptions,
  type ConfirmOptions,
  ConfirmProvider,
  useAlert,
  useConfirm,
} from './components/confirm';
export { DatePicker, type DatePickerProps } from './components/date-picker';
export {
  type DateRange,
  DateRangePicker,
  type DateRangePickerProps,
  type DateRangePreset,
} from './components/date-range-picker';
export {
  DateTimePicker,
  type DateTimePickerProps,
  type DateTimePrecision,
  DateTimeRangePicker,
  type DateTimeRangePickerProps,
} from './components/date-time-picker';
/**
 * 기간 프리셋 산식 — "오늘/최근 7일/이번 달"의 날짜 계산만. 라벨은 앱이 붙여
 * `presets` prop 으로 조립한다(`ui` 는 사전을 모른다).
 */
export {
  DATE_PRESET_KINDS,
  type DatePresetKind,
  type DateTimePresetKind,
  presetDateTimeRange,
  presetRange,
  toDateTimeRange,
} from './components/datePresets';
/** 모달 3유형 — 규격이 서로 다르다. 아무거나 골라 쓰면 QA 명세와 어긋난다. */
export { ConfirmDialog, ContentDialog, PickerDialog } from './components/dialog';
/**
 * 행 액션·오버플로 메뉴 — radix 합성. 내비게이션 아님(메뉴 이동 링크는 사이드바뿐).
 * 아이템이 정확히 하나면 패널을 열지 않고 트리거 클릭이 곧 실행이다(Label 이 있으면 접지 않는다).
 */
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/dropdown-menu';
export { ErrorState } from './components/error-state';
export { EmptyState, Spinner } from './components/feedback';
export {
  Field,
  FieldError,
  type FieldProps,
  FieldValue,
  Label,
  type LabelProps,
  RequiredMark,
  useFieldControl,
} from './components/field';
/** 상태 합성 계약(mode·lock·masking)의 타입 — 해석 규칙 정본은 fieldState.ts 머리말. */
export type { ControlDataProps, ControlState } from './components/fieldState';
export {
  type FileRejectReason,
  FileUpload,
  type FileUploadProps,
} from './components/file-upload';
export { FormGrid } from './components/form-grid';
/**
 * 폼 모드(edit·view·disabled) — 규칙 정본은 packages/ui/README.md "폼 컨트롤 3모드".
 * FormMode 는 폼에만 감는다. 그리드 크롬(DataGrid 등)은 내부에서 edit 로 핀되어 있다.
 */
export { type FieldMode, FormMode } from './components/form-mode';
/** Card + CardHeader + FormGrid 3중주 래퍼 — 상세 폼 섹션. 접기는 collapsible 로 켠다. */
export { FormSection } from './components/form-section';
/** 화면에 머무는 안내 배너 — 토스트(휘발)와 ErrorState(전면) 사이의 층이다. */
export {
  InlineNotice,
  type InlineNoticeProps,
  type InlineNoticeTone,
} from './components/inline-notice';
export { Input, type InputProps, Textarea, type TextareaProps } from './components/input';
export { MultiSelect, type MultiSelectProps } from './components/multi-select';
export { NumberInput, type NumberInputProps } from './components/number-input';
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './components/radio';
export {
  NativeSelect,
  type NativeSelectProps,
  Select,
  type SelectOption,
  type SelectProps,
} from './components/select';
/**
 * 토스트 — **완료 안내 전용**이다(v3 §ds-02). 되돌릴 수 있는 결과에만 쓰고,
 * 진행을 막아야 하면 `useConfirm()` 을 쓴다.
 * `showToast` 가 훅이 아닌 이유: `MutationCache.onError` 처럼 훅을 못 쓰는 자리에서 부른다.
 */
export { StatTile, type StatTileProps, type StatTileTone } from './components/stat-tile';
export { Switch, type SwitchProps } from './components/switch';
/** 정적 시멘틱 표 — 5~20행 참조 데이터용. 대량·서버 페이징은 DataGrid 를 쓴다. */
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  type TableProps,
  TableRow,
  type TableSize,
} from './components/table';
export { Tab, TabList, TabPanel, Tabs } from './components/tabs';
export {
  showToast,
  type Toast,
  type ToastAction,
  type ToastTone,
  ToastViewport,
} from './components/toast';
export { Tooltip } from './components/tooltip';
/**
 * 목록 재정렬(드래그 + 키보드) — 그리드 전용이 아니다.
 * 컬럼 설정이 첫 소비자이고, 정렬 기준 모달처럼 순서를 가진 목록이면 그대로 쓴다.
 */
export { clampToGroup, findDropIndex, moveItem, shiftFor } from './dnd/listReorder';
export { useListReorder } from './dnd/useListReorder';
/**
 * 폼 오류의 **배선** — 규칙(zod)도 사전도 모른다. 심고·지우고·포커스만 한다.
 * 규칙은 `packages/contracts` 가, 문구 해석은 앱이 갖는다.
 */
export { useFieldErrors } from './form/useFieldErrors';
export {
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
} from './grid/ColumnSettingsDialog';
export {
  applyColumnPreference,
  applyLockedColumns,
  type CellEditorRenderProps,
  type ColumnDef,
  type ColumnEditor,
  defineColumns,
  type GridPreference,
  isColumnEditable,
  orderColumns,
  pinnedCount,
} from './grid/columns';
export {
  DataGrid,
  type DataGridProps,
  type GridFooter,
  type GridSelection,
} from './grid/DataGrid';
export {
  type GridEmpty,
  GridEmptyContent,
  GridEmptyOverlay,
  type GridEmptyState,
} from './grid/GridEmptyOverlay';
export {
  GridToolbar,
  type GridToolbarSelection,
  GridToolbarSeparator,
  Pager,
  type PagerLabels,
  PageSizeSelect,
  TotalCount,
} from './grid/GridToolbar';
/** 밀도 5단의 토큰 이름·클래스 색인 — 그리드 밖에서 같은 치수를 맞출 때 쓴다.
    SSR fallback map 은 내부 구현이라 내보내지 않는다. */
export {
  GRID_CELL_PX_CLASS,
  GRID_CHECK_TOKEN,
  GRID_HEADER_TOKEN,
  GRID_ROW_TOKEN,
} from './grid/gridDensity';
export {
  type ActiveCell,
  cellKey,
  type GridEditing,
  type ModifiedData,
  NEW_ROW_ID_FIELD,
  type RowStatus,
  type SaveRequestData,
} from './grid/gridEditing';
/** `DataGrid.maxHeight` 의 네 모양. resolver 는 내부 구현이라 내보내지 않는다. */
export type { GridMaxHeight } from './grid/gridHeight';
export { TreeGrid } from './grid/TreeGrid';
export { type ColumnWidths, useColumnLayout } from './grid/useColumnLayout';
export { type GridEditingApi, useGridEditing } from './grid/useGridEditing';
export {
  type GridPreferenceScope,
  gridStorageKey,
  useGridPreference,
} from './grid/useGridPreference';
export { type SelectAllState, useGridSelection } from './grid/useGridSelection';

/**
 * 아이콘 — lucide-react(peer) 전달형 래퍼. 원본(@deleo/ui)의 자체 스프라이트 대신
 * blog 는 lucide 를 아이콘 프레임워크로 쓴다(앱이 이미 81종 직접 import — 두 체계
 * 공존을 피하려면 이쪽을 lucide 로 통일하는 방향이 맞다). 래퍼는 크기 토큰과
 * a11y 규약만 강제한다. 문자열 레지스트리를 두지 않아 트리셰이킹이 유지된다.
 */
export { Icon, type IconProps, type IconSize } from './icons/icon';

export { cn } from './lib/cn';
export { CONTROL_SIZES, type ControlSize } from './lib/controlSize';
export { useBeforeUnloadGuard } from './lib/useBeforeUnloadGuard';
export { useTokenPx } from './lib/useTokenPx';

/**
 * 작업 탭 바 — QA 헤더 탭 메뉴(칩형). 그리드 탭(`Tabs`, 밑줄형)과 다른 시각 언어다.
 * **메뉴 내 로컬 상세 탭** 용도가 정본이다(전역 크롬 아님) — 「목록」 앵커는
 * `pinned + closable:false`. URL·라우터·사전을 모르는 controlled 컴포넌트 + 순수 상태 계산.
 * 탭 목록은 세션 휘발(영속 없음) — 진실은 URL 이고, 라우팅 배선은 앱이 한다.
 */
export { WorkTabsBar, type WorkTabsLabels } from './worktabs/WorkTabsBar';
export {
  canOpenTab,
  closeOthers,
  closeRightOf,
  closeTab,
  closeUnpinned,
  nextActiveAfterClose,
  togglePin,
  upsertTab,
  WORK_TABS_MAX,
  type WorkTab,
} from './worktabs/workTabsState';
