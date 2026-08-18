'use client';

import { Check } from 'lucide-react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode, Ref } from 'react';
import { useEffect, useRef } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { warnOnce } from '../lib/warnOnce';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';

/**
 * 체크박스 — QA `custom-checkbox`: md 20×20 커스텀 박스(5단은 테마 스케일 유도).
 *
 * QA 의 상태(hover 링 · checked+disabled 하늘색 배경)는 `accent-color` 로 표현할 수
 * 없어 커스텀으로 그린다. 다만 **네이티브 `<input>` 은 그대로 살아 있다** —
 * 투명하게 겹쳐 두고 시각만 형제 span 이 맡으므로 키보드·스크린리더·폼 전송·
 * indeterminate 는 전부 네이티브 동작이다. peer 선택자가 상태를 시각에 전달한다.
 */
const BOX_CLASS: Record<ControlSize, string> = {
  xs: 'size-dl-checkbox-xs',
  sm: 'size-dl-checkbox-sm',
  md: 'size-dl-checkbox-md',
  lg: 'size-dl-checkbox-lg',
  xl: 'size-dl-checkbox-xl',
};

/** 체크 글리프 — 박스의 절반 언저리. Icon 기본 클래스를 twMerge 가 덮는다. */
const GLYPH_CLASS: Record<ControlSize, string> = {
  xs: 'size-2.5',
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-3.5',
  xl: 'size-4',
};

/** indeterminate 가로 막대 — 박스 폭의 절반 언저리. */
const BAR_CLASS: Record<ControlSize, string> = {
  xs: 'h-0.5 w-2',
  sm: 'h-0.5 w-2',
  md: 'h-0.5 w-2.5',
  lg: 'h-0.5 w-3',
  xl: 'h-0.5 w-3',
};

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'disabled'
> & {
  ref?: Ref<HTMLInputElement>;
  /**
   * 일부만 선택된 상태. **DOM 프로퍼티라 속성으로 줄 수 없어** effect 로 넣는다 —
   * 그리드 전체선택에서 이게 없으면 "일부 선택"이 "전체 선택"으로 보인다.
   */
  readonly indeterminate?: boolean;
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  /** Field 밖에서 단독으로 쓸 때만. Field 안이면 컨텍스트가 이긴다. 배색은 QA 미규정이라 aria 만 단다. */
  readonly invalid?: boolean;
  /** 5단 사이즈 — 기본 md(20). 생략하면 감싼 `Field` 의 size 를 따른다. */
  readonly size?: ControlSize;
  /** view 모드 표시 문구. `ui` 는 사전을 모른다 — 주입받는다. 없으면 개발 경고 + 빈칸. */
  readonly viewLabels?: { readonly on: ReactNode; readonly off: ReactNode };
};

export function Checkbox({
  className,
  indeterminate = false,
  mode,
  invalid,
  size,
  viewLabels,
  id,
  checked: checkedProp,
  defaultChecked,
  onChange,
  ...props
}: CheckboxProps) {
  // invalid·size 도 넘긴다 — 안 넘기면 Field 의 오류·사이즈가 체크박스에 도달하지 못한다.
  const field = useFieldControl({ id, invalid, size, mode });
  const ref = useRef<HTMLInputElement>(null);

  /**
   * 값을 내부에서도 추적한다(관리형) — **네이티브 API 는 그대로다**(onChange 미러링만).
   * 비제어 사용에서도 view 모드가 현재값을 알고, view↔edit 왕복 시 remount 의
   * defaultChecked 로 되살아난다. 텍스트 입력과 달리 불리언이라 IME·성능 비용이 없다.
   */
  const [checked, setChecked] = useControllableState<boolean>(
    checkedProp as boolean | undefined,
    Boolean(defaultChecked),
  );
  const isControlled = checkedProp !== undefined;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  if (field.state.view) {
    // 불리언 → 말 사전을 ui 가 모른다. 문구 없이 체크 모양만 남기면 입력으로 오독된다.
    if (!viewLabels) {
      warnOnce(
        `checkbox-view-no-labels:${id ?? field.id ?? 'unknown'}`,
        'view 모드의 Checkbox 에 viewLabels 가 없습니다. { on, off } 표시 문구를 주입해 주세요.',
      );
      return <FieldViewText size={field.size} />;
    }
    return (
      <FieldViewText size={field.size}>{checked ? viewLabels.on : viewLabels.off}</FieldViewText>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.currentTarget.checked);
    onChange?.(event);
  };

  return (
    <span
      className={cn('relative inline-flex shrink-0', BOX_CLASS[field.size], className)}
      {...field.state.dataProps}
    >
      {/* 진짜 컨트롤 — 보이지 않지만 클릭·키보드·폼 전송을 전부 받는다. */}
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 z-[1] size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        id={field.id}
        checked={isControlled ? checkedProp : undefined}
        // 비제어 remount(view↔edit 왕복)에서 미러링된 현재값으로 되살린다 — mount 시에만 읽힌다.
        defaultChecked={isControlled ? undefined : checked}
        onChange={handleChange}
        aria-invalid={field['aria-invalid']}
        aria-describedby={field['aria-describedby']}
        aria-required={field.required || undefined}
        disabled={field.state.disabled}
        {...props}
      />
      {/* 박스 — 상태는 전부 peer(input)에서 온다. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-dl-control border border-dl-outline-border bg-dl-surface transition-colors',
          // hover(활성 상태만) · 키보드 포커스: primary 보더 + 링(QA --shadow-action)
          'peer-[:hover:not(:disabled)]:border-dl-primary peer-[:hover:not(:disabled)]:shadow-dl-action',
          'peer-focus-visible:border-dl-primary peer-focus-visible:shadow-dl-action',
          'peer-checked:border-dl-primary peer-checked:bg-dl-primary',
          'peer-indeterminate:border-dl-primary peer-indeterminate:bg-dl-primary',
          // disabled off: 연회색 / disabled on: 하늘색(보더 없이 부드럽게) — QA 실측
          'peer-disabled:border-dl-border peer-disabled:bg-dl-check-disabled-off-bg',
          'peer-disabled:peer-checked:border-transparent peer-disabled:peer-checked:bg-dl-check-disabled-on-bg',
          'peer-disabled:peer-indeterminate:border-transparent peer-disabled:peer-indeterminate:bg-dl-check-disabled-on-bg',
        )}
      />
      {/* 체크 글리프 — checked 일 때만. indeterminate 가 이기도록 그때는 감춘다. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden items-center justify-center text-dl-primary-mark peer-checked:flex peer-indeterminate:hidden"
      >
        <Icon icon={Check} className={GLYPH_CLASS[field.size]} />
      </span>
      {/* indeterminate 글리프 — 가로 막대. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden items-center justify-center peer-indeterminate:flex"
      >
        <span className={cn('rounded-dl-pill bg-dl-primary-mark', BAR_CLASS[field.size])} />
      </span>
    </span>
  );
}
