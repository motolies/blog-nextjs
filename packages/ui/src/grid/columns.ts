import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SelectOption } from '../components/select';
import { warnOnce } from '../lib/warnOnce';

/**
 * 커스텀 셀 에디터(`editor.type = 'custom'`)가 받는 렌더 인자.
 *
 * `commit`/`cancel` 은 **호출 즉시 편집이 끝난다** — 에디터가 자체 확정 버튼을 두든
 * blur 에서 부르든, 값 반영과 편집 종료를 이 두 함수로만 한다.
 */
export type CellEditorRenderProps<T> = {
  readonly value: unknown;
  readonly row: T;
  /** 값 확정 + 편집 종료. */
  readonly commit: (value: unknown) => void;
  /** 값 버림 + 편집 종료. */
  readonly cancel: () => void;
};

/**
 * 셀 에디터 종류 — 현행 `gridWrapper.js` 의 에디터 6종
 * (text · number · select/combobox · multiselect · date/datetime · boolean) 대응.
 *
 * `select` 가 현행 select 와 combobox 를 겸한다 — `Select` 컴포넌트가
 * 항목 10개 초과 시 검색 입력을 자동으로 붙이기 때문이다.
 * 여기 없는 형태는 `custom` 으로 탈출한다.
 */
export type ColumnEditor<T> =
  | { readonly type: 'text'; readonly maxLength?: number }
  | { readonly type: 'number'; readonly min?: number; readonly max?: number }
  | {
      readonly type: 'select';
      readonly options: readonly SelectOption[];
      /** `Select` 의 placeholder 가 필수인 것과 같은 이유 — 빈 값 상태의 문구를 강제한다. */
      readonly placeholder: string;
    }
  | {
      readonly type: 'multiselect';
      readonly options: readonly SelectOption[];
      readonly placeholder: string;
    }
  | { readonly type: 'date'; readonly min?: string; readonly max?: string }
  | { readonly type: 'datetime' }
  | {
      /**
       * 체크박스는 click-to-edit 없이 **상시 인터랙티브·즉시 커밋**이다 —
       * "편집 모드 진입" 을 두면 체크 하나에 클릭이 두 번 든다.
       */
      readonly type: 'checkbox';
      /** 체크 시 커밋되는 값. 기본 true. `'Y'/'N'` 코드 컬럼은 여기로 매핑한다. */
      readonly checkedValue?: unknown;
      readonly uncheckedValue?: unknown;
    }
  | { readonly type: 'custom'; readonly render: (props: CellEditorRenderProps<T>) => ReactNode };

/**
 * 컬럼 정의 — 현행 `gridWrapper.js` 의 header 배열 대응.
 *
 * `headerWord` 는 FieldWord 코드다. 현행은 `common.js` 의 `initialLabel()` 이
 * jQuery 로 DOM 을 후처리 치환하는데, 이건 React 선언형과 정면 충돌한다.
 * 여기서는 렌더 시점에 번역기가 해석한다.
 */
export type ColumnDef<T> = {
  readonly id: keyof T & string;
  /** 다국어 사전 코드. 없으면 `id` 를 그대로 쓴다. */
  readonly headerWord?: string;
  /** 초기 폭. 없으면 `--spacing-dl-grid-col`. 사용자가 조정하면 그 값이 이긴다. */
  readonly width?: number;
  /** 리사이즈 하한. 없으면 `--spacing-dl-grid-col-min`. */
  readonly minWidth?: number;
  /** 리사이즈 상한. 없으면 무제한. **`grow` 컬럼에는 주지 않는다** — 남는 폭이 흡수되지 못하고 뜬다. */
  readonly maxWidth?: number;
  /** 기본 true. 폭이 의미를 갖는 컬럼(체크·No)만 끈다. */
  readonly resizable?: boolean;
  /**
   * 남는 폭 분배 가중치(현행 `gridWrapper.js` 의 `gravity` 대응). 기본 0 = 고정폭.
   *
   * ⚠️ **사용자가 직접 조정한 컬럼은 분배에서 빠진다** — 안 그러면 드래그한 폭이
   *    다음 렌더에 튕겨 돌아온다. 판정은 `resolveColumnLayout` 이 한다.
   */
  readonly grow?: number;
  /** 컬럼 설정의 초기 표시 상태. 사용자가 켜면 보인다. */
  readonly hidden?: boolean;
  /**
   * 컬럼 설정에서 끌 수 있는지. 기본 true.
   * 행을 식별하는 최소 정보(No · 핵심 키)는 false 로 둔다 — 이게 없으면 표를 읽을 수 없다.
   */
  readonly hideable?: boolean;
  /**
   * **기본값이 `center` 다** — v3 는 숫자 우측정렬 규칙을 두지 않는다.
   * 금액·수량도 전부 가운데 정렬이고, 폼 안에서만 반대로 왼쪽으로 붙인다.
   */
  readonly align?: 'left' | 'center' | 'right';
  readonly sortable?: boolean;
  /**
   * 편집 잠금 스위치. **편집 가능 판정은 `editor !== undefined && editable !== false`** —
   * `editor` 가 있어야 편집 UI가 생기고, `applyLockedColumns`(마스킹 잠금)가
   * 이 값을 false 로 덮어쓰면 `editor` 가 있어도 잠긴다.
   */
  readonly editable?: boolean;
  /** 셀 인라인 에디터. 없으면 조회 전용 컬럼이다. */
  readonly editor?: ColumnEditor<T>;
  /**
   * 셀 확정 시 실행하는 검증. null 이면 유효, 문자열이면 오류 문구다.
   * `ui` 는 사전을 모른다 — **번역이 끝난 문구**를 클로저로 넘긴다.
   */
  readonly validate?: (value: unknown, row: T) => string | null;
  /** 이 컬럼이 상세로 가는 링크가 된다(현행 `primary` + `link` 대응). */
  readonly primary?: boolean;
  /**
   * 좌측 고정. **선두의 연속된 컬럼에만** 유효하다 —
   * 중간 컬럼을 고정하면 스크롤 시 좌우가 갈라져 읽을 수 없다.
   */
  readonly pinned?: boolean;
  /**
   * 핵심 키 오른쪽에 붙는 행 액션(19px). v3 §ds-03 의 "상세 이동" 자리다.
   * 셀 값을 누르는 `primary` 와 다르다 — 이건 아이콘이 따로 붙는다.
   */
  readonly rowAction?: {
    readonly icon: LucideIcon;
    /** 스크린리더용 이름. 아이콘 단독이라 없으면 빈 버튼이 된다. */
    readonly label: string;
    readonly onAction: (row: T) => void;
  };
  readonly format?: (value: T[keyof T & string], row: T) => ReactNode;
};

/**
 * v3 §ds-03 의 컬럼 배치 순서.
 *
 * `defineColumns` 가 이 순서를 **강제하지는 않는다** — 화면별 정의가 우선이고,
 * 실제로 예외가 있다. 다만 선두 고정열이 흩어진 경우처럼 **확실히 깨진 배치**는 경고한다.
 */
export function defineColumns<T>(columns: readonly ColumnDef<T>[]): readonly ColumnDef<T>[] {
  const firstUnpinned = columns.findIndex((column) => !column.pinned);
  if (firstUnpinned >= 0) {
    const strayPinned = columns.slice(firstUnpinned).find((column) => column.pinned);
    if (strayPinned) {
      warnOnce(
        `columns-stray-pinned:${strayPinned.id}`,
        `고정열 "${strayPinned.id}" 이 선두 연속 구간 밖에 있습니다. 가로 스크롤 시 좌우가 갈라져 읽을 수 없습니다 — 고정할 컬럼을 앞으로 옮기세요.`,
      );
    }
  }
  return columns;
}

/**
 * 편집 가능 컬럼 판정의 단일 정의. `editor` 가 있어야 편집 UI 가 생기고,
 * `editable: false`(`applyLockedColumns` 의 마스킹 잠금 포함)가 그것을 이긴다.
 */
export function isColumnEditable<T>(column: ColumnDef<T>): boolean {
  return column.editor !== undefined && column.editable !== false;
}

/** 선두 고정열의 개수. 렌더러가 `left` 오프셋을 누적할 때 쓴다. */
export function pinnedCount<T>(columns: readonly ColumnDef<T>[]): number {
  let count = 0;
  for (const column of columns) {
    if (!column.pinned) break;
    count += 1;
  }
  return count;
}

/**
 * 사용자가 저장해 둔 그리드 표시 설정. `useGridPreference` 가 읽고 쓰는 값의 형태다.
 *
 * `version` 이 있는 이유: 컬럼 스키마가 바뀌었는데 옛 설정이 살아 있으면
 * **없는 컬럼만 남은 표**가 된다. 불일치하면 조용히 폐기한다.
 */
export type GridPreference = {
  readonly version: 1;
  /** 컬럼 id → 사용자가 조정한 폭(px). */
  readonly widths: Readonly<Record<string, number>>;
  /** 사용자가 숨긴 컬럼 id. */
  readonly hidden: readonly string[];
  /** 사용자가 정한 컬럼 순서(id 목록). 여기에 없는 컬럼은 원래 순서로 뒤에 붙는다. */
  readonly order: readonly string[];
  /**
   * 페이지당 건수. 컬럼 설정과 **같은 저장 항목**에 두는 이유: 키 3축(사용자·메뉴·그리드)이
   * 정확히 같은 스코프라, 따로 키를 파면 같은 축을 두 번 관리하게 된다.
   * 선택 항목이고 `version` 을 올리지 않는다 — 없으면 "앱 기본값"이라는 뜻이며,
   * 이미 저장된 컬럼 설정을 폐기할 이유가 없다. 허용 목록은 앱이 안다(`ui` 는 계약을 모른다).
   */
  readonly pageSize?: number;
};

/**
 * 저장된 표시 설정(순서·숨김)을 컬럼 배열에 적용한다. `applyLockedColumns` 와 같은
 * **컬럼 배열 → 컬럼 배열** 순수 변환이라, 화면이 `DataGrid` 에 넘기기 전에 한 번 통과시킨다.
 * `DataGrid` 는 받은 컬럼만 그린다 — 숨김·순서를 그리드 내부 상태로 들이지 않는다.
 *
 * 지키는 것 3가지:
 * 1. **저장된 순서에 없는 컬럼을 잃지 않는다** — 나중에 추가된 컬럼은 원래 상대 순서로 뒤에 붙는다.
 *    (설정을 저장한 뒤 배포로 컬럼이 늘면 그 컬럼이 영영 안 보이는 사고가 난다.)
 * 2. **`hideable: false` 는 저장값보다 우선한다** — 저장 데이터는 사용자가 손댈 수 있는 곳에 있다.
 * 3. **`pinned` 는 선두 연속 구간으로 되돌린다** — 흩어지면 가로 스크롤 시 좌우가 갈라져 읽을 수 없다.
 */
export function applyColumnPreference<T>(
  columns: readonly ColumnDef<T>[],
  preference: Pick<GridPreference, 'hidden' | 'order'> | null | undefined,
): readonly ColumnDef<T>[] {
  const ordered = preference ? orderColumns(columns, preference.order) : columns;
  const hidden = new Set<string>(preference ? preference.hidden : []);
  /** 설정을 저장할 당시 존재하던 컬럼. 여기 없으면 그 뒤에 추가된 컬럼이다. */
  const known = new Set<string>(preference ? preference.order : []);

  const visible = ordered.filter((column) => {
    if (column.hideable === false) return true;
    // 저장 이후 추가된 컬럼은 저장값이 판단할 수 없다 — 컬럼 정의의 초기 `hidden` 을 따른다.
    // (안 그러면 정의가 감춰 둔 신규 컬럼이 기존 사용자에게만 튀어나온다.)
    if (!known.has(column.id)) return column.hidden !== true;
    return !hidden.has(column.id);
  });

  return liftPinnedToFront(visible);
}

/**
 * 저장된 id 순서를 적용하되, 목록에 없는 컬럼은 원래 상대 순서를 지켜 뒤에 붙인다.
 *
 * 컬럼 설정 모달도 이 함수를 쓴다 — **모달은 숨긴 컬럼까지 포함한 전체 목록**을 같은 순서로
 * 보여줘야 해서 `applyColumnPreference`(숨김을 제거한다)를 그대로 쓸 수 없다.
 */
export function orderColumns<T>(
  columns: readonly ColumnDef<T>[],
  order: readonly string[],
): readonly ColumnDef<T>[] {
  if (order.length === 0) return columns;

  const byId = new Map(columns.map((column) => [column.id as string, column]));
  const placed: ColumnDef<T>[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const column = byId.get(id);
    // 저장 이후 사라진 컬럼 id 는 조용히 흘린다 — 그건 정상적인 스키마 변경이다.
    if (!column || seen.has(id)) continue;
    placed.push(column);
    seen.add(id);
  }
  for (const column of columns) {
    if (!seen.has(column.id)) placed.push(column);
  }
  return placed;
}

/** 고정열이 선두 연속 구간을 벗어났으면 앞으로 끌어올린다(상대 순서는 유지). */
function liftPinnedToFront<T>(columns: readonly ColumnDef<T>[]): readonly ColumnDef<T>[] {
  const firstUnpinned = columns.findIndex((column) => !column.pinned);
  if (firstUnpinned < 0) return columns;

  const stray = columns.slice(firstUnpinned).find((column) => column.pinned);
  if (!stray) return columns;

  warnOnce(
    `preference-stray-pinned:${stray.id}`,
    `저장된 컬럼 순서가 고정열 "${stray.id}" 을 선두 연속 구간 밖으로 밀어냈습니다. 가로 스크롤 시 좌우가 갈라지므로 앞으로 되돌립니다.`,
  );
  return [
    ...columns.filter((column) => column.pinned),
    ...columns.filter((column) => !column.pinned),
  ];
}

/**
 * 마스킹으로 잠긴 컬럼의 `editable` 을 **컬럼 정의보다 우선해** false 로 덮어쓴다.
 *
 * 근거: `PersonalInfoMaskingConfig.java:48-49` 에 기록된 실제 사고 —
 * 수신자 설정 모달이 마스킹된 값(`a***@b.com`)을 그대로 저장해 **실제 주소가 파괴**됐다.
 *
 * ⚠️ 이건 UX 방어일 뿐이다. **진짜 방어선은 서버가 저장 요청에서 잠긴 컬럼을 제거하는 것**이고,
 *    클라이언트를 신뢰하지 않는다는 원칙은 그대로다.
 */
export function applyLockedColumns<T>(
  columns: readonly ColumnDef<T>[],
  lockedColumns: readonly string[],
): readonly ColumnDef<T>[] {
  if (lockedColumns.length === 0) return columns;
  const locked = new Set(lockedColumns);

  return columns.map((column) => (locked.has(column.id) ? { ...column, editable: false } : column));
}
