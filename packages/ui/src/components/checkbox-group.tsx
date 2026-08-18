'use client';

import { Fragment, type ReactNode, useId } from 'react';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { useControllableState } from '../lib/useControllableState';
import { Checkbox } from './checkbox';
import { FieldViewText, useFieldControl } from './field';
import type { FieldMode } from './form-mode';

/**
 * 체크박스 그룹 — `RadioGroup` 의 다중 선택 대칭이다.
 *
 * 다중 코드값 검색조건(서비스타입 복수 선택 등)을 앱이 Checkbox 나열로 수동 조립하던
 * 것을 흡수한다. 값 계약은 `readonly string[]` — 관리형이라 비제어에서도 view 가
 * 성립한다(선택형 컨트롤 공통 규약).
 *
 * 폼 전송은 **네이티브 체크박스의 name/value 규약** 그대로다: `name` 이 있으면 각
 * 항목의 네이티브 input 이 `value` 를 갖고, 체크된 것만 `formData.getAll(name)` 에
 * 실린다(MultiSelect 의 hidden input 복수 방출과 같은 결과를 네이티브가 낸다).
 * disabled 모드의 미전송도 네이티브 규약이 자동으로 이행한다.
 *
 * `RadioGroup` 과 달리 children 합성이 아니라 **options 배열**이다 — view 모드가
 * 선택 라벨들을 join 해 그려야 해서 그룹이 라벨을 알아야 한다(Select 와 같은 이유).
 */

export type CheckboxGroupOption = {
  readonly value: string;
  readonly label: ReactNode;
  /** 이 항목만 잠근다 — 컨트롤의 mode="disabled" 축으로 내려간다. */
  readonly disabled?: boolean;
};

export type CheckboxGroupProps = {
  /** 주면 controlled. 선택된 값들의 배열이다. */
  readonly value?: readonly string[];
  readonly defaultValue?: readonly string[];
  readonly onValueChange?: (value: readonly string[]) => void;
  /** 있으면 체크된 항목의 value 가 전부 실린다 — 서버는 `formData.getAll(name)`. */
  readonly name?: string;
  readonly options: readonly CheckboxGroupOption[];
  /** 폼 모드. 생략하면 감싼 `Field`/`FormMode` 를 따른다 — 명시하면 폼이 view 여도 이긴다. */
  readonly mode?: FieldMode;
  readonly invalid?: boolean;
  /** 5단 사이즈 — 그룹의 모든 체크박스에 내려간다. */
  readonly size?: ControlSize;
  readonly id?: string;
  /** 그룹 자체의 이름 — 라벨 요소가 따로 없으면 스크린리더가 그룹을 못 읽는다. */
  readonly label?: string;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly className?: string;
};

export function CheckboxGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  name,
  options,
  mode,
  invalid,
  size,
  id,
  label,
  orientation = 'horizontal',
  className,
}: CheckboxGroupProps) {
  // size 도 넘긴다 — 안 넘기면 Field 의 size 가 그룹에 도달하지 못한다(RadioGroup 규약).
  const field = useFieldControl({ id, invalid, size, mode });
  const [value, setValue] = useControllableState<readonly string[]>(
    valueProp,
    defaultValue ?? [],
    onValueChange,
  );
  /**
   * 항목별 고유 id — 안쪽 Checkbox 가 컨텍스트의 Field id 로 폴백해 **중복 id** 가
   * 되는 것을 막는다. 첫 항목만 Field 의 id 를 받아 라벨 클릭·htmlFor 연결이 살아 있다.
   */
  const generatedId = useId();

  if (field.state.view) {
    // 선택된 라벨을 순서대로 join — 미선택이면 빈칸(placeholder 금지 규칙).
    const selected = options.filter((option) => value.includes(option.value));
    return (
      <FieldViewText size={field.size}>
        {selected.length === 0
          ? null
          : selected.map((option, index) => (
              <Fragment key={option.value}>
                {index > 0 ? ', ' : null}
                {option.label}
              </Fragment>
            ))}
      </FieldViewText>
    );
  }

  const toggle = (optionValue: string, checked: boolean) => {
    setValue(
      checked ? [...value, optionValue] : value.filter((current) => current !== optionValue),
    );
    field.notifyDirty();
  };

  return (
    // fieldset — 체크박스 묶음의 시멘틱 그룹. required 는 그룹 role 이 지원하지 않아
    // 시각(RequiredMark)과 개별 검증에 맡긴다. preflight 가 기본 보더·여백을 지워 flex 가 선다.
    <fieldset
      aria-label={label}
      aria-invalid={field['aria-invalid']}
      aria-describedby={field['aria-describedby']}
      {...field.state.dataProps}
      className={cn(
        'flex gap-5',
        orientation === 'vertical' ? 'flex-col items-start' : 'items-center',
        className,
      )}
    >
      {options.map((option, index) => (
        // biome-ignore lint/a11y/noLabelWithoutControl: 안의 Checkbox 가 네이티브 <input type="checkbox"> 를 렌더한다. 규칙은 컴포넌트 경계 너머를 정적으로 못 본다
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-center gap-2 text-dl-fg text-dl-sm',
            'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:text-dl-label-disabled',
          )}
        >
          <Checkbox
            id={index === 0 ? field.id : `${generatedId}-${index}`}
            size={field.size}
            // 항목 잠금은 mode 축 하나로 내린다 — disabled boolean prop 은 타입에서 제거된 축이다.
            mode={option.disabled ? 'disabled' : field.mode}
            checked={value.includes(option.value)}
            onChange={(event) => toggle(option.value, event.currentTarget.checked)}
            name={name}
            value={option.value}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
