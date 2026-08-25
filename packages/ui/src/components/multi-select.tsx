'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { Fragment, type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import { OptionGroupHeader } from './option-group-header';
import { groupHeaderBefore } from './optionGroups';
import type { SelectOption } from './select';

/**
 * 멀티 셀렉트 — QA `multi-select`: 개수 배지 + 라벨 트리거, 옵션 우측 체크 아이콘.
 *
 * `Select` 와 같은 골격(Popover + 자체 listbox + aria-activedescendant)이다.
 * 다른 점 셋:
 *   · 항목을 골라도 **패널이 닫히지 않는다** — 여러 개를 연달아 고르는 컨트롤이다.
 *   · 트리거가 개수 배지(`n`)를 단다 — 0개면 배지를 감추고 placeholder 만 남긴다(QA).
 *   · `selectAllLabel` 을 주면 맨 위에 전체 토글 항목이 생긴다(QA "전체").
 *
 * 대량 목록(100개 중 20개)에서는 트리거가 잘려 **무엇을 골랐는지 확인할 길이 없고**
 * 하나를 빼려면 목록에서 그 항목을 다시 찾아야 한다. 그래서 하나라도 고르면 패널 안에
 * **선택 요약(칩 + ✕)** 이 붙는다 — 고르는 중에 보이고, 거기서 뺀다.
 *
 * 한때 `summaryThreshold`(5) 를 두어 소량 선택에서는 요약을 감췄다 — 목록의 체크와 같은
 * 정보가 두 번 나온다는 이유였다. 그런데 문턱이 있으면 **6개째에서 갑자기 패널이 자라**
 * 규칙을 모르는 사용자에게는 고장으로 읽히고, 5개 이하라도 라벨이 길면 트리거는 이미
 * 잘려 "무엇을 골랐는지"는 요약이 있어야 보였다. 그래서 문턱을 없애고 항상 낸다.
 *
 * 폼 전송: `name` 이 있으면 값마다 hidden input 을 낸다 —
 * `formData.getAll(name)` 으로 읽는 HTML 폼의 표준 다중값 규약이다.
 */

/** 전체 토글 행의 내부 키. 옵션 value 와 충돌하지 않도록 심볼릭한 문자열을 쓴다. */
const ALL_ROW = '__dl-multi-select-all__';

export type MultiSelectProps = {
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (value: readonly string[]) => void;
  /** 있으면 값마다 hidden input 을 낸다 — `formData.getAll(name)` 로 읽는다. */
  readonly name?: string;
  readonly options: readonly SelectOption[];
  /** 0개 선택일 때 트리거 문구 — "전체" 또는 "선택". 뜻이 달라 호출부가 정한다. */
  readonly placeholder: string;
  /** 있으면 맨 위에 전체 선택/해제 토글 항목이 생긴다(QA "전체"). */
  readonly selectAllLabel?: string;
  /** 이 개수를 넘으면 검색형이 된다. */
  readonly searchThreshold?: number;
  readonly searchPlaceholder?: string;
  readonly emptyLabel?: string;
  /** 요약 헤더 문구 — 개수는 배지가 낸다. `ui` 는 사전을 모른다 — 주입받는다. */
  readonly summaryLabel?: string;
  readonly clearAllLabel?: string;
  /** 검색 중 전체 토글 문구 — 사정권이 목록 전체가 아니라 검색 결과임을 밝힌다. */
  readonly selectFilteredLabel?: string;
  /** 칩 제거 버튼의 접근성 이름. */
  readonly removeLabel?: (label: string) => string;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 값 지우기(×) — 선택이 있으면 캐럿 왼쪽에 뜨고 **전체 해제**한다(`clearAllLabel` 이 이름). */
  readonly clearable?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  readonly id?: string;
  readonly className?: string;
  readonly matchTriggerWidth?: boolean;
};

export function MultiSelect({
  value: valueProp,
  defaultValue = [],
  onValueChange,
  name,
  options,
  placeholder,
  selectAllLabel,
  searchThreshold = 10,
  searchPlaceholder = '검색',
  emptyLabel = '검색 결과가 없습니다',
  summaryLabel = '선택',
  clearAllLabel = '전체 해제',
  selectFilteredLabel = '검색 결과 전체',
  removeLabel = (label) => `${label} 제거`,
  mode,
  clearable,
  invalid,
  size,
  id,
  className,
  matchTriggerWidth = true,
}: MultiSelectProps) {
  const field = useFieldControl({ id, invalid, size, mode });
  const listId = useId();
  const optionIdPrefix = useId();

  const [value, setValue] = useControllableState<readonly string[]>(
    valueProp,
    defaultValue,
    onValueChange,
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const searchable = options.length > searchThreshold;
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectable = useMemo(() => options.filter((option) => !option.disabled), [options]);

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword === '') return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.value.toLowerCase().includes(keyword),
    );
  }, [options, query]);

  const filtering = query.trim() !== '';

  /** 전체 토글의 사정권 — 검색 중이면 검색 결과 안의 선택 가능 항목만. */
  const allScope = useMemo(
    () => (filtering ? visible.filter((option) => !option.disabled) : selectable),
    [filtering, visible, selectable],
  );
  const allScopeSelected =
    allScope.length > 0 && allScope.every((option) => selectedSet.has(option.value));

  /**
   * 키보드가 도는 행 목록 — 전체 토글이 있으면 0번 행이 된다.
   *
   * 한때 검색 중에는 전체 토글을 감췄다 — "검색 결과 전체"인지 "목록 전체"인지 모호하다는
   * 이유였다. 그 모호함은 **라벨(`selectFilteredLabel`)과 개수 배지로 사정권을 밝히면**
   * 성립하지 않는데, 감춰 두면 100개를 검색으로 8개까지 좁혀 놓고도 한 번에 담을 길이
   * 없어 **정작 대량 목록에서 전체 토글이 가장 쓸모없어졌다.** 그래서 감추지 않고 밝힌다.
   * 사정권이 비면 내지 않는다 — 고를 것이 하나도 없는 "전체 [0]" 행은 뜻이 없다.
   * `visible` 이 아니라 `allScope` 로 판정한다: 검색 결과가 전부 잠긴 항목이면
   * 보이는 행은 있어도 토글이 할 일은 없다.
   */
  const rows = useMemo<readonly (SelectOption | typeof ALL_ROW)[]>(() => {
    if (!selectAllLabel || allScope.length === 0) return visible;
    return [ALL_ROW, ...visible];
  }, [selectAllLabel, allScope, visible]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setQuery('');
    setActiveIndex(rows.length > 0 ? 0 : -1);
  };

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  /** 항목 토글 — 패널은 닫지 않는다. 닫기는 바깥 클릭·Esc 의 몫이다. */
  const toggle = (row: SelectOption | typeof ALL_ROW) => {
    if (row === ALL_ROW) {
      // 값 배열을 통째로 갈아치우지 않는다 — 사정권이 검색 결과면 부분집합이라,
      // 덮어쓰면 **검색 밖에서 고른 값이 조용히 사라진다.** 가감으로만 바꾼다.
      if (allScopeSelected) {
        const scope = new Set(allScope.map((option) => option.value));
        setValue(value.filter((entry) => !scope.has(entry)));
        return;
      }
      setValue([
        ...value,
        ...allScope.filter((o) => !selectedSet.has(o.value)).map((o) => o.value),
      ]);
      return;
    }
    if (row.disabled) return;
    setValue(
      selectedSet.has(row.value)
        ? value.filter((entry) => entry !== row.value)
        : [...value, row.value],
    );
  };

  const moveActive = (delta: number) => {
    if (rows.length === 0) return;
    let next = activeIndex < 0 ? (delta > 0 ? -1 : rows.length) : activeIndex;
    for (let step = 0; step < rows.length; step += 1) {
      next = (next + delta + rows.length) % rows.length;
      const row = rows[next];
      if (row === ALL_ROW || !row?.disabled) break;
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
      setActiveIndex(rows.length - 1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const row = rows[activeIndex];
      if (row !== undefined) toggle(row);
    }
  };

  /**
   * 포커스를 패널 안(검색 입력 우선, 없으면 리스트)으로 되돌린다.
   *
   * 요약 영역의 버튼은 **자기가 눌리면 자기가 사라진다** — 칩 ✕ 는 그 칩을 지우고,
   * 전체 해제는 요약을 통째로 걷어낸다. 사라진 버튼의 포커스는 body 로 날아가고
   * Radix Popover 는 포커스가 밖으로 나가면 닫는다 — 하나 지웠는데 패널이 닫힌다.
   * 상태 반영이 끝난 뒤 되돌려야 하므로 microtask 로 미룬다.
   */
  const restorePanelFocus = () => {
    queueMicrotask(() => (searchRef.current ?? listRef.current)?.focus());
  };

  const removeEntry = (entry: string) => {
    setValue(value.filter((item) => item !== entry));
    restorePanelFocus();
  };

  const clearAll = () => {
    setValue([]);
    restorePanelFocus();
  };

  /**
   * 요약 영역에서 Enter·Space 만 막는다 — 키 처리는 전부 `Popover.Content` 레벨이라
   * 칩 ✕ 에서 Enter 를 누르면 **칩 제거와 활성 행 토글이 둘 다** 돈다.
   * Esc·화살표는 통과시킨다 — 요약 위에서도 패널 닫기와 목록 이동은 살아 있어야 한다.
   */
  const stopEnterFromList = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  };

  const activeId = activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined;
  const selectedLabels = options
    .filter((option) => selectedSet.has(option.value))
    .map((option) => option.label);

  /**
   * 칩 목록 — **value 순서**로 돌린다. `options.filter(selected)` 로 만들면
   * 대응 option 이 아직 없는 값(비동기 로딩)이 칩에서 사라져
   * **화면에 없는데 폼에는 실리는 유령 값**이 된다 — 뺄 방법이 없다.
   * 아래 view 모드가 raw value 를 남기는 것과 같은 규약이다.
   */
  const selectedEntries = useMemo(
    () =>
      value.map((entry) => {
        const option = options.find((o) => o.value === entry);
        return { value: entry, label: option?.label ?? entry, locked: Boolean(option?.disabled) };
      }),
    [value, options],
  );

  if (field.mode === 'view') {
    // 선택 순서가 아니라 value 순서로 그린다(트리거의 selectedLabels 와 달리 누락 없이) —
    // 대응 option 이 아직 없는 값은 raw value 로 남긴다. 빈칸이면 데이터 소실로 읽힌다.
    return (
      <FieldViewText size={field.size}>
        {value.length === 0
          ? null
          : value
              .map((entry) => options.find((option) => option.value === entry)?.label ?? entry)
              .join(', ')}
      </FieldViewText>
    );
  }

  // 지우기는 편집 가능한 상태에서만 뜬다 — 비활성 칸의 값은 지울 수 있는 값이 아니다.
  const showClear = clearable === true && !field.state.disabled && value.length > 0;

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
        'dl-field flex items-center justify-between gap-1.5 rounded-dl-container text-left',
        FIELD_SIZE_CLASS[field.size],
        open && 'border-dl-primary-hover',
        field.invalid && 'dl-field-error',
        field.state.lockClass,
        // ⚠️ showClear 라고 트리거에 pr 을 더하지 않는다 — 캐럿까지 밀린다(Select 와 같은 실측 버그).
        // × 는 캐럿 왼쪽 허공(right-9)에 겹쳐 올리고 라벨 영역만 pr 로 일찍 자른다.
        // clearable 이면 래퍼 span 이 루트다 — 폭 지정(className)은 래퍼가 갖는다(Select 와 같은 버그 수정).
        clearable ? undefined : className,
      )}
    >
      <span className={cn('flex min-w-0 items-center gap-2', showClear && 'pr-6')}>
        {/* QA multi-badge: 0개면 감춘다 */}
        {value.length > 0 ? (
          <span className="shrink-0 rounded-dl-container bg-dl-tonal px-2 py-0.5 text-dl-xs font-semibold text-dl-tonal-fg">
            {value.length}
          </span>
        ) : null}
        <span className={cn('truncate', value.length === 0 && 'text-dl-field-placeholder')}>
          {value.length === 0 ? placeholder : selectedLabels.join(', ')}
        </span>
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
      {/* 폼 전송용 — 값마다 hidden input 하나. getAll(name) 규약이다.
          submits(edit 모드)가 아니면 내지 않는다 — 네이티브 컨트롤이 FormData 에서 빠지는 규약과 맞춘다. */}
      {name && field.state.submits
        ? value.map((entry) => <input key={entry} type="hidden" name={name} value={entry} />)
        : null}
      {clearable ? (
        <span className={cn('relative block w-full', className)}>
          {trigger}
          {showClear ? (
            // 트리거(button) 안에 버튼을 중첩할 수 없어 형제로 겹쳐 올린다 — 캐럿 왼쪽 자리다.
            <button
              type="button"
              aria-label={clearAllLabel}
              onClick={() => {
                setValue([]);
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
                  ref={searchRef}
                  // biome-ignore lint/a11y/noAutofocus: 패널 안이고 명세가 규정한 동작이다
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    // 활성 행은 **첫 실제 옵션**이다 — 전체 토글이 있으면 그게 0번이라,
                    // 여기서 0 을 주면 검색어를 치고 Enter 를 누른 순간 검색 결과가 통째로 담긴다.
                    // 검색 직후 Enter 는 "첫 결과 하나"가 보편적 기대다.
                    setActiveIndex(selectAllLabel ? 1 : 0);
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

          {/* 선택 요약 — 리스트가 자체 스크롤 컨테이너라 그 **바깥**에 두면 sticky 없이 고정된다.
              0개면 내지 않는다 — 빈 칩 영역과 지울 것 없는 "전체 해제"는 뜻이 없다(트리거가 0개 배지를 감추는 규약과 같다). */}
          {value.length > 0 ? (
            // biome-ignore lint/a11y/noStaticElementInteractions: 키 입력의 주체는 안쪽 버튼이다 — 이 래퍼는 Enter 버블링만 끊는다
            <div className="mb-1 border-dl-divider border-b pb-1.5" onKeyDown={stopEnterFromList}>
              <div className="flex items-center justify-between gap-2 px-2 py-1">
                <span className="flex items-center gap-1.5 text-dl-fg-muted text-dl-xs">
                  <span className="rounded-dl-container bg-dl-tonal px-2 py-0.5 font-semibold text-dl-tonal-fg text-dl-xs">
                    {value.length}
                  </span>
                  {summaryLabel}
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="shrink-0 rounded-dl-badge px-1.5 py-0.5 text-dl-fg-muted text-dl-xs hover:bg-dl-option-hover hover:text-dl-fg"
                >
                  {clearAllLabel}
                </button>
              </div>
              <div className="flex max-h-dl-chips-max flex-wrap gap-1 overflow-y-auto px-2 pb-1">
                {selectedEntries.map((entry) => (
                  <span
                    key={entry.value}
                    className="inline-flex max-w-full items-center gap-1 rounded-dl-badge bg-dl-tonal py-0.5 pr-1 pl-2 font-semibold text-dl-tonal-fg text-dl-xs"
                  >
                    <span className="truncate">{entry.label}</span>
                    <button
                      type="button"
                      aria-label={removeLabel(entry.label)}
                      // 잠긴 옵션은 목록에서도 못 고르니 칩에서도 못 뺀다 — 두 경로가 갈리면 안 된다.
                      disabled={entry.locked}
                      onClick={() => removeEntry(entry.value)}
                      className="flex shrink-0 rounded-dl-badge p-0.5 hover:bg-dl-option-hover disabled:cursor-not-allowed"
                    >
                      <Icon icon={X} className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable
            tabIndex={-1}
            aria-activedescendant={searchable ? undefined : activeId}
            className="max-h-dl-menu-max overflow-y-auto outline-none"
          >
            {rows.length === 0 ? (
              <p className="p-2.5 text-center text-dl-fg-subtle text-dl-sm">{emptyLabel}</p>
            ) : (
              rows.map((row, index) => {
                const isAll = row === ALL_ROW;
                const isSelected = isAll ? allScopeSelected : selectedSet.has(row.value);
                const isDisabled = isAll ? false : Boolean(row.disabled);
                // 그룹 헤더 — 전체 토글 행(ALL_ROW)은 그룹 비교에서 "그룹 없음"으로 친다.
                const previousRow = rows[index - 1];
                const groupHeader = isAll
                  ? null
                  : groupHeaderBefore(
                      row,
                      previousRow === undefined || previousRow === ALL_ROW
                        ? undefined
                        : previousRow,
                    );
                return (
                  <Fragment key={isAll ? ALL_ROW : row.value}>
                    {groupHeader !== null ? (
                      <OptionGroupHeader
                        label={groupHeader}
                        // 전체 토글 행 뒤에는 긋지 않는다 — 그 행의 border-b 와 겹친다
                        divided={previousRow !== undefined && previousRow !== ALL_ROW}
                      />
                    ) : null}
                    {/**
                     * listbox 패턴 — 포커스는 검색 입력/리스트에 있고 `aria-activedescendant`
                     * 로 가상 이동한다. 키보드는 컨테이너 `onKeyDown` 이 전부 맡는다.
                     */}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: 키보드는 컨테이너 onKeyDown 이 처리한다 */}
                    {/* biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant 로 가상 포커스를 쓴다 */}
                    <div
                      id={`${optionIdPrefix}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={isDisabled || undefined}
                      onClick={() => toggle(row)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 rounded-dl-badge py-2 text-dl-sm',
                        // 그룹에 속한 옵션은 들여쓴다(Select 와 같은 단차). 전체 토글 행은 그룹 밖이다.
                        !isAll && row.group !== undefined ? 'pr-4 pl-7' : 'px-4',
                        isSelected ? 'font-semibold text-dl-primary-ink' : 'text-dl-fg',
                        index === activeIndex && 'bg-dl-option-hover',
                        isDisabled && 'cursor-not-allowed text-dl-locked-fg',
                        // 전체 토글은 목록과 선으로 갈라 둔다(QA all-select)
                        isAll && 'border-dl-divider border-b',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">
                          {isAll ? (filtering ? selectFilteredLabel : selectAllLabel) : row.label}
                        </span>
                        {/* 검색 중 전체 토글 — 사정권이 "검색 결과 n개"임을 개수로 못박는다.
                          이 배지가 있어서 "목록 전체인지 검색 결과인지" 모호함이 성립하지 않는다. */}
                        {isAll && filtering ? (
                          <span className="shrink-0 rounded-dl-badge bg-dl-tonal px-1.5 py-0.5 font-semibold text-dl-tonal-fg text-dl-xs">
                            {allScope.length}
                          </span>
                        ) : null}
                      </span>
                      {/* 선택된 항목만 우측 체크(QA .multi-option-item.selected .icon-check) */}
                      {isSelected ? (
                        <span className="flex shrink-0 text-dl-primary-ink">
                          <Icon icon={Check} className="size-3.5" />
                        </span>
                      ) : null}
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
