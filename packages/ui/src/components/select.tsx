'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import {
  Fragment,
  type KeyboardEvent,
  type Ref,
  type SelectHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { warnOnce } from '../lib/warnOnce';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import { OptionGroupHeader } from './option-group-header';
import { groupHeaderBefore } from './optionGroups';

/**
 * 셀렉트 — v3 §ds-04.
 *
 * **Radix `Select` 를 쓰지 않는 이유**: v3 는 "항목 10개 초과면 패널 최상단에 검색 입력을
 * 고정한다"고 규정하는데, Radix Select 의 typeahead 가 그 타이핑을 가로챈다.
 * 그렇다고 ≤10 은 네이티브, >10 은 커스텀으로 나누면 임계값 근처에서
 * 키보드 동작이 **사용자 몰래** 바뀐다. 하나로 만들고 검색 입력만 조건부로 낸다.
 *
 * **트리거가 `<button>` 이지 `<input>` 이 아니다** — v3: "셀렉트 트리거(값 칸)에는
 * 직접 입력할 수 없다 · 값은 목록에서 고른 것만 들어간다 — 코드값 오타 방지".
 * 타입 차원에서 성립한다.
 */

export type SelectOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /**
   * 옵션 그룹 라벨(이미 번역된 값) — 그룹이 갈리는 자리에 헤더 줄이 끼워진다.
   * **같은 그룹은 연속 배치가 전제다** — 흩어져 있으면 헤더가 반복된다(순서는 호출부 몫).
   * 헤더는 시각 전용이라 키보드 이동·검색 인덱스에 끼어들지 않는다(`optionGroups.ts`).
   */
  readonly group?: string;
};

export type SelectProps = {
  /** controlled 로 쓸 때. 생략하면 `defaultValue` 로 시작하는 내부 상태가 된다. */
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /**
   * 있으면 hidden input 을 함께 낸다 — `new FormData(form)` 로 값이 읽힌다.
   *
   * 트리거가 `<button>` 이라 폼 값이 없는데, 이 프로젝트의 검색 폼은 FormData 로 읽는다.
   * 이게 없으면 검색 조건마다 useState 를 만들게 되고, 그 순간 "검색 상태의 단일 진실
   * 소스는 URL"이라는 규칙이 깨진다.
   */
  readonly name?: string;
  readonly options: readonly SelectOption[];
  /**
   * 미선택 문구. v3 는 두 갈래로 나눈다 —
   * **"전체"**(이 조건으로 거르지 않음) vs **"선택"**(아직 고르지 않음).
   * 뜻이 다르므로 `ui` 가 정하지 않고 호출부가 넘긴다.
   */
  readonly placeholder: string;
  /** 이 개수를 넘으면 검색형이 된다. v3 규칙은 10 이다. */
  readonly searchThreshold?: number;
  /** 검색 입력의 안내문구. `ui` 는 사전을 모른다 — 주입받는다. */
  readonly searchPlaceholder?: string;
  /** 검색 결과가 없을 때 문구. */
  readonly emptyLabel?: string;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  readonly id?: string;
  /**
   * 값 지우기 — "전체" 옵션이 따로 없는 필터에 쓴다. 켜면 두 경로가 함께 열린다:
   * 트리거의 ×(값이 있으면 캐럿 왼쪽) + **선택된 옵션 재클릭 = 선택 취소**.
   * "값을 비울 수 있는가"는 축 하나여야 한다 — 경로마다 다른 prop 이면 언젠가 어긋난다.
   */
  readonly clearable?: boolean;
  /** × 버튼의 접근성 이름. `ui` 는 사전을 모른다 — 필요하면 번역을 주입한다. */
  readonly clearLabel?: string;
  readonly className?: string;
  /** 목록 폭이 트리거보다 넓어야 할 때만 끈다(코드+국가명처럼 긴 항목). */
  readonly matchTriggerWidth?: boolean;
};

export function Select({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  name,
  options,
  placeholder,
  searchThreshold = 10,
  searchPlaceholder = '검색',
  emptyLabel = '검색 결과가 없습니다',
  mode,
  invalid,
  size,
  id,
  clearable,
  clearLabel = '지우기',
  className,
  matchTriggerWidth = true,
}: SelectProps) {
  const field = useFieldControl({ id, invalid, size, mode });
  const listId = useId();
  const optionIdPrefix = useId();

  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const listRef = useRef<HTMLDivElement>(null);

  const searchable = options.length > searchThreshold;
  const selected = options.find((option) => option.value === value) ?? null;

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword === '') return options;
    // 코드로도 찾는다 — 국가 코드처럼 라벨이 `[KR]South Korea` 인 목록이 있다.
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.value.toLowerCase().includes(keyword),
    );
  }, [options, query]);

  /** 열 때마다 검색어를 초기화하고 고른 항목을 활성으로 둔다(v3 §ds-04). */
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setQuery('');
    setActiveIndex(options.findIndex((option) => option.value === value));
  };

  // 활성 항목이 화면 밖이면 끌어온다. 250개짜리 국가 목록에서 이게 없으면 매번 처음부터 찾는다.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const commit = (option: SelectOption) => {
    if (option.disabled) return;
    // clearable 이면 선택된 옵션 재클릭이 곧 선택 취소다 — 트리거 × 와 같은 축이라
    // 마우스(클릭)·키보드(Enter) 어느 경로로도 같은 해제가 성립한다.
    if (clearable === true && option.value === value) {
      setValue('');
      field.notifyDirty();
      setOpen(false);
      return;
    }
    setValue(option.value);
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    if (visible.length === 0) return;
    const activeOption = activeIndex < 0 ? undefined : visible[activeIndex];
    const current = activeOption === undefined ? -1 : visible.indexOf(activeOption);
    const start = current < 0 ? (delta > 0 ? -1 : visible.length) : current;
    let next = start;
    // 비활성 항목은 건너뛴다. 전부 비활성이면 한 바퀴 돌고 멈춘다.
    for (let step = 0; step < visible.length; step += 1) {
      next = (next + delta + visible.length) % visible.length;
      if (!visible[next]?.disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(visible.length - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const option = visible[activeIndex];
      if (option) commit(option);
    }
  };

  const activeId = activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined;

  if (field.mode === 'view') {
    // 라벨을 스스로 유도한다(selected.label). 값은 있는데 대응 option 이 아직 없으면
    // (비동기 로딩) raw value 를 그린다 — 빈칸이면 데이터 소실로 읽힌다.
    // 미선택이면 빈칸 — placeholder 는 "고르라"는 입력 신호라 조회 화면에 남으면 거짓말이 된다.
    return (
      <FieldViewText size={field.size}>
        {value === '' ? null : (selected?.label ?? value)}
      </FieldViewText>
    );
  }

  // 지우기는 편집 가능한 상태에서만 뜬다 — 비활성 칸의 값은 지울 수 있는 값이 아니다.
  const showClear = clearable === true && !field.state.disabled && value !== '';

  const trigger = (
    <RadixPopover.Trigger
      id={field.id}
      disabled={field.state.disabled}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      {...field.state.dataProps}
      className={cn(
        // 트리거만 radius 8 이다 — QA 가 입력(6)과 셀렉트(8)를 달리 그린다. 실측이 그렇다.
        'dl-field flex items-center justify-between gap-1.5 rounded-dl-container text-left',
        FIELD_SIZE_CLASS[field.size],
        open && 'border-dl-primary-hover',
        field.invalid && 'dl-field-error',
        field.state.lockClass,
        // ⚠️ showClear 라고 트리거에 pr 을 더하지 않는다 — 캐럿이 flex 자식이라 패딩이
        // 캐럿까지 밀어 "clearable 을 켜면 화살표가 왼쪽으로 가는" 오동작이 된다(실측).
        // 캐럿은 제자리(content 우측)에 두고, × 는 그 왼쪽 허공(right-9)에 겹쳐 올리며,
        // 라벨 스팬만 pr 로 일찍 잘라 × 밑으로 못 들어가게 한다.
        // clearable 이면 래퍼 span 이 루트다 — 폭 지정(className)은 래퍼가 갖고 트리거는
        // dl-field(w-full)로 래퍼를 채운다. 트리거에 두면 × 의 위치 기준(래퍼 w-full)과
        // 트리거 폭이 어긋나 × 가 트리거 밖 허공에 그려진다(실측 버그).
        clearable ? undefined : className,
      )}
    >
      <span
        className={cn(
          'truncate',
          selected ? undefined : 'text-dl-field-placeholder',
          // × (right-9, 36~56px 지점) 밑으로 라벨이 들어가지 않게 라벨만 일찍 자른다.
          showClear && 'pr-6',
        )}
      >
        {selected ? selected.label : placeholder}
      </span>
      <span
        className={cn(
          'flex shrink-0 text-dl-field-caret transition-transform',
          open && 'rotate-180',
        )}
      >
        <Icon icon={ChevronDown} size="sm" />
      </span>
    </RadixPopover.Trigger>
  );

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      {/* 폼 전송용. 트리거가 button 이라 이게 없으면 FormData 에 값이 안 실린다.
          submits(edit 모드)가 아니면 내지 않는다 — 네이티브 컨트롤이 FormData 에서
          빠지는 규약과 맞춘다. 무조건부면 값이 몰래 나간다. */}
      {name && field.state.submits ? <input type="hidden" name={name} value={value} /> : null}
      {clearable ? (
        <span className={cn('relative block w-full', className)}>
          {trigger}
          {showClear ? (
            // 트리거(button) 안에 버튼을 중첩할 수 없어 형제로 겹쳐 올린다 — 캐럿 왼쪽 자리다.
            <button
              type="button"
              aria-label={clearLabel}
              onClick={() => {
                setValue('');
                field.notifyDirty();
              }}
              className="absolute inset-y-0 right-9 my-auto flex size-5 items-center justify-center rounded-dl-badge text-dl-field-caret hover:bg-dl-option-hover hover:text-dl-fg"
            >
              <Icon icon={X} className="size-3" />
            </button>
          ) : null}
        </span>
      ) : (
        trigger
      )}

      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={4}
          align="start"
          onKeyDown={handleKeyDown}
          // 검색형이 아니면 Radix 가 첫 요소로 포커스를 옮기려 하는데,
          // 우리는 리스트에 가상 포커스(aria-activedescendant)를 쓰므로 직접 잡는다.
          onOpenAutoFocus={(event) => {
            if (searchable) return;
            event.preventDefault();
            listRef.current?.focus();
          }}
          className={cn(
            'z-[var(--dl-z-menu)] rounded-dl-container border border-dl-field-border bg-dl-surface p-1 shadow-dl-menu',
            matchTriggerWidth && 'w-[var(--radix-popover-trigger-width)]',
            'min-w-40',
          )}
        >
          {searchable ? (
            <div className="sticky top-0 z-[1] mb-1 border-b border-dl-divider bg-dl-surface pb-1.5">
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-dl-locked-icon">
                  <Icon icon={Search} size="sm" />
                </span>
                <input
                  // 열 때마다 자동 포커스 — 250개짜리 목록에서 손이 바로 검색으로 간다.
                  // biome-ignore lint/a11y/noAutofocus: 패널 안이고 명세가 규정한 동작이다
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  aria-controls={listId}
                  aria-activedescendant={activeId}
                  // 패널 내부 검색 입력은 트리거 size 와 무관하게 sm 고정 — 드롭다운 내부 규격은 QA 값이다.
                  className="dl-field dl-size-sm pl-8"
                />
              </span>
            </div>
          ) : null}

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={searchable ? undefined : activeId}
            className="max-h-dl-menu-max overflow-y-auto outline-none"
          >
            {visible.length === 0 ? (
              <p className="p-2.5 text-center text-dl-sm text-dl-fg-subtle">{emptyLabel}</p>
            ) : (
              visible.map((option, index) => {
                const isSelected = option.value === value;
                // 그룹 헤더는 시각 전용 — 옵션 인덱스(activeIndex·activedescendant)에 끼지 않는다.
                const groupHeader = groupHeaderBefore(option, visible[index - 1]);
                return (
                  <Fragment key={option.value}>
                    {groupHeader !== null ? (
                      <OptionGroupHeader label={groupHeader} divided={index > 0} />
                    ) : null}
                    {/**
                     * listbox 패턴에서 option 은 **focusable 이 아니다** — 포커스는 검색 입력이나
                     * 리스트에 있고 `aria-activedescendant` 로 가상 이동한다. 키보드 처리는
                     * 컨테이너의 `onKeyDown` 이 전부 맡는다(↑↓ Home End Enter Esc).
                     * 두 규칙은 각 요소가 자기 키 핸들러를 갖는 형태만 정적으로 인식한다.
                     */}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: 키보드는 컨테이너 onKeyDown 이 처리한다 */}
                    {/* biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant 로 가상 포커스를 쓴다 */}
                    <div
                      id={`${optionIdPrefix}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      onClick={() => commit(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex cursor-pointer items-center rounded-dl-badge py-2 text-dl-sm',
                        // 그룹에 속한 옵션은 들여쓴다 — 헤더가 상위 계층으로 읽히는 근거는 이 단차다.
                        option.group !== undefined ? 'pr-4 pl-7' : 'px-4',
                        // QA 옵션 상태: 고른 항목 = 흰 배경 + primary 글자 · hover = gray-f7 ·
                        // 누르는 중 = primary-active 채움 + 흰 글자
                        isSelected ? 'font-semibold text-dl-primary-ink' : 'text-dl-fg',
                        index === activeIndex && 'bg-dl-option-hover',
                        'active:bg-dl-primary-active active:text-dl-primary-fg',
                        option.disabled && 'cursor-not-allowed text-dl-locked-fg',
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                    </div>
                  </Fragment>
                );
              })
            )}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export type NativeSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'size' | 'disabled'
> & {
  ref?: Ref<HTMLSelectElement>;
  /** 폼 모드 — view 는 미지원(경고 + 편집 렌더 유지). 조회가 필요하면 `Select` 를 쓴다. */
  readonly mode?: FieldMode;
  readonly invalid?: boolean;
  /** 5단 사이즈. 네이티브 `size`(표시 행 수)는 쓰지 않는 속성이라 이름을 가져온다. */
  readonly size?: ControlSize;
};

/**
 * 네이티브 select — **JS 없이 form POST 가 필요한 곳의 탈출구**로만 남긴다.
 *
 * ⚠️ 화살표를 `background-image` data-URI 로 그리지 않는다(그러면 그 안의 색이
 * 토큰을 따라가지 못한다). `appearance` 를 남겨 두어 OS 기본 화살표를 쓴다 —
 * 커스텀 `Select` 와 생김새가 다르므로, 리치한 화면에서는 그쪽을 쓴다.
 */
export function NativeSelect({
  className,
  mode,
  invalid,
  size,
  id,
  children,
  ...props
}: NativeSelectProps) {
  const field = useFieldControl({ id, invalid, size, mode });

  /**
   * view 를 유도할 수 없다 — 선택 라벨이 children `<option>` 안에 있어 탐색 없이는 못 꺼낸다.
   * 조용히 빈칸을 그리는 대신 **경고 + edit 렌더 유지**. 조회 모드가 필요하면 `Select` 를 쓴다.
   */
  if (field.mode === 'view') {
    warnOnce(
      `native-select-view:${id ?? field.id ?? 'unknown'}`,
      'NativeSelect 는 view 모드를 지원하지 않습니다 — 조회 모드가 필요한 화면에서는 Select 를 쓰세요.',
    );
  }

  return (
    <select
      className={cn(
        'dl-field pr-6',
        FIELD_SIZE_CLASS[field.size],
        field.invalid && 'dl-field-error',
        // 잠금 배색은 다른 컨트롤과 같은 유틸을 입는다 — disabled 인데 편집 칸처럼 보이면 안 된다.
        field.state.lockClass,
        className,
      )}
      id={field.id}
      disabled={field.state.disabled}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      {...field.state.dataProps}
      {...props}
    >
      {children}
    </select>
  );
}
