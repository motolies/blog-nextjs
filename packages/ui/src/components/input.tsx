'use client';

import { Lock } from 'lucide-react';
import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { warnOnce } from '../lib/warnOnce';
import { FieldViewText, useFieldControl } from './field';

/**
 * 폼 컨트롤 — v3 §ds-05.
 *
 * 배색·높이·포커스는 전부 `dl-field` 유틸리티(theme/utilities.css)가 쥐고 있다.
 * 여기서는 **상태 3종을 어떻게 구분하는가**만 다룬다.
 */

/**
 * 지금 못 고치는 칸 3종.
 *
 * **배색은 셋 다 같다**(v3 §ds-05: "배색은 하나로 쓰고, 이유는 자물쇠·마스킹·안내문으로 구분한다").
 * 그래서 타입으로 나눠 두지 않으면 호출부가 구분 수단을 빠뜨린다 —
 * 특히 `auto` 의 자물쇠는 잊기 쉬워서 컴포넌트가 대신 그린다.
 */
export type FieldLock =
  /** 시스템이 값을 채운다 · **언제나** 수정 불가. readonly(값 전송·복사 O) + 자물쇠. */
  | 'auto'
  /** 지금은 못 고치지만 [열람]을 누르면 편집 가능 — 일시적. 마스킹된 값으로 구분한다. */
  | 'readonly'
  /** 지금은 쓸 수 없다(조건형 · 상태 잠금형). */
  | 'disabled';

/** 잠긴 칸은 `dl-field-locked` 가 placeholder 까지 감춘다 — 입력 신호가 남으면 안 된다. */
function lockClass(lock: FieldLock | undefined): string | undefined {
  return lock ? 'dl-field-locked' : undefined;
}

/**
 * `auto`·`readonly` 는 **readOnly** 다 — 값이 전송되고 복사도 된다.
 * `disabled` 만 disabled 로 둔다 — 전송에서 빠지는 것이 의도다.
 */
function isReadOnly(lock: FieldLock | undefined): boolean {
  return lock === 'auto' || lock === 'readonly';
}

/**
 * view 모드 표시값 — 제어 `value` 우선, 비제어면 `defaultValue` 폴백.
 * 텍스트형은 DOM 값을 미러링하지 않으므로(IME·성능) view↔edit 전환 폼은 제어형이 원칙이다.
 */
function viewValue(props: { readonly value?: unknown; readonly defaultValue?: unknown }): string {
  const raw = props.value ?? props.defaultValue;
  return raw === undefined || raw === null ? '' : String(raw);
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'readOnly'> & {
  ref?: Ref<HTMLInputElement>;
  readonly lock?: FieldLock;
  /** Field 밖에서 단독으로 쓸 때만. Field 안이면 컨텍스트가 이긴다. */
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  /** 숫자 칸은 가운데, 폼 안 숫자는 왼쪽 — v3 가 명시적으로 반대 규칙을 둔다. */
  readonly align?: 'left' | 'center';
};

export function Input({
  className,
  lock,
  invalid,
  size,
  align = 'left',
  id,
  disabled,
  ...props
}: InputProps) {
  const field = useFieldControl({ id, invalid, size });

  if (field.mode === 'view') {
    // view 는 lock/disabled 를 무시한다 — 입력 DOM 이 없어 적용 대상이 없다.
    // 마스킹된 값(lock="readonly")은 마스킹된 텍스트 그대로 보인다.
    const raw = viewValue(props);
    // password 는 값이 있으면 길이와 무관하게 고정 8자 — 평문도 길이도 노출하지 않는다.
    const display = props.type === 'password' && raw !== '' ? '********' : raw;
    return (
      <FieldViewText
        size={field.size}
        className={align === 'center' ? 'justify-center' : undefined}
      >
        {display}
      </FieldViewText>
    );
  }

  /**
   * 자동 입력 칸의 안내문구는 `"자동 / {시점} {동작}"` 이다(v3 §ds-05).
   * 잠긴 칸은 placeholder 가 감춰지지만, `auto` 는 **자물쇠 옆 회색 글씨로 남아**
   * "언제 채워지는가"를 알린다. 없으면 빈 회색 칸만 남아 고장으로 읽힌다.
   */
  if (lock === 'auto' && !props.placeholder) {
    warnOnce(
      `input-auto-no-placeholder:${id ?? field.id ?? 'unknown'}`,
      `lock="auto" 인 칸에 placeholder 가 없습니다. "자동 / 저장 시 발급" 형식으로 언제 채워지는지 적어 주세요.`,
    );
  }

  // 폼 수준(mode)과 칸 수준(lock·disabled)은 OR 합성 — mode 가 lock 을 지우지 않고
  // 잠복시킨다. edit 로 돌아오면 lock 이 그대로 복원된다.
  const modeDisabled = field.mode === 'disabled';

  const control = (
    <input
      className={cn(
        'dl-field',
        FIELD_SIZE_CLASS[field.size],
        align === 'center' && 'text-center',
        field.invalid && 'dl-field-error',
        lockClass(lock),
        modeDisabled && 'dl-field-locked',
        // 자물쇠가 값을 가리지 않게 자리를 비운다
        lock === 'auto' && 'pr-8',
        className,
      )}
      id={field.id}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      readOnly={isReadOnly(lock)}
      {...props}
      disabled={disabled || lock === 'disabled' || modeDisabled}
    />
  );

  if (lock !== 'auto') return control;

  return (
    <span className="relative block w-full">
      {control}
      {/* 상태 표시라 면(fill)으로 그린다 — 12px 에서 선 아이콘은 형태가 무너진다 */}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dl-locked-icon">
        <Icon icon={Lock} size="lock" />
      </span>
    </span>
  );
}

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'readOnly'> & {
  ref?: Ref<HTMLTextAreaElement>;
  readonly lock?: FieldLock;
  readonly invalid?: boolean;
  /** 높이는 내용 기준(min-height 58 고정)이라 size 는 **폰트·패딩만** 바꾼다. */
  readonly size?: ControlSize;
};

/** QA `form-textarea`: min-height 58 · resize 없음 · 내용이 늘면 스크롤. */
export function Textarea({
  className,
  lock,
  invalid,
  size,
  id,
  disabled,
  ...props
}: TextareaProps) {
  const field = useFieldControl({ id, invalid, size });

  if (field.mode === 'view') {
    // 줄바꿈 보존이 필수라 pre-wrap. 높이는 컨트롤 하한(VALUE_MIN_H)만 지킨다.
    return (
      <FieldViewText size={field.size} className="items-start whitespace-pre-wrap">
        {viewValue(props)}
      </FieldViewText>
    );
  }

  const modeDisabled = field.mode === 'disabled';

  return (
    <textarea
      className={cn(
        'dl-field h-auto min-h-dl-textarea resize-none py-2',
        FIELD_SIZE_CLASS[field.size],
        field.invalid && 'dl-field-error',
        lockClass(lock),
        modeDisabled && 'dl-field-locked',
        className,
      )}
      id={field.id}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      readOnly={isReadOnly(lock)}
      {...props}
      disabled={disabled || lock === 'disabled' || modeDisabled}
    />
  );
}
