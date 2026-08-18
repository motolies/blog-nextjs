'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { FieldViewText, useFieldControl } from './field';
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
  readonly disabled?: boolean;
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
  disabled,
  invalid,
  size,
  id,
  className,
  matchTriggerWidth = true,
}: MultiSelectProps) {
  const field = useFieldControl({ id, invalid, size });
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

  const searchable = options.length > searchThreshold;
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectable = useMemo(() => options.filter((option) => !option.disabled), [options]);
  const allSelected = selectable.length > 0 && selectable.every((o) => selectedSet.has(o.value));

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword === '') return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.value.toLowerCase().includes(keyword),
    );
  }, [options, query]);

  /**
   * 키보드가 도는 행 목록 — 전체 토글이 있으면 0번 행이 된다.
   * 검색 중에는 전체 토글을 감춘다: "검색 결과 전체"인지 "목록 전체"인지 모호해진다.
   */
  const rows = useMemo<readonly (SelectOption | typeof ALL_ROW)[]>(() => {
    if (selectAllLabel && query.trim() === '') return [ALL_ROW, ...visible];
    return visible;
  }, [selectAllLabel, query, visible]);

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
      setValue(allSelected ? [] : selectable.map((option) => option.value));
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

  const activeId = activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined;
  const selectedLabels = options
    .filter((option) => selectedSet.has(option.value))
    .map((option) => option.label);

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

  // 폼 수준(mode)과 칸 수준(disabled)의 OR 합성 — edit 복귀 시 칸 수준 상태가 복원된다.
  const effectiveDisabled = disabled || field.mode === 'disabled';

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      {/* 폼 전송용 — 값마다 hidden input 하나. getAll(name) 규약이다.
          disabled 면 내지 않는다 — 네이티브 컨트롤이 FormData 에서 빠지는 규약과 맞춘다. */}
      {name && !effectiveDisabled
        ? value.map((entry) => <input key={entry} type="hidden" name={name} value={entry} />)
        : null}
      <RadixPopover.Trigger
        id={field.id}
        disabled={effectiveDisabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={field['aria-invalid']}
        aria-describedby={field['aria-describedby']}
        className={cn(
          'dl-field flex items-center justify-between gap-1.5 rounded-dl-container text-left',
          FIELD_SIZE_CLASS[field.size],
          open && 'border-dl-primary-hover',
          field.invalid && 'dl-field-error',
          effectiveDisabled && 'dl-field-locked',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
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
            aria-multiselectable
            tabIndex={-1}
            aria-activedescendant={searchable ? undefined : activeId}
            className="max-h-dl-menu-max overflow-y-auto outline-none"
          >
            {rows.length === 0 ? (
              <p className="p-2.5 text-center text-dl-sm text-dl-fg-subtle">{emptyLabel}</p>
            ) : (
              rows.map((row, index) => {
                const isAll = row === ALL_ROW;
                const isSelected = isAll ? allSelected : selectedSet.has(row.value);
                const isDisabled = isAll ? false : Boolean(row.disabled);
                return (
                  /**
                   * listbox 패턴 — 포커스는 검색 입력/리스트에 있고 `aria-activedescendant`
                   * 로 가상 이동한다. 키보드는 컨테이너 `onKeyDown` 이 전부 맡는다.
                   */
                  // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드는 컨테이너 onKeyDown 이 처리한다
                  // biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant 로 가상 포커스를 쓴다
                  <div
                    key={isAll ? ALL_ROW : row.value}
                    id={`${optionIdPrefix}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled || undefined}
                    onClick={() => toggle(row)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 rounded-dl-badge px-4 py-2 text-dl-sm',
                      isSelected ? 'font-semibold text-dl-primary' : 'text-dl-fg',
                      index === activeIndex && 'bg-dl-option-hover',
                      isDisabled && 'cursor-not-allowed text-dl-locked-fg',
                      // 전체 토글은 목록과 선으로 갈라 둔다(QA all-select)
                      isAll && 'border-b border-dl-divider',
                    )}
                  >
                    <span className="truncate">{isAll ? selectAllLabel : row.label}</span>
                    {/* 선택된 항목만 우측 체크(QA .multi-option-item.selected .icon-check) */}
                    {isSelected ? (
                      <span className="flex shrink-0 text-dl-primary">
                        <Icon icon={Check} className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
