'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { cn } from '../lib/cn';
import { type ControlSize, VALUE_MIN_H_CLASS } from '../lib/controlSize';
import { type ControlState, resolveControlState, resolveMode } from './fieldState';
import { type FieldMode, useFormMode } from './form-mode';

/**
 * 라벨 + 컨트롤 + 오류 문구 한 쌍.
 *
 * **오류를 자식에게 `cloneElement` 로 주입하지 않는다.** v3 상세 폼에는
 * `<Field><div><Input/><Button/></div></Field>` 처럼 감싸는 구조가 실제로 나오고
 * 클로닝은 거기서 무너진다. 컨텍스트로 내려보내고 컨트롤이 `useFieldControl()` 로 가져간다.
 */

type FieldContextValue = {
  readonly id: string;
  readonly invalid: boolean;
  /** `${id}-error` 또는 `${id}-help`. 둘 다 없으면 undefined. */
  readonly describedBy: string | undefined;
  readonly required: boolean;
  /** 값이 바뀌었다고 알린다 — **그 칸의 오류만** 즉시 지우기 위한 통로다(v3 §ds-05). */
  readonly notifyDirty: () => void;
  /** 컨트롤 사이즈 — Field 가 정하면 안의 컨트롤들이 따라간다(한 칸 안 정렬). */
  readonly size: ControlSize;
  /** 폼 모드 — Field 가 `명시 prop ?? FormMode ?? 'edit'` 로 해석한 **확정값**을 내린다. */
  readonly mode: FieldMode;
};

const FieldContext = createContext<FieldContextValue | null>(null);

const noop = () => {};

/**
 * 컨트롤이 접근성 배선을 가져가는 통로.
 * **명시 prop 이 컨텍스트를 이긴다** — Field 밖에서 단독으로 쓸 수도 있어야 한다.
 *
 * `lock`/`masking` 을 받은 컨트롤은 여기로 넘겨 `state`(fieldState.ts 계약의 합성 결과)
 * 하나로 렌더한다 — readOnly/disabled/전송 여부/잠금 배색/data 속성을 제각각 계산하면
 * 컨트롤마다 규칙이 갈라진다(과거 날짜 3형제가 같은 식을 4벌 복붙했던 원인).
 */
export function useFieldControl(overrides?: {
  readonly id?: string;
  readonly invalid?: boolean;
  readonly describedBy?: string;
  readonly size?: ControlSize;
  readonly mode?: FieldMode;
  readonly lock?: boolean;
  readonly masking?: boolean;
}): {
  readonly id: string | undefined;
  readonly 'aria-invalid': true | undefined;
  readonly 'aria-describedby': string | undefined;
  readonly invalid: boolean;
  readonly required: boolean;
  readonly notifyDirty: () => void;
  readonly size: ControlSize;
  readonly mode: FieldMode;
  readonly state: ControlState;
} {
  const context = useContext(FieldContext);
  // FormMode 폴백은 Field 밖 단독 컨트롤 전용이다 — Field 안이면 context.mode 가 이미 확정값이다.
  const formMode = useFormMode();
  const invalid = overrides?.invalid ?? context?.invalid ?? false;
  const mode = resolveMode(overrides?.mode, context?.mode, formMode);

  return {
    id: overrides?.id ?? context?.id,
    'aria-invalid': invalid ? true : undefined,
    'aria-describedby': overrides?.describedBy ?? context?.describedBy,
    invalid,
    required: context?.required ?? false,
    notifyDirty: context?.notifyDirty ?? noop,
    size: overrides?.size ?? context?.size ?? 'md',
    mode,
    state: resolveControlState({ mode, lock: overrides?.lock, masking: overrides?.masking }),
  };
}

/**
 * `htmlFor` 를 **필수**로 받는다.
 *
 * 선택으로 두면 라벨과 입력이 연결되지 않은 폼이 조용히 늘어난다 —
 * 스크린리더 사용자에게는 라벨 없는 입력과 같고, 라벨 클릭으로 포커스도 안 잡힌다.
 */
export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & { htmlFor: string };

export function Label({ className, htmlFor, ...props }: LabelProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor 가 타입상 필수다. 규칙은 label 이 input 을 감싸는 형태만 정적으로 인식한다
    <label
      htmlFor={htmlFor}
      // QA form-label: 14px · 600 · black
      className={cn('text-dl-sm font-semibold text-dl-fg', className)}
      {...props}
    />
  );
}

/** 필수 표시. 좌측 여백 2px · 700. */
export function RequiredMark() {
  return (
    <span aria-hidden className="ml-0.5 font-bold text-dl-error">
      *
    </span>
  );
}

/**
 * 오류 문구 — QA `form-control-info__text.error`: 12px · danger · 위 여백 2px.
 * 아이콘 없이 텍스트만 둔다 — QA 실측도 텍스트뿐이다.
 */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    // 저장 시 여러 칸에 동시에 뜨므로 alert 로 둔다 — 스크린리더가 즉시 읽는다.
    <p id={id} role="alert" className="mt-0.5 text-dl-xs text-dl-error">
      {children}
    </p>
  );
}

/**
 * 읽기 전용 라벨/값 쌍 — 입력이 없는 상세 표시용.
 *
 * 읽기 전용 축은 **넷**이고 여긴 그중 "영구 조회"다(합성 규칙 정본은 fieldState.ts):
 *   · `FieldValue` — 애초에 **고칠 대상이 아닌** 값. 시간 개념이 없다 (여기)
 *   · `lock` — 시스템 채움 영구 불변. 칸 수준, 모든 mode 를 이긴다 (input.tsx 등)
 *   · `masking` — 서버가 마스킹한 개인정보 값 선언. 칸 수준, 전송 제외 (input.tsx)
 *   · `mode` — 조회↔수정을 오가는 폼의 현재 상태 — 폼 수준 (form-mode.tsx)
 * 모드를 오가는 화면이면 `FieldValue` 가 아니라 `<Field mode="view">` 를 쓴다.
 *
 * `Field` 와 **같은 세로 리듬**(라벨 위 · 간격 4)을 쓰되 `htmlFor`·오류·필수 표시가 없다.
 * 값 칸 최소 높이(`VALUE_MIN_H_CLASS`)를 컨트롤에 맞추는 이유: 한 격자 안에서 편집 칸과
 * 표시 칸이 섞이는 것이 상세 폼의 일반적인 모습이라, 높이가 다르면 행이 어긋난다.
 */
export function FieldValue({
  label,
  children,
  size = 'md',
  className,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
  /** 나란히 놓이는 편집 칸들과 같은 값이어야 행이 맞는다. */
  readonly size?: ControlSize;
  readonly className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-dl-sm font-semibold text-dl-fg">{label}</span>
      <div className={cn('flex items-center text-dl-sm text-dl-fg', VALUE_MIN_H_CLASS[size])}>
        {children}
      </div>
    </div>
  );
}

/**
 * 컨트롤들이 view 모드에서 쓰는 공용 값 텍스트 — barrel 로 내보내지 않는다(앱은 `FieldValue`).
 *
 * 최소 높이를 같은 size 컨트롤과 맞춰(`VALUE_MIN_H_CLASS` ↔ `FIELD_SIZE_CLASS` 파리티)
 * 모드를 토글해도 행이 튀지 않는다. 미선택/빈값이면 내용 없이 이 틀만 남는다 —
 * placeholder 를 그리지 않는 것(빈칸 규칙)은 호출한 컨트롤의 책임이다.
 *
 * `masked` 는 마스킹된 개인정보 값(password 고정 `********` 포함) — 실값이 아님을
 * 색·기울임으로 알리고 `data-masked` 를 남겨 앱이 저장 페이로드에서 걸러낼 수 있게 한다.
 */
export function FieldViewText({
  size,
  masked,
  className,
  children,
}: {
  readonly size: ControlSize;
  readonly masked?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <span
      data-mode="view"
      data-masked={masked ? '' : undefined}
      className={cn(
        'flex items-center text-dl-sm text-dl-fg',
        VALUE_MIN_H_CLASS[size],
        masked && 'text-dl-masked italic',
        className,
      )}
    >
      {children}
    </span>
  );
}

export type FieldProps = {
  /** 연결할 컨트롤의 id. 접근성 요건이라 선택이 아니다. */
  readonly htmlFor: string;
  readonly label: ReactNode;
  readonly required?: boolean;
  /**
   * 오류 문구. 있으면 자식 컨트롤이 자동으로 오류 배색 + `aria-invalid` 를 입는다.
   * v3 §ds-05: **필수값 오류를 모달로 막지 않는다** — 못 채운 칸 전부에 동시에 표시한다.
   */
  readonly error?: ReactNode;
  /** 보조 설명. 오류가 있으면 감춘다 — 둘 다 읽히면 스크린리더가 시끄럽다. */
  readonly help?: ReactNode;
  /**
   * `stack` 라벨이 위 — 로그인 · 모달
   * `inline` 라벨과 컨트롤이 **각각 grid item** 이 된다(`display: contents`) —
   *   검색 필터가 `dl-filter-grid` 로 128px + 1fr 트랙을 쓰기 때문이다.
   */
  readonly layout?: 'stack' | 'inline';
  /** 값이 바뀌면 호출된다. `useFieldErrors().bind()` 가 이걸 채운다. */
  readonly onDirty?: () => void;
  /** 안의 컨트롤들에 컨텍스트로 내려간다 — 컨트롤의 명시 size prop 이 이긴다. */
  readonly size?: ControlSize;
  /**
   * 폼 모드. 생략하면 감싼 `FormMode` 의 값, 그것도 없으면 `edit`.
   * `view` = 입력 DOM 을 없애고 값 텍스트만 — 폼 값이 안 나오므로 view↔edit 폼은 제어형 필수.
   * `disabled` = 컨트롤 유지 + 비활성(FormData 제외). 명시 prop 이 컨텍스트를 이긴다 —
   * 조회 화면에서 특정 칸만 편집으로 여는 용도다.
   */
  readonly mode?: FieldMode;
  /**
   * view 모드 표시값 오버라이드 — 표시값 ≠ 편집값일 때(단위 붙은 금액, Badge 등).
   * 있으면 children 대신 이걸 그린다. edit/disabled 모드에서는 무시된다.
   */
  readonly view?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
};

export function Field({
  htmlFor,
  label,
  required,
  error,
  help,
  layout = 'stack',
  onDirty,
  size = 'md',
  mode: modeProp,
  view,
  className,
  children,
}: FieldProps) {
  const formMode = useFormMode();
  const mode = resolveMode(modeProp, undefined, formMode);

  // view 모드는 오류 배선을 끊는다 — 입력이 사라져 aria-invalid 를 받을 대상이 없다.
  const invalid = mode !== 'view' && Boolean(error);
  const describedBy =
    mode === 'view'
      ? undefined
      : invalid
        ? `${htmlFor}-error`
        : help
          ? `${htmlFor}-help`
          : undefined;

  const context = useMemo<FieldContextValue>(
    () => ({
      id: htmlFor,
      invalid,
      describedBy,
      required: Boolean(required),
      notifyDirty: onDirty ?? noop,
      size,
      mode,
    }),
    [htmlFor, invalid, describedBy, required, onDirty, size, mode],
  );

  /**
   * 자손의 입력 이벤트를 여기서 받는다. `onInput` 과 `onChange` 를 둘 다 붙이는 이유:
   * 텍스트 입력은 `input`, 네이티브 select 는 브라우저에 따라 `change` 만 낸다.
   * `notifyDirty` 는 멱등이라 중복 호출이 무해하다.
   */
  const handleDirty = () => context.notifyDirty();

  if (mode === 'view') {
    /**
     * view 모드 DOM 은 `FieldValue` 와 같은 모양이다 — 입력이 사라져 `<label>` 이 가리킬
     * 대상이 없으므로 span 을 쓰고, 필수 별표·오류·help·dirty 배선도 없다.
     * `view` prop 이 있으면 children 대신 그린다 — 컨트롤 스스로 표시값을 못 만드는 칸
     * (단위 붙은 금액, Badge 상태 등). 없으면 컨트롤들이 자기 view 를 그린다.
     */
    const valueArea = view !== undefined ? view : children;
    if (layout === 'inline') {
      return (
        <FieldContext.Provider value={context}>
          <span className="whitespace-nowrap py-2 pr-2 pl-3.5 text-dl-sm font-semibold text-dl-fg-label">
            {label}
          </span>
          <div
            className={cn(
              'flex min-w-0 items-center gap-2 px-2 py-1.5',
              VALUE_MIN_H_CLASS[size],
              className,
            )}
          >
            {valueArea}
          </div>
        </FieldContext.Provider>
      );
    }
    return (
      <FieldContext.Provider value={context}>
        <div className={cn('flex flex-col gap-1', className)}>
          <span className="text-dl-sm font-semibold text-dl-fg">{label}</span>
          <div className={cn('flex items-center text-dl-sm text-dl-fg', VALUE_MIN_H_CLASS[size])}>
            {valueArea}
          </div>
        </div>
      </FieldContext.Provider>
    );
  }

  /**
   * disabled 모드는 편집 DOM 을 유지하되 필수 별표만 감춘다 — 채울 수 없는 칸에
   * "채워야 한다"는 신호가 남으면 안 된다(잠긴 칸이 placeholder 를 감추는 것과 같은 이유,
   * theme/utilities.css `dl-field-locked` 참조). error/help 는 받은 대로 그린다 —
   * 조용히 삼키면 호출부가 지웠다고 믿는 오류가 화면에서만 사라진다.
   */
  const requiredMark = required && mode !== 'disabled' ? <RequiredMark /> : null;

  const message = invalid ? (
    <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
  ) : help ? (
    // QA form-control-info__text.info: 12px · gray-6b
    <p id={`${htmlFor}-help`} className="mt-0.5 text-dl-xs text-dl-fg-muted">
      {help}
    </p>
  ) : null;

  if (layout === 'inline') {
    return (
      <FieldContext.Provider value={context}>
        {/* 라벨과 필드가 각각 grid item 이 된다 — 래퍼를 두면 트랙에 안 맞는다.
            필터 라벨만 QA filter-form 실측대로 회색(gray-6b)이다. */}
        <Label htmlFor={htmlFor} className="whitespace-nowrap py-2 pr-2 pl-3.5 text-dl-fg-label">
          {label}
          {requiredMark}
        </Label>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: 자손 입력의 버블링만 받는다. 자체 동작이 없다 */}
        <div
          className={cn('flex min-w-0 items-center gap-2 px-2 py-1.5', className)}
          onInput={handleDirty}
          onChange={handleDirty}
        >
          {children}
          {message}
        </div>
      </FieldContext.Provider>
    );
  }

  return (
    <FieldContext.Provider value={context}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: 자손 입력의 버블링만 받는다. 자체 동작이 없다 */}
      <div
        className={cn('flex flex-col gap-1', className)}
        onInput={handleDirty}
        onChange={handleDirty}
      >
        <Label htmlFor={htmlFor}>
          {label}
          {requiredMark}
        </Label>
        {children}
        {message}
      </div>
    </FieldContext.Provider>
  );
}
