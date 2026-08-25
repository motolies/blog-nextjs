'use client';

import { Lock, X } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from 'react';
import { useRef } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type ControlSize, FIELD_SIZE_CLASS } from '../lib/controlSize';
import { warnOnce } from '../lib/warnOnce';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';

/**
 * 폼 컨트롤 — v3 §ds-05.
 *
 * 배색·높이·포커스는 전부 `dl-field` 유틸리티(theme/utilities.css)가 쥐고 있다.
 * 상태 축은 셋이고 서로 직교한다(합성 규칙의 정본은 `fieldState.ts`):
 *   · `mode` — edit·view·disabled. 폼 수준(FormMode)에서 상속받고 명시 prop 이 이긴다.
 *   · `lock` — 시스템 채움 영구 불변. **mode 가 edit 여도 편집 불가** + 자물쇠 아이콘.
 *   · `masking` — 서버가 이미 마스킹한 개인정보 값 선언. 편집 불가 + 전용 배색 + `name` 미전달.
 * 배색은 셋 다 `dl-field-locked` 를 공유하고, 이유는 자물쇠·마스킹 색·안내문으로 구분한다.
 */

/**
 * view 모드 표시값 — 제어 `value` 우선, 비제어면 `defaultValue` 폴백.
 * 텍스트형은 DOM 값을 미러링하지 않으므로(IME·성능) view↔edit 전환 폼은 제어형이 원칙이다.
 */
function viewValue(props: { readonly value?: unknown; readonly defaultValue?: unknown }): string {
  const raw = props.value ?? props.defaultValue;
  return raw === undefined || raw === null ? '' : String(raw);
}

/** 사용자 ref 와 내부 ref(지우기 후 포커스 복귀용)를 한 콜백으로 합친다. */
function composeRefs<T>(...refs: readonly (Ref<T> | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }
  };
}

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'readOnly' | 'disabled' | 'prefix'
> & {
  ref?: Ref<HTMLInputElement>;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** 시스템 채움 영구 불변 — readOnly(값 전송·복사 O) + 자물쇠. 모든 mode 를 이긴다. */
  readonly lock?: boolean;
  /**
   * 서버가 이미 마스킹해 내려준 개인정보 값(`a***@b.com`)임을 선언한다.
   * 편집 불가 + 마스킹 배색 + **`name` 미전달**(마스킹된 값이 저장되면 실값이 파괴된다 —
   * 실제 사고 사례가 있다. 서버 zod `.omit()` 방어선과 함께 간다).
   */
  readonly masking?: boolean;
  /** Field 밖에서 단독으로 쓸 때만. Field 안이면 컨텍스트가 이긴다. */
  readonly invalid?: boolean;
  /** 5단 사이즈. 생략하면 감싼 `Field` 의 size, 그것도 없으면 `md`(42). */
  readonly size?: ControlSize;
  /** 숫자 칸은 가운데, 폼 안 숫자는 왼쪽 — v3 가 명시적으로 반대 규칙을 둔다. */
  readonly align?: 'left' | 'center';
  /**
   * 값 지우기(×) 버튼 — **제어형 전용**이다. Input 은 값을 미러링하지 않아(IME·성능)
   * 비제어에서는 "값이 있는가"를 알 수 없다. × 는 `onClear` 를 부를 뿐 값을 직접 지우지
   * 않는다 — 값의 주인은 호출부다.
   */
  readonly clearable?: boolean;
  readonly onClear?: () => void;
  /** × 버튼의 접근성 이름. `ui` 는 사전을 모른다 — 필요하면 번역을 주입한다. */
  readonly clearLabel?: string;
  /** 앞 어도먼트 — 아이콘·1-2자 글리프 전용(고정폭 슬롯). 긴 텍스트는 앱 조합 몫이다. */
  readonly prefix?: ReactNode;
  /** 뒤 어도먼트 — 아이콘·1-2자 단위(₩·kg) 전용. lock·× 와 공존 시 그 안쪽에 선다. */
  readonly suffix?: ReactNode;
  /**
   * 글자수 카운터(`N/max`) — **제어형 + `maxLength` 전용**이다(`clearable` 과 같은 규약:
   * 텍스트형은 값을 미러링하지 않아 비제어에서는 길이를 알 수 없다). 컨트롤 아래
   * 우측에 뜨고, 편집 가능한 상태에서만 보인다(잠긴 값의 카운터는 소음이다).
   */
  readonly showCount?: boolean;
};

export function Input({
  className,
  mode,
  lock,
  masking,
  invalid,
  size,
  align = 'left',
  id,
  name,
  clearable,
  onClear,
  clearLabel = '지우기',
  prefix,
  suffix,
  showCount,
  ref,
  ...props
}: InputProps) {
  const field = useFieldControl({ id, invalid, size, mode, lock, masking });
  const innerRef = useRef<HTMLInputElement>(null);

  if (field.state.view) {
    const raw = viewValue(props);
    // password 는 값이 있으면 길이와 무관하게 고정 8자 — 평문도 길이도 노출하지 않는다.
    const isPassword = props.type === 'password' && raw !== '';
    const display = isPassword ? '********' : raw;
    return (
      <FieldViewText
        size={field.size}
        // 마스킹 값과 password 는 같은 시각 언어다 — 실값이 아님을 색으로 알린다.
        masked={masking || isPassword}
        className={align === 'center' ? 'justify-center' : undefined}
      >
        {display}
      </FieldViewText>
    );
  }

  /**
   * 자동 입력 칸의 안내문구는 `"자동 / {시점} {동작}"` 이다(v3 §ds-05).
   * 잠긴 칸은 placeholder 가 감춰지지만 lock 은 `dl-field-locked-hint` 로 다시 보인다 —
   * "언제 채워지는가"를 알린다. 없으면 빈 회색 칸만 남아 고장으로 읽힌다.
   */
  if (lock && !props.placeholder) {
    warnOnce(
      `input-lock-no-placeholder:${id ?? field.id ?? 'unknown'}`,
      'lock 인 칸에 placeholder 가 없습니다. "자동 / 저장 시 발급" 형식으로 언제 채워지는지 적어 주세요.',
    );
  }
  if (clearable && props.value === undefined) {
    warnOnce(
      `input-clearable-uncontrolled:${id ?? field.id ?? 'unknown'}`,
      'clearable 은 제어형 전용입니다 — value 없이는 × 버튼이 값 유무를 알 수 없습니다.',
    );
  }
  if (showCount && (props.value === undefined || props.maxLength === undefined)) {
    warnOnce(
      `input-showcount-misuse:${id ?? field.id ?? 'unknown'}`,
      'showCount 는 제어형 + maxLength 전용입니다 — 값과 상한이 없으면 카운터를 그릴 수 없습니다.',
    );
  }

  // × 는 편집 가능한 상태에서만 뜬다 — lock·masking·disabled 칸의 값은 지울 수 없는 값이다.
  const showClear =
    clearable === true &&
    !field.state.readOnly &&
    !field.state.disabled &&
    typeof props.value === 'string' &&
    props.value !== '';

  // 우측 슬롯은 최대 2개다 — lock 과 × 는 상호 배타(잠긴 값은 못 지운다)라 겹치지 않는다.
  const rightSlots = (lock || showClear ? 1 : 0) + (suffix != null ? 1 : 0);

  const control = (
    <input
      className={cn(
        'dl-field',
        FIELD_SIZE_CLASS[field.size],
        align === 'center' && 'text-center',
        field.invalid && 'dl-field-error',
        field.state.lockClass,
        prefix != null && 'pl-8',
        rightSlots === 1 && 'pr-8',
        rightSlots === 2 && 'pr-14',
        className,
      )}
      id={field.id}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      readOnly={field.state.readOnly}
      ref={composeRefs(ref, innerRef)}
      {...field.state.dataProps}
      {...props}
      // 마스킹 값은 전송에서 뺀다 — FormData 에 실려 저장되면 실값이 파괴된다.
      name={masking ? undefined : name}
      disabled={field.state.disabled}
    />
  );

  /**
   * ⚠️ 어도먼트 유무와 **무관하게 항상** 이 래퍼를 쓴다.
   *
   * 조건부로 감싸면 반환 트리가 `<input>` ↔ `<span><input>…</span>` 으로 바뀐다.
   * `clearable` 의 × 는 값이 있을 때만 뜨므로 **빈 칸에 첫 글자를 치는 순간** 그 전환이
   * 일어나고, React 가 위치가 달라진 입력 DOM 을 파괴하고 새로 만든다 —
   * 포커스가 날아가 첫 글자만 남는다(실측 버그). 래퍼가 늘 있으면 자리가 고정된다.
   */
  const decorated = (
    <span className="relative block w-full">
      {control}
      {prefix != null ? (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-dl-fg-muted">
          {prefix}
        </span>
      ) : null}
      {rightSlots > 0 ? (
        // 컨테이너는 클릭을 통과시키고 × 버튼만 다시 받는다 — 아이콘이 입력 클릭을 막으면 안 된다.
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1">
          {suffix != null ? (
            <span className="flex items-center text-dl-fg-muted">{suffix}</span>
          ) : null}
          {showClear ? (
            <button
              type="button"
              aria-label={clearLabel}
              onClick={() => {
                innerRef.current?.focus();
                onClear?.();
                field.notifyDirty();
              }}
              className="pointer-events-auto flex size-5 items-center justify-center rounded-dl-badge text-dl-field-caret hover:bg-dl-option-hover hover:text-dl-fg"
            >
              <Icon icon={X} className="size-3" />
            </button>
          ) : null}
          {lock ? (
            // 상태 표시라 면(fill)으로 그린다 — 12px 에서 선 아이콘은 형태가 무너진다
            <span className="flex items-center text-dl-locked-icon">
              <Icon icon={Lock} size="lock" />
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  // 카운터는 편집 가능한 상태 + 제어형 + maxLength 가 전부 갖춰졌을 때만 그린다.
  const showCounter =
    showCount === true &&
    !field.state.readOnly &&
    !field.state.disabled &&
    typeof props.value === 'string' &&
    props.maxLength !== undefined;

  // 바깥 래퍼도 **항상** 있다 — 위와 같은 이유다(조건부 래핑은 입력 DOM 을 파괴한다).
  // 두 겹인 이유: 안쪽은 어도먼트의 absolute 기준면이라, 카운터가 그 안에 들어가면
  // 부모 높이가 늘어나 inset-y-0 아이콘이 세로 중앙에서 벗어난다.
  return (
    <span className="block w-full">
      {decorated}
      {/* 시각 보조다 — 상한 강제는 네이티브 maxLength 가 한다. 스크린리더에는 소음이라 숨긴다. */}
      {showCounter ? (
        <span aria-hidden className="mt-0.5 flex justify-end text-dl-fg-muted text-dl-xs">
          {String(props.value).length}/{props.maxLength}
        </span>
      ) : null}
    </span>
  );
}

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'readOnly' | 'disabled'
> & {
  ref?: Ref<HTMLTextAreaElement>;
  readonly mode?: FieldMode;
  readonly lock?: boolean;
  readonly masking?: boolean;
  readonly invalid?: boolean;
  /** 높이는 내용 기준(min-height 58 고정)이라 size 는 **폰트·패딩만** 바꾼다. */
  readonly size?: ControlSize;
  /** 내용을 따라 높이가 자란다(`field-sizing: content`). 상한을 두어 무한히 크지는 않는다. */
  readonly autosize?: boolean;
  /** 글자수 카운터(`N/max`) — 제어형 + `maxLength` 전용. 규약은 `Input.showCount` 와 같다. */
  readonly showCount?: boolean;
};

/** QA `form-textarea`: min-height 58 · resize 없음 · 내용이 늘면 스크롤(autosize 는 성장). */
export function Textarea({
  className,
  mode,
  lock,
  masking,
  invalid,
  size,
  autosize,
  showCount,
  id,
  name,
  ...props
}: TextareaProps) {
  const field = useFieldControl({ id, invalid, size, mode, lock, masking });

  if (showCount && (props.value === undefined || props.maxLength === undefined)) {
    warnOnce(
      `textarea-showcount-misuse:${id ?? field.id ?? 'unknown'}`,
      'showCount 는 제어형 + maxLength 전용입니다 — 값과 상한이 없으면 카운터를 그릴 수 없습니다.',
    );
  }

  if (field.state.view) {
    // 줄바꿈 보존이 필수라 pre-wrap. 높이는 컨트롤 하한(VALUE_MIN_H)만 지킨다.
    return (
      <FieldViewText size={field.size} masked={masking} className="items-start whitespace-pre-wrap">
        {viewValue(props)}
      </FieldViewText>
    );
  }

  const control = (
    <textarea
      className={cn(
        'dl-field h-auto min-h-dl-textarea resize-none py-2',
        FIELD_SIZE_CLASS[field.size],
        // 미지원 브라우저는 선언이 무시되어 현행 고정 높이로 퇴화한다 — 상한만 함께 간다.
        autosize && 'field-sizing-content max-h-60',
        field.invalid && 'dl-field-error',
        field.state.lockClass,
        lock && 'pr-8',
        className,
      )}
      id={field.id}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      aria-required={field.required || undefined}
      readOnly={field.state.readOnly}
      {...field.state.dataProps}
      {...props}
      // 마스킹 값은 전송에서 뺀다 — Input 과 같은 방어다.
      name={masking ? undefined : name}
      disabled={field.state.disabled}
    />
  );

  // 래퍼는 lock 유무와 무관하게 **항상** 있다 — Input 과 같은 이유다(조건부 래핑은
  // 반환 트리의 깊이를 바꿔 React 가 입력 DOM 을 파괴하고, 타이핑 중 포커스가 날아간다).
  const decorated = (
    <span className="relative block w-full">
      {control}
      {/* 여러 줄 컨트롤이라 세로 중앙이 아니라 첫 줄 옆(우상단)에 붙인다. */}
      {lock ? (
        <span className="pointer-events-none absolute top-2.5 right-3 flex text-dl-locked-icon">
          <Icon icon={Lock} size="lock" />
        </span>
      ) : null}
    </span>
  );

  // 카운터 규약은 Input 과 같다 — 편집 가능한 상태 + 제어형 + maxLength.
  const showCounter =
    showCount === true &&
    !field.state.readOnly &&
    !field.state.disabled &&
    typeof props.value === 'string' &&
    props.maxLength !== undefined;

  return (
    <span className="block w-full">
      {decorated}
      {/* 시각 보조다 — 상한 강제는 네이티브 maxLength 가 한다. 스크린리더에는 소음이라 숨긴다. */}
      {showCounter ? (
        <span aria-hidden className="mt-0.5 flex justify-end text-dl-fg-muted text-dl-xs">
          {String(props.value).length}/{props.maxLength}
        </span>
      ) : null}
    </span>
  );
}
