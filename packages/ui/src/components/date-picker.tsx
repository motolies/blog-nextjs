'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { type ComponentPropsWithRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Calendar, parseIsoDate } from './calendar';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import type { FieldLock } from './input';

/**
 * 날짜 선택 — 타이핑과 달력 팝업을 **둘 다** 지원한다.
 *
 * OMS 검색 폼은 키보드 입력이 빠른 사용자가 많아 타이핑을 막지 않는다.
 * 입력은 blur/Enter 시점에 정규화·검증하고(구분자 `.`·`/`·없음 허용 → `YYYY-MM-DD`),
 * 유효하지 않으면 마지막 값으로 되돌린다 — 어중간한 문자열이 값으로 남지 않는다.
 *
 * 값의 계약은 `YYYY-MM-DD` 문자열이다. `<input name>` 이 값을 직접 들고 있어
 * uncontrolled 검색 폼(FormData)과 controlled 폼 둘 다 성립한다.
 * 팝업은 Select 와 같은 RadixPopover 패턴 — 닫히면 언마운트라 달력은 열 때마다
 * 선택값의 달에서 시작한다.
 *
 * **`<input type="date">` 를 쓰지 않는다**: 브라우저마다 표시 형식이 달라 로케일에 따라
 * `MM/DD/YYYY` 로 보이는데 명세는 `YYYY-MM-DD` 고정이다. 한때 이 근거를 들고 아이콘만
 * 그린 `DateInput`(달력이 안 열리는 텍스트 입력)이 따로 있었으나, 눌러도 아무 일이
 * 없는 아이콘은 어포던스만 거짓으로 만들어 제거했다 — 날짜 칸은 이 컴포넌트 하나다.
 */

/**
 * 타이핑 입력 정규화 — `20260812` · `2026.08.12` · `2026/08/12` → `2026-08-12`. 실패는 null.
 * date-time-picker 가 날짜부 처리에 재사용한다(barrel 미노출 — 패키지 내부 계약).
 */
export function normalizeDateText(text: string): string | null {
  const compact = text.trim().replace(/[./]/g, '-');
  const digits = compact.replace(/-/g, '');
  if (!/^\d{8}$/.test(digits)) return null;
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return parseIsoDate(iso) ? iso : null;
}

/** 달력 팝업 패널 — Select 패널과 같은 배색·그림자·z-index 를 쓴다. date-time-picker 도 쓴다. */
export const PANEL_CLASS =
  'z-[var(--dl-z-menu)] rounded-dl-container border border-dl-field-border bg-dl-surface shadow-dl-menu';

/**
 * 달력 열기 버튼 — QA `_form.css` 실측: hover 에서 아이콘 뒤에 **24×24 · radius 4 ·
 * primary-hover 사각형**이 깔리고 아이콘이 흰색이 된다(장식이 아니라 명확한 버튼임을 알린다).
 * Popover.Trigger 의 asChild 를 받으므로 ref·이벤트 전달이 필요해 props 를 그대로 흘린다.
 * date-time-picker 도 쓴다(barrel 미노출).
 */
export function CalendarButton({
  label,
  locked,
  ...props
}: {
  readonly label: string;
  readonly locked: boolean;
} & ComponentPropsWithRef<'button'>) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={locked}
      {...props}
      className={cn(
        'group absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-dl-control',
        locked ? 'cursor-not-allowed text-dl-locked-icon' : 'text-dl-field-caret',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-dl-badge',
          !locked && 'group-hover:bg-dl-primary-hover group-hover:text-dl-primary-fg',
        )}
      >
        <Icon icon={CalendarIcon} size="sm" />
      </span>
    </button>
  );
}

export type DatePickerProps = {
  /** `YYYY-MM-DD`. 주면 controlled. */
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /** FormData 전송용 — 입력 자신이 값을 든다(hidden input 불필요). */
  readonly name?: string;
  readonly placeholder?: string;
  /** ISO 경계(포함) — 달력에서 밖의 날짜가 비활성이 된다. 타이핑 값은 서버 검증이 막는다. */
  readonly min?: string;
  readonly max?: string;
  readonly lock?: FieldLock;
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  readonly id?: string;
  readonly className?: string;
};

export function DatePicker({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  name,
  placeholder = 'YYYY-MM-DD',
  min,
  max,
  lock,
  invalid,
  size,
  id,
  className,
}: DatePickerProps) {
  const field = useFieldControl({ id, invalid, size });
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const [open, setOpen] = useState(false);
  /** 편집 중 임시 텍스트 — null 이면 커밋된 값을 그대로 보여준다(effect 동기화 불필요). */
  const [draft, setDraft] = useState<string | null>(null);

  if (field.mode === 'view') {
    // 값 계약이 YYYY-MM-DD 문자열이라 그대로가 표시값이다. 빈값이면 빈칸.
    return <FieldViewText size={field.size}>{value || null}</FieldViewText>;
  }

  const locked = lock !== undefined;
  const modeDisabled = field.mode === 'disabled';

  /**
   * 값이 실제로 바뀐 지점마다 `notifyDirty()` 를 부른다 — **달력 선택이 이유다.**
   * `Field` 는 자손의 DOM `input`/`change` 버블링으로 dirty 를 감지하는데,
   * 달력은 Radix Portal 이라 Field 바깥에 렌더되고 값도 React 상태로 바뀐다.
   * 그래서 이 호출이 없으면 **날짜를 골라 채웠는데도 "입력해 주세요" 오류가 남는다**(실측 확인).
   * 타이핑 경로는 DOM 이벤트로도 통지되지만 `notifyDirty` 는 멱등이라 중복이 무해하다.
   */
  const commitText = (text: string) => {
    setDraft(null);
    if (text.trim() === '') {
      setValue('');
      field.notifyDirty();
      return;
    }
    const iso = normalizeDateText(text);
    // 유효하지 않으면 조용히 이전 값으로 되돌린다 — 반쯤 친 문자열을 값으로 남기지 않는다.
    // 값이 그대로면 dirty 도 아니라 오류 표시를 지우지 않는다.
    if (iso) {
      setValue(iso);
      field.notifyDirty();
    }
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Anchor asChild>
        <span className={cn('relative block w-full', className)}>
          <input
            className={cn(
              // min-width 130px — QA .form-calender 실측(좁은 필터 칸에서도 YYYY-MM-DD 가 잘리지 않는 하한)
              'dl-field min-w-[130px] pr-10',
              FIELD_SIZE_CLASS[field.size],
              field.invalid && 'dl-field-error',
              (locked || modeDisabled) && 'dl-field-locked',
            )}
            id={field.id}
            name={name}
            value={draft ?? value}
            placeholder={placeholder}
            inputMode="numeric"
            aria-invalid={field['aria-invalid']}
            aria-describedby={field['aria-describedby']}
            readOnly={lock === 'auto' || lock === 'readonly'}
            // 입력 자신이 name·value 를 드므로 disabled 면 FormData 제외가 자동이다.
            disabled={lock === 'disabled' || modeDisabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commitText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitText(event.currentTarget.value);
            }}
          />
          <RadixPopover.Trigger asChild>
            <CalendarButton label="달력 열기" locked={locked || modeDisabled} />
          </RadixPopover.Trigger>
        </span>
      </RadixPopover.Anchor>

      <RadixPopover.Portal>
        <RadixPopover.Content sideOffset={4} align="start" className={PANEL_CLASS}>
          <Calendar
            value={value || undefined}
            min={min}
            max={max}
            onSelect={(iso) => {
              setValue(iso);
              setDraft(null);
              setOpen(false);
              field.notifyDirty();
            }}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

export type DateRange = { readonly start: string; readonly end: string };

export type DateRangePickerProps = {
  /** 각각 `YYYY-MM-DD` 또는 빈 문자열. 주면 controlled. */
  readonly start?: string;
  readonly end?: string;
  readonly defaultStart?: string;
  readonly defaultEnd?: string;
  readonly onRangeChange?: (range: DateRange) => void;
  /** FormData 전송용 — 시작·종료가 각자 이름을 가진다(검색 조건 관례). */
  readonly startName?: string;
  readonly endName?: string;
  readonly min?: string;
  readonly max?: string;
  readonly lock?: FieldLock;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 시작·종료 입력 둘 다에 적용된다. */
  readonly size?: ControlSize;
  readonly className?: string;
};

/**
 * 기간 선택 — 시작·종료 입력 한 쌍 + 공용 달력 하나.
 *
 * 달력 선택 규칙: 첫 클릭이 시작, 둘째 클릭이 종료(그리고 닫힘).
 * 시작보다 앞을 찍으면 그 날짜로 **다시 시작**한다 — 되돌리기가 클릭 하나다.
 * 타이핑으로 순서가 뒤집히면(시작 > 종료) 두 값을 맞바꾼다 — 뒤집힌 기간이라는
 * 상태 자체를 만들지 않는다.
 */
export function DateRangePicker({
  start: startProp,
  end: endProp,
  defaultStart = '',
  defaultEnd = '',
  onRangeChange,
  startName,
  endName,
  min,
  max,
  lock,
  invalid,
  size,
  className,
}: DateRangePickerProps) {
  // 한 이벤트(스왑·재시작)가 두 값을 동시에 바꾸므로 range 를 하나의 상태로 든다.
  const [range, setRange] = useControllableState<DateRange>(
    startProp !== undefined || endProp !== undefined
      ? { start: startProp ?? '', end: endProp ?? '' }
      : undefined,
    { start: defaultStart, end: defaultEnd },
    onRangeChange,
  );
  const [open, setOpen] = useState(false);
  /**
   * `notifyDirty`(달력은 Portal 이라 버블링이 닿지 않는다 — `DatePicker.commitText` 주석 참조)와
   * view 분기용 `mode`·`size` 만 쓴다. id·invalid 는 양끝 `SideInput` 이 각자 배선한다.
   */
  const field = useFieldControl({ invalid, size });
  const notifyDirty = field.notifyDirty;

  if (field.mode === 'view') {
    // 한쪽만 있으면 그쪽만 그린다 — `~` 는 양쪽 값이 있을 때만 뜻이 있다. 둘 다 빈값이면 빈칸.
    const display =
      range.start && range.end ? `${range.start} ~ ${range.end}` : range.start || range.end;
    return <FieldViewText size={field.size}>{display || null}</FieldViewText>;
  }

  const locked = lock !== undefined;
  const modeDisabled = field.mode === 'disabled';

  const commitSide = (side: 'start' | 'end', text: string) => {
    const iso = text.trim() === '' ? '' : normalizeDateText(text);
    if (iso === null) return; // 무효 입력은 SideInput 이 이전 값으로 되돌린다
    const next = { ...range, [side]: iso };
    notifyDirty();
    // 순서가 뒤집히면 맞바꾼다 — 둘 다 채워진 경우에만 판정한다.
    if (next.start && next.end && next.start > next.end) {
      setRange({ start: next.end, end: next.start });
      return;
    }
    setRange(next);
  };

  const handleSelect = (iso: string) => {
    notifyDirty();
    const picking = range.start !== '' && range.end === '';
    if (!picking || iso < range.start) {
      setRange({ start: iso, end: '' });
      return;
    }
    setRange({ start: range.start, end: iso });
    setOpen(false);
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Anchor asChild>
        {/* gap 10px · 물결표 20px/500/black — QA .filter-calender-wrapper · .form-calender__tilde 실측 */}
        <span className={cn('flex w-full items-center gap-2.5', className)}>
          <SideInput
            side="start"
            value={range.start}
            name={startName}
            lock={lock}
            invalid={invalid}
            size={size}
            mode={field.mode}
            onCommit={commitSide}
          />
          <span aria-hidden className="shrink-0 text-dl-title font-medium text-dl-fg">
            ~
          </span>
          <span className="relative block w-full">
            <SideInput
              side="end"
              value={range.end}
              name={endName}
              lock={lock}
              invalid={invalid}
              size={size}
              mode={field.mode}
              onCommit={commitSide}
              className="pr-10"
            />
            <RadixPopover.Trigger asChild>
              <CalendarButton label="기간 달력 열기" locked={locked || modeDisabled} />
            </RadixPopover.Trigger>
          </span>
        </span>
      </RadixPopover.Anchor>

      <RadixPopover.Portal>
        <RadixPopover.Content sideOffset={4} align="end" className={PANEL_CLASS}>
          <Calendar
            range={{ start: range.start || undefined, end: range.end || undefined }}
            value={range.start && !range.end ? range.start : undefined}
            initialFocus={range.start || undefined}
            min={min}
            max={max}
            onSelect={handleSelect}
          />
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/**
 * 기간의 한쪽 입력 — DatePicker 의 draft/commit 규칙과 동일하다.
 * `mode` 는 부모가 해석한 값을 prop 으로 받는다 — 자체 컨텍스트 조회에 맡기면
 * 부모와 다른 값을 읽을 수 있는 배선을 남기게 된다(view 분기는 부모가 통째로 한다).
 */
function SideInput({
  side,
  value,
  name,
  lock,
  invalid,
  size,
  mode,
  onCommit,
  className,
}: {
  readonly side: 'start' | 'end';
  readonly value: string;
  readonly name?: string;
  readonly lock?: FieldLock;
  readonly invalid?: boolean;
  readonly size?: ControlSize;
  readonly mode: FieldMode;
  readonly onCommit: (side: 'start' | 'end', text: string) => void;
  readonly className?: string;
}) {
  const field = useFieldControl({ invalid, size, mode });
  const [draft, setDraft] = useState<string | null>(null);
  const modeDisabled = field.mode === 'disabled';

  const commit = (text: string) => {
    setDraft(null);
    onCommit(side, text);
  };

  return (
    <input
      className={cn(
        'dl-field min-w-[130px]',
        FIELD_SIZE_CLASS[field.size],
        field.invalid && 'dl-field-error',
        (lock !== undefined || modeDisabled) && 'dl-field-locked',
        className,
      )}
      name={name}
      value={draft ?? value}
      placeholder="YYYY-MM-DD"
      inputMode="numeric"
      aria-label={side === 'start' ? '시작일' : '종료일'}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      readOnly={lock === 'auto' || lock === 'readonly'}
      disabled={lock === 'disabled' || modeDisabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit(event.currentTarget.value);
      }}
    />
  );
}
