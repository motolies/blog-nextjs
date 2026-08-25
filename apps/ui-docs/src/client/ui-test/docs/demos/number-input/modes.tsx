'use client';

import { Field, FormMode, NumberInput } from '@hvy/ui';

/**
 * NumberInput 3모드 + lock — 열마다 `FormMode` 로 감은 정적 대비.
 *
 * 볼 것:
 * · view: 천단위 구분 텍스트만 남고 정렬(align)이 유지된다 · 빈값(null)은 빈칸
 * · disabled: 컨트롤이 남은 채 비활성 — hidden input 도 실리지 않는다(submits 가드)
 * · lock: readOnly + 자물쇠 — 어느 모드에서도 유지된다(lock 은 모든 mode 를 이긴다).
 *   값은 FormData 에 실린다 — 시스템이 채운 값은 저장에 함께 나가야 한다
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function NumberInputModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="첨부 용량" htmlFor={`nim-${mode}-amount`}>
              <NumberInput
                id={`nim-${mode}-amount`}
                align="left"
                decimalPlaces={2}
                defaultValue={1234567.89}
              />
            </Field>
            <Field label="빈 값" htmlFor={`nim-${mode}-empty`}>
              <NumberInput id={`nim-${mode}-empty`} align="left" placeholder="0" />
            </Field>
            <Field label="수수료율 (lock)" htmlFor={`nim-${mode}-fee`}>
              <NumberInput
                id={`nim-${mode}-fee`}
                align="left"
                lock
                decimalPlaces={1}
                defaultValue={2.5}
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
