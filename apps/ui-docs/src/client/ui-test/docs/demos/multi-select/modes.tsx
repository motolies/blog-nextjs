'use client';

import { Field, FormMode, MultiSelect } from '@hvy/ui';

/**
 * MultiSelect 3모드 — view 는 라벨(대응 option 이 없으면 raw value)을 쉼표로 잇는다.
 *
 * · 조인 순서는 **value 순서**다 — 트리거(선택된 것만 옵션 순서로 나열)와 달리
 *   값 배열이 든 순서 그대로라 누락 없이 그린다.
 * · 0개 선택이면 view 는 빈칸이다(placeholder 금지 규칙).
 * · disabled(칸의 mode="disabled" 명시든 FormMode 든)는 값마다 내던 hidden input 을 내지 않는다 — FormData 제외.
 */
const CARRIER_OPTIONS = [
  { value: 'CJ', label: 'CJ대한통운' },
  { value: 'HJ', label: '한진' },
  { value: 'LT', label: '롯데' },
];

const MODES = ['edit', 'view', 'disabled'] as const;

export function MultiSelectModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="태그" htmlFor={`mm-${mode}-carriers`}>
              <MultiSelect
                id={`mm-${mode}-carriers`}
                placeholder="전체"
                options={CARRIER_OPTIONS}
                defaultValue={['CJ', 'HJ']}
              />
            </Field>
            <Field label="제외 태그 (0개)" htmlFor={`mm-${mode}-excluded`}>
              <MultiSelect
                id={`mm-${mode}-excluded`}
                placeholder="전체"
                options={CARRIER_OPTIONS}
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
