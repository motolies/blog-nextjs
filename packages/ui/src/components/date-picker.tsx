'use client';

import { Calendar as CalendarIcon, Lock, X } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { type ComponentPropsWithRef, useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Calendar, parseIsoDate } from './calendar';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';

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
 * date-range-picker·date-time-picker 가 재사용한다(barrel 미노출 — 패키지 내부 계약).
 */
export function normalizeDateText(text: string): string | null {
  const compact = text.trim().replace(/[./]/g, '-');
  const digits = compact.replace(/-/g, '');
  if (!/^\d{8}$/.test(digits)) return null;
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  return parseIsoDate(iso) ? iso : null;
}

/** 달력 팝업 패널 — Select 패널과 같은 배색·그림자·z-index 를 쓴다. 기간 계열 둘도 쓴다. */
export const PANEL_CLASS =
  'z-[var(--dl-z-menu)] rounded-dl-container border border-dl-field-border bg-dl-surface shadow-dl-menu';

/**
 * 달력 열기 버튼 — QA `_form.css` 실측: hover 에서 아이콘 뒤에 **24×24 · radius 4 ·
 * primary-hover 사각형**이 깔리고 아이콘이 흰색이 된다(장식이 아니라 명확한 버튼임을 알린다).
 * Popover.Trigger 의 asChild 를 받으므로 ref·이벤트 전달이 필요해 props 를 그대로 흘린다.
 * date-range-picker·date-time-picker 도 쓴다(barrel 미노출).
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
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly + 자물쇠(달력 버튼 대신). 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  readonly id?: string;
  /** 값 지우기(×) — 값이 있으면 달력 버튼 왼쪽에 뜬다. */
  readonly clearable?: boolean;
  /** × 버튼의 접근성 이름. `ui` 는 사전을 모른다 — 필요하면 번역을 주입한다. */
  readonly clearLabel?: string;
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
  mode,
  lock,
  invalid,
  size,
  id,
  clearable,
  clearLabel = '지우기',
  className,
}: DatePickerProps) {
  const field = useFieldControl({ id, invalid, size, mode, lock });
  const [value, setValue] = useControllableState(valueProp, defaultValue, onValueChange);
  const [open, setOpen] = useState(false);
  /** 편집 중 임시 텍스트 — null 이면 커밋된 값을 그대로 보여준다(effect 동기화 불필요). */
  const [draft, setDraft] = useState<string | null>(null);

  if (field.state.view) {
    // 값 계약이 YYYY-MM-DD 문자열이라 그대로가 표시값이다. 빈값이면 빈칸.
    return <FieldViewText size={field.size}>{value || null}</FieldViewText>;
  }

  // 지우기는 편집 가능한 상태에서만 뜬다 — 잠긴 값은 지울 수 있는 값이 아니다.
  const showClear =
    clearable === true && !field.state.readOnly && !field.state.disabled && value !== '';

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
              field.state.lockClass,
              showClear && 'pr-16',
            )}
            id={field.id}
            name={name}
            value={draft ?? value}
            placeholder={placeholder}
            inputMode="numeric"
            aria-invalid={field['aria-invalid']}
            aria-describedby={field['aria-describedby']}
            aria-required={field.required || undefined}
            readOnly={field.state.readOnly}
            // 입력 자신이 name·value 를 드므로 disabled 면 FormData 제외가 자동이다.
            disabled={field.state.disabled}
            {...field.state.dataProps}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commitText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitText(event.currentTarget.value);
            }}
          />
          {showClear ? (
            <button
              type="button"
              aria-label={clearLabel}
              onClick={() => {
                setDraft(null);
                setValue('');
                field.notifyDirty();
              }}
              className="absolute inset-y-0 right-10 my-auto flex size-5 items-center justify-center rounded-dl-badge text-dl-field-caret hover:bg-dl-option-hover hover:text-dl-fg"
            >
              <Icon icon={X} className="size-3" />
            </button>
          ) : null}
          {lock ? (
            // 잠긴 칸의 달력 버튼은 비활성 버튼이 아니라 **자물쇠 표식**으로 바꾼다 —
            // 눌리지 않는 버튼은 어포던스만 거짓으로 만든다(DateInput 삭제와 같은 논리).
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
              <Icon icon={Lock} size="lock" />
            </span>
          ) : (
            <RadixPopover.Trigger asChild>
              <CalendarButton label="달력 열기" locked={field.state.disabled} />
            </RadixPopover.Trigger>
          )}
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
