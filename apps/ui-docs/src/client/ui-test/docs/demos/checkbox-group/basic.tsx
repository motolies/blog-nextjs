'use client';

import { CheckboxGroup, type CheckboxGroupOption, Field, FormMode } from '@hvy/ui';
import { useState } from 'react';

const SERVICE_OPTIONS: readonly CheckboxGroupOption[] = [
  { value: 'AIR', label: '항공' },
  { value: 'SEA', label: '해상' },
  { value: 'EXP', label: '특송' },
  { value: 'GRD', label: '지상', disabled: true },
];

/**
 * 기본 — 값 계약이 readonly string[] 인 관리형 그룹.
 * name 이 있으면 체크된 항목의 value 가 네이티브 규약으로 전부 실린다 —
 * 서버는 formData.getAll(name). 항목 잠금은 disabled boolean 이 아니라
 * option.disabled → mode="disabled" 축으로 내려간다.
 */
export function CheckboxGroupBasicDemo() {
  const [value, setValue] = useState<readonly string[]>(['AIR']);
  return (
    <div className="flex flex-col gap-2">
      <CheckboxGroup
        label="서비스 타입"
        name="serviceTypes"
        options={SERVICE_OPTIONS}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-dl-fg-muted text-dl-xs">값: [{value.join(', ') || '없음'}]</p>
    </div>
  );
}

/**
 * 3모드 — view 는 선택 라벨을 ", " 로 join 한 텍스트만 남는다(미선택이면 빈칸).
 * disabled 는 네이티브 규약대로 FormData 에서도 빠진다.
 */
export function CheckboxGroupModesDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {(['edit', 'view', 'disabled'] as const).map((mode) => (
        <FormMode key={mode} value={mode}>
          <Field label={`mode="${mode}"`} htmlFor={`cbg-${mode}`}>
            <CheckboxGroup
              id={`cbg-${mode}`}
              label="서비스 타입"
              options={SERVICE_OPTIONS}
              defaultValue={['AIR', 'SEA']}
            />
          </Field>
        </FormMode>
      ))}
    </div>
  );
}
