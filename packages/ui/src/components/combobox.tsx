'use client';

import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { type KeyboardEvent, type ReactNode, useId, useMemo, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';

/**
 * 콤보박스(피커형) — 원본 @deleo/ui 에는 없던 blog 추가 컴포넌트.
 *
 * `Select` 와 다른 점: **값을 고정하지 않는다.** 고르면 `onPick` 콜백이 불리고 닫힐 뿐,
 * 트리거는 항상 같은 문구를 보여준다 — "칩 목록에 추가", "게시글 선택" 처럼 선택 결과를
 * 앱이 다른 자리(칩·목록)에 그리는 화면 조합 전용이다. 값이 고정되는 폼 컨트롤이 필요하면
 * `Select`/`MultiSelect` 를 쓴다.
 *
 * `onCreate` 를 주면 검색어와 정확히 일치하는 옵션이 없을 때 "'검색어' 만들기" 행이 열린다 —
 * 태그처럼 목록에 없으면 만들어 쓰는 화면의 자유입력 생성 경로다.
 *
 * 접근성은 Select 와 같은 listbox 패턴 — 옵션은 focusable 이 아니고 포커스는 검색 입력에,
 * `aria-activedescendant` 로 가상 이동한다(↑↓ Enter Esc는 컨테이너가 처리).
 */
export type ComboboxOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
};

export type ComboboxProps = {
  readonly options: readonly ComboboxOption[];
  /** 고르면 호출되고 닫힌다 — 값은 고정되지 않는다(피커형). */
  readonly onPick: (value: string) => void;
  /** 트리거에 항상 표시할 문구 — "태그 추가", "게시글 선택" 등 행동 문구가 맞다. */
  readonly triggerLabel: ReactNode;
  /** 체크 표시할 값들 — 이미 추가된 항목을 다시 고르는 실수를 줄인다. */
  readonly pickedValues?: readonly string[];
  /** 있으면 정확 일치 옵션이 없을 때 "'검색어' 만들기" 행이 열린다. */
  readonly onCreate?: (input: string) => void;
  /**
   * 만들기 행이 열리는 최소 글자 수. 기본 1.
   *
   * 앱이 더 긴 하한을 요구하면(태그 2자 등) 여기서 막는다 —
   * 행을 띄워 놓고 누르면 오류를 뱉는 것은 "누를 수 있는데 항상 실패하는 버튼"이다.
   */
  readonly minCreateLength?: number;
  readonly searchPlaceholder?: string;
  readonly emptyLabel?: string;
  /**
   * 검색어를 앱이 소유(controlled)하고 목록을 서버에서 받아올 때 쓴다 —
   * 이 경우 내부 필터는 꺼지고(options 를 그대로 그린다) 디바운스·API 호출은 앱 몫이다.
   */
  readonly query?: string;
  readonly onQueryChange?: (query: string) => void;
  /** 서버 검색 진행 중 표시 — 목록 대신 스피너 행이 열린다. */
  readonly loading?: boolean;
  /** "'{input}' 만들기" 의 표시 형식 — 사전은 앱 소유라 문구를 주입받는다. */
  readonly createLabel?: (input: string) => string;
  readonly size?: ControlSize;
  readonly disabled?: boolean;
  /** 라벨과 연결할 트리거 id — `<Label htmlFor>` 의 대상이 된다. */
  readonly id?: string;
  readonly className?: string;
};

const CREATE_VALUE = '__combobox_create__';

export function Combobox({
  options,
  onPick,
  triggerLabel,
  pickedValues = [],
  onCreate,
  minCreateLength = 1,
  searchPlaceholder = '검색...',
  emptyLabel = '결과가 없습니다',
  createLabel = (input) => `'${input}' 만들기`,
  query: queryProp,
  onQueryChange,
  loading,
  size = 'md',
  disabled,
  id,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [innerQuery, setInnerQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  // controlled query = 서버 검색 모드 — 내부 필터를 끈다(목록은 앱이 이미 걸러 온 결과다).
  const external = queryProp !== undefined;
  const query = external ? queryProp : innerQuery;
  const setQuery = (next: string) => {
    if (!external) setInnerQuery(next);
    onQueryChange?.(next);
  };

  const visible = useMemo(() => {
    if (external) return options;
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [options, query, external]);

  const trimmed = query.trim();
  const canCreate =
    onCreate !== undefined &&
    trimmed.length >= minCreateLength &&
    !options.some((option) => option.label.toLowerCase() === trimmed.toLowerCase());

  /** 리스트 행 = 옵션들 + (조건부) 만들기 행. 키보드 인덱스는 이 합집합 위에서 움직인다. */
  const rows = useMemo<readonly ComboboxOption[]>(
    () =>
      canCreate ? [...visible, { value: CREATE_VALUE, label: createLabel(trimmed) }] : visible,
    [visible, canCreate, createLabel, trimmed],
  );

  /**
   * 열 때도 닫을 때도 검색어를 비운다.
   *
   * 서버 검색 모드(controlled query)에서 특히 중요하다 — 검색어가 앱 state 라
   * 여기서 안 비우면 목록도 그대로 남아, 고르지 않고 닫았다 다시 열었을 때
   * **지난번 검색 결과**가 새 검색 결과처럼 보인다.
   */
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setQuery('');
    if (next) setActiveIndex(0);
  };

  const commit = (row: ComboboxOption | undefined) => {
    if (!row || row.disabled) return;
    if (row.value === CREATE_VALUE) {
      onCreate?.(trimmed);
    } else {
      onPick(row.value);
    }
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    if (rows.length === 0) return;
    const start = activeIndex >= 0 && activeIndex < rows.length ? activeIndex : -1;
    let next = start;
    for (let step = 0; step < rows.length; step += 1) {
      next = (next + delta + rows.length) % rows.length;
      if (!rows[next]?.disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit(rows[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const activeId = rows[activeIndex] ? `${listId}-${activeIndex}` : undefined;

  return (
    <RadixPopover.Root open={open} onOpenChange={handleOpenChange}>
      <RadixPopover.Trigger
        id={id}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          'dl-field flex items-center justify-between gap-1.5 rounded-dl-container text-left',
          FIELD_SIZE_CLASS[size],
          open && 'border-dl-primary-hover',
          disabled && 'dl-field-locked',
          className,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
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
          className={cn(
            'z-[var(--dl-z-menu)] rounded-dl-container border border-dl-field-border bg-dl-surface p-1 shadow-dl-menu',
            'w-[var(--radix-popover-trigger-width)] min-w-40',
          )}
        >
          <div className="sticky top-0 z-[1] mb-1 border-b border-dl-divider bg-dl-surface pb-1.5">
            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-dl-locked-icon">
                <Icon icon={Search} size="sm" />
              </span>
              <input
                // 열 때마다 자동 포커스 — 손이 바로 검색으로 간다 (Select 와 동일 규격)
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
                className="dl-field dl-size-sm pl-8"
              />
            </span>
          </div>

          <div
            id={listId}
            role="listbox"
            className="max-h-dl-menu-max overflow-y-auto outline-none"
          >
            {loading ? (
              <p className="p-2.5 text-center text-dl-fg-subtle text-dl-sm">검색 중...</p>
            ) : rows.length === 0 ? (
              <p className="p-2.5 text-center text-dl-fg-subtle text-dl-sm">{emptyLabel}</p>
            ) : (
              rows.map((row, index) => {
                const isCreateRow = row.value === CREATE_VALUE;
                const isPicked = !isCreateRow && pickedValues.includes(row.value);
                const isActive = index === activeIndex;
                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드는 컨테이너 onKeyDown 이 처리한다
                  // biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant 로 가상 포커스를 쓴다
                  <div
                    key={row.value === CREATE_VALUE ? CREATE_VALUE : row.value}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={isPicked}
                    aria-disabled={row.disabled || undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(row)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-dl-control px-2.5 py-1.5 text-dl-fg text-dl-sm',
                      isActive && 'bg-dl-option-hover',
                      row.disabled && 'cursor-not-allowed text-dl-label-disabled',
                      isCreateRow && 'text-dl-primary',
                    )}
                  >
                    <span className="flex w-4 shrink-0 items-center justify-center">
                      {isCreateRow ? (
                        <Icon icon={Plus} size="sm" />
                      ) : isPicked ? (
                        <Icon icon={Check} size="sm" className="text-dl-primary" />
                      ) : null}
                    </span>
                    <span className="truncate">{row.label}</span>
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
