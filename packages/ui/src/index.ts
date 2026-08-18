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
export {
  type ConfirmOptions,
  ConfirmProvider,
  useConfirm,
} from './components/confirm';
export {
  DatePicker,
  type DatePickerProps,
  type DateRange,
  DateRangePicker,
  type DateRangePickerProps,
} from './components/date-picker';
export {
  DateTimePicker,
  type DateTimePickerProps,
  type DateTimePrecision,
  DateTimeRangePicker,
  type DateTimeRangePickerProps,
} from './components/date-time-picker';
/** 모달 3유형 — 규격이 서로 다르다. 아무거나 골라 쓰면 QA 명세와 어긋난다. */
export { ConfirmDialog, ContentDialog, PickerDialog } from './components/dialog';
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
export { FormGrid } from './components/form-grid';
/**
 * 폼 모드(edit·view·disabled) — 규칙 정본은 packages/ui/README.md "폼 컨트롤 3모드".
 * FormMode 는 폼에만 감는다. 그리드 크롬(DataGrid 등)은 내부에서 edit 로 핀되어 있다.
 */
export { type FieldMode, FormMode } from './components/form-mode';
export {
  type FieldLock,
  Input,
  type InputProps,
  Textarea,
  type TextareaProps,
} from './components/input';
export { MultiSelect, type MultiSelectProps } from './components/multi-select';
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './components/radio';
export {
  NativeSelect,
  type NativeSelectProps,
  Select,
  type SelectOption,
  type SelectProps,
} from './components/select';
export { Switch } from './components/switch';
export { Tab, TabList, TabPanel, Tabs } from './components/tabs';
/**
 * 토스트 — **완료 안내 전용**이다(v3 §ds-02). 되돌릴 수 있는 결과에만 쓰고,
 * 진행을 막아야 하면 `useConfirm()` 을 쓴다.
 * `showToast` 가 훅이 아닌 이유: `MutationCache.onError` 처럼 훅을 못 쓰는 자리에서 부른다.
 */
export { showToast, type Toast, type ToastTone, ToastViewport } from './components/toast';
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
export { DataGrid, type GridSelection } from './grid/DataGrid';
export {
  GridToolbar,
  GridToolbarSeparator,
  Pager,
  type PagerLabels,
  PageSizeSelect,
  TotalCount,
} from './grid/GridToolbar';
export {
  type ActiveCell,
  cellKey,
  type GridEditing,
  type ModifiedData,
  NEW_ROW_ID_FIELD,
  type RowStatus,
  type SaveRequestData,
} from './grid/gridEditing';
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

// worktabs(작업 탭 바)는 blog 에 해당 UI 개념이 없어 이식하지 않았다 — 원본 @deleo/ui 참조.
