'use client';

import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';
import { clampNumber, formatThousands, parseNumberText } from './numberFormat';

/**
 * 숫자 입력 — 값 계약이 `number | null` 이다(`Input` 은 문자열).
 *
 * 표시는 천단위 구분(`1,234,567`), 편집 중에는 친 그대로 두고 blur/Enter 에 확정한다 —
 * 정규화 실패는 조용히 이전 값으로 되돌린다(`DatePicker`·그리드 셀 에디터와 같은 규칙,
 * 규칙 정본은 `numberFormat.ts`). ↑/↓ 는 `step` 만큼 증감한다.
 *
 * 폼 전송: 표시 입력은 구분자가 섞여 그대로 보내지 않는다 — `name` 이 있으면
 * hidden input 이 원시 숫자 문자열을 든다(Select 의 hidden input 규약).
 *
 * 기본 정렬이 **가운데**다 — "숫자 칸은 가운데"(v3). 폼 안 숫자는 `align="left"` 로 뒤집는다.
 */

export type NumberInputProps = {
  /** 주면 controlled. 생략하면 `defaultValue` 로 시작하는 내부 상태가 된다. */
  readonly value?: number | null;
  readonly defaultValue?: number | null;
  readonly onValueChange?: (value: number | null) => void;
  /** 있으면 hidden input 이 원시 숫자를 든다 — 표시 입력의 구분자는 전송되지 않는다. */
  readonly name?: string;
  readonly placeholder?: string;
  /** 확정 시 클램프 경계(포함). */
  readonly min?: number;
  readonly max?: number;
  /** ↑/↓ 증감 폭. 기본 1. */
  readonly step?: number;
  /**
   * −/+ 스텝퍼 버튼 — 키보드 ↑/↓ 만으로는 증감이 발견되지 않아 opt-in 으로 버튼을 단다.
   * lock·disabled·readOnly 에서는 숨긴다(잠긴 값에 비활성 버튼은 거짓 어포던스다).
   */
  readonly stepper?: boolean;
  /** 스텝퍼 버튼의 접근성 이름 — 한국어 기본값, 앱이 번역으로 덮는다. */
  readonly stepperLabels?: { readonly up: string; readonly down: string };
  /** 소수 자릿수 고정 — 표시(0 채움)와 확정(반올림) 양쪽에 적용된다. */
  readonly decimalPlaces?: number;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly + 자물쇠. 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  /** 기본 center — 숫자 칸 규칙. 폼 안에서는 left 로 뒤집는다. */
  readonly align?: 'left' | 'center';
  readonly id?: string;
  readonly className?: string;
};

export function NumberInput({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  name,
  placeholder,
  min,
  max,
  step = 1,
  stepper,
  stepperLabels = { up: '증가', down: '감소' },
  decimalPlaces,
  mode,
  lock,
  invalid,
  size,
  align = 'center',
  id,
  className,
}: NumberInputProps) {
  const field = useFieldControl({ id, invalid, size, mode, lock });
  /**
   * 관리형 값 — 선택형 컨트롤과 같은 규약(비제어에서도 view 가 성립한다).
   * `useControllableState` 를 쓰지 않는 이유: controlled 판정이 `undefined` 기준인데
   * 이 컨트롤은 `null`(빈 값)이 유효한 controlled 값이라 그대로 성립한다.
   */
  const isControlled = valueProp !== undefined;
  const [inner, setInner] = useState<number | null>(defaultValue);
  const value = isControlled ? valueProp : inner;
  /** 편집 중 임시 텍스트 — null 이면 확정값을 포맷해 보여준다(DatePicker 의 draft 규칙). */
  const [draft, setDraft] = useState<string | null>(null);

  const bounds = { min, max, decimalPlaces };

  const setValue = (next: number | null) => {
    if (!isControlled) setInner(next);
    onValueChange?.(next);
  };

  if (field.state.view) {
    return (
      <FieldViewText
        size={field.size}
        className={align === 'center' ? 'justify-center' : undefined}
      >
        {formatThousands(value, decimalPlaces) || null}
      </FieldViewText>
    );
  }

  const commitText = (text: string) => {
    setDraft(null);
    const result = parseNumberText(text, bounds);
    // 숫자가 아니면 조용히 이전 값으로 되돌린다 — 반쯤 친 문자열을 값으로 남기지 않는다.
    if (!result.ok || Object.is(result.value, value)) return;
    setValue(result.value);
    field.notifyDirty();
  };

  const nudge = (delta: number) => {
    const next = clampNumber((value ?? 0) + delta, bounds);
    if (Object.is(next, value)) return;
    setDraft(null);
    setValue(next);
    field.notifyDirty();
  };

  // 잠긴 값은 증감할 수 없는 값이다 — lock 과 스텝퍼는 상호 배타(우측 슬롯 충돌도 없다).
  const showStepper = stepper === true && !lock && !field.state.readOnly && !field.state.disabled;

  const control = (
    <input
      className={cn(
        'dl-field',
        FIELD_SIZE_CLASS[field.size],
        align === 'center' && 'text-center',
        field.invalid && 'dl-field-error',
        field.state.lockClass,
        lock && 'pr-8',
        showStepper && 'pr-14',
        className,
      )}
      id={field.id}
      value={draft ?? formatThousands(value, decimalPlaces)}
      placeholder={placeholder}
      inputMode="decimal"
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      readOnly={field.state.readOnly}
      disabled={field.state.disabled}
      {...field.state.dataProps}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commitText(event.target.value)}
      onKeyDown={(event) => {
        if (field.state.readOnly) return;
        if (event.key === 'Enter') {
          commitText(event.currentTarget.value);
          return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          nudge(event.key === 'ArrowUp' ? step : -step);
        }
      }}
    />
  );

  return (
    <span className="relative block w-full">
      {/* 폼 전송용 원시 숫자 — 빈 값이면 내지 않는다(빈 문자열 전송은 0 오독을 부른다). */}
      {name && field.state.submits && value !== null ? (
        <input type="hidden" name={name} value={String(value)} />
      ) : null}
      {control}
      {lock ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
          <Icon icon={Lock} size="lock" />
        </span>
      ) : null}
      {showStepper ? (
        // tabIndex -1 — 키보드 사용자는 입력 안에서 ↑/↓ 를 쓰므로 탭 순서를 더럽히지 않는다.
        <span className="absolute inset-y-0 right-1.5 flex items-center gap-px">
          <StepperButton label={stepperLabels.down} onClick={() => nudge(-step)}>
            −
          </StepperButton>
          <StepperButton label={stepperLabels.up} onClick={() => nudge(step)}>
            +
          </StepperButton>
        </span>
      ) : null}
    </span>
  );
}

/** 스텝퍼 한 버튼 — Pager 의 고스트 규격(24×24)과 같은 무게. 글리프는 텍스트 −/+ 다. */
function StepperButton({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: string;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-6 items-center justify-center rounded-dl-control text-dl-fg-muted text-dl-sm hover:bg-dl-option-hover hover:text-dl-fg"
    >
      {children}
    </button>
  );
}
