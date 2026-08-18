'use client';

import { RadioGroup as RadixRadioGroup } from 'radix-ui';
import { createContext, type ReactNode, useContext } from 'react';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';

/**
 * 라디오 — QA `custom-radio`: md 20px 원 · checked 는 primary 채움 + 흰 점 8px.
 * (5단은 체크박스와 같은 테마 스케일 유도 — 두 컨트롤이 나란히 놓이는 폼이 많다.)
 *
 * 키보드 이동(화살표) · roving tabindex · 그룹 의미는 Radix RadixRadioGroup 이 맡는다.
 * v3 시절에는 라디오가 명세에 없어 만들지 않았지만 QA 디자인이 명시해 추가했다.
 */

/** 원 크기 — 체크박스와 같은 토큰을 쓴다(QA 가 두 컨트롤을 같은 크기로 그린다). */
const CIRCLE_CLASS: Record<ControlSize, string> = {
  xs: 'size-dl-checkbox-xs',
  sm: 'size-dl-checkbox-sm',
  md: 'size-dl-checkbox-md',
  lg: 'size-dl-checkbox-lg',
  xl: 'size-dl-checkbox-xl',
};

/** 흰 점 — 원의 절반 언저리(QA md: 20 원에 8 점). */
const DOT_CLASS: Record<ControlSize, string> = {
  xs: 'size-1.5',
  sm: 'size-2',
  md: 'size-2',
  lg: 'size-2.5',
  xl: 'size-2.5',
};

/**
 * 그룹의 size·mode·현재값을 개별 Radio 로 내린다 — size 는 Radio 의 명시 prop 이 이긴다.
 * `value` 를 내리는 이유: view 모드에서 각 Radio 가 "내가 체크된 항목인가"를 스스로 판정한다 —
 * cloneElement 로 자식을 검사하지 않는 것(field.tsx 머리말)과 같은 이유로 컨텍스트 하향이다.
 */
const RadioGroupContext = createContext<{
  readonly size: ControlSize;
  readonly mode: FieldMode;
  readonly value: string;
}>({ size: 'md', mode: 'edit', value: '' });

export type RadioGroupProps = {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  /** 있으면 폼 전송에 실린다(Radix 가 hidden input 을 만든다). */
  readonly name?: string;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 그룹의 모든 Radio 에 내려간다(개별 Radio 의 명시 prop 이 이긴다). */
  readonly size?: ControlSize;
  readonly id?: string;
  /** 그룹 자체의 이름 — 라벨 요소가 따로 없으면 스크린리더가 그룹을 못 읽는다. */
  readonly label?: string;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly className?: string;
  readonly children: ReactNode;
};

export function RadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  name,
  disabled,
  invalid,
  size,
  id,
  label,
  orientation = 'horizontal',
  className,
  children,
}: RadioGroupProps) {
  // size 도 넘긴다 — 안 넘기면 Field 의 size 가 그룹에 도달하지 못한다.
  const field = useFieldControl({ id, invalid, size });
  /**
   * 값을 항상 알도록 관리형으로 둔다(Radix Root 에 controlled 로 전달) —
   * 비제어(defaultValue) 사용에서도 view 모드가 체크된 항목을 판정할 수 있다.
   */
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? '', onValueChange);

  if (field.mode === 'view') {
    // 체크된 Radio 만 라벨을 남긴다(판정은 각 Radio 가 컨텍스트로).
    // 미선택이면 아무것도 안 그려 빈칸 규칙이 성립한다. gap·orientation 은 조회에서 무의미하다.
    return (
      <FieldViewText size={field.size}>
        <RadioGroupContext.Provider value={{ size: field.size, mode: 'view', value }}>
          {children}
        </RadioGroupContext.Provider>
      </FieldViewText>
    );
  }

  return (
    <RadixRadioGroup.Root
      id={field.id}
      value={value}
      onValueChange={setValue}
      name={name}
      disabled={disabled || field.mode === 'disabled'}
      aria-label={label}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      orientation={orientation}
      className={cn(
        'flex gap-5',
        orientation === 'vertical' ? 'flex-col items-start' : 'items-center',
        className,
      )}
    >
      <RadioGroupContext.Provider value={{ size: field.size, mode: field.mode, value }}>
        {children}
      </RadioGroupContext.Provider>
    </RadixRadioGroup.Root>
  );
}

export type RadioProps = {
  readonly value: string;
  readonly disabled?: boolean;
  /** 5단 사이즈. 생략하면 그룹(RadioGroup)의 size 를 따른다. */
  readonly size?: ControlSize;
  /** 라벨 텍스트. 클릭 영역이 라벨까지 넓어진다. */
  readonly children: ReactNode;
  readonly className?: string;
};

export function Radio({ value, disabled, size: sizeProp, children, className }: RadioProps) {
  const group = useContext(RadioGroupContext);
  const size = sizeProp ?? group.size;

  if (group.mode === 'view') {
    // children 이 곧 라벨이다 — 체크된 항목만 그대로 남기고 나머지는 렌더하지 않는다.
    return group.value === value ? children : null;
  }

  return (
    // 비활성 라벨 글자는 QA 실측 #bbb — 값 글자(locked-fg)와 다른 전용 색이다.
    // biome-ignore lint/a11y/noLabelWithoutControl: 안의 RadixRadioGroup.Item 이 <button>(labelable)으로 렌더된다. 규칙은 input 계열만 정적으로 인식한다
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 text-dl-sm text-dl-fg',
        'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:text-dl-label-disabled',
        className,
      )}
    >
      <RadixRadioGroup.Item
        value={value}
        disabled={disabled}
        className={cn(
          CIRCLE_CLASS[size],
          'shrink-0 rounded-full border border-dl-outline-border bg-dl-surface transition-colors',
          // hover(활성 상태만): primary 보더 + 링(QA --shadow-action)
          'enabled:hover:border-dl-primary enabled:hover:shadow-dl-action',
          'data-[state=checked]:border-dl-primary data-[state=checked]:bg-dl-primary',
          // disabled off: 연회색 / disabled on: 하늘색(보더 없이 부드럽게)
          'data-[disabled]:border-dl-border data-[disabled]:bg-dl-check-disabled-off-bg',
          'data-[disabled]:data-[state=checked]:border-transparent data-[disabled]:data-[state=checked]:bg-dl-check-disabled-on-bg',
        )}
      >
        <RadixRadioGroup.Indicator className="flex size-full items-center justify-center">
          <span className={cn('rounded-full bg-dl-primary-fg', DOT_CLASS[size])} />
        </RadixRadioGroup.Indicator>
      </RadixRadioGroup.Item>
      {children}
    </label>
  );
}
