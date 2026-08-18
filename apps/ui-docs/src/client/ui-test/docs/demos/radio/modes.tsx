'use client';

import { Field, FormMode, Radio, RadioGroup } from '@hvy/ui';

/**
 * RadioGroup 3모드 — view 는 **체크된 Radio 의 children(라벨)만** 남긴다.
 * 나머지 항목은 렌더하지 않고, 미선택 그룹이면 아무것도 안 그려 빈칸 규칙이 성립한다.
 *
 * 비제어(defaultValue)여도 view 가 체크 항목을 판정한다 — RadioGroup 이 내부적으로
 * 항상 controlled(useControllableState)이기 때문이다. gap·orientation 은 조회에서 무의미하다.
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function RadioModesDemo() {
  return (
    <div className="grid w-full max-w-4xl gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="우선순위" htmlFor={`rm-${mode}-priority`}>
              <RadioGroup id={`rm-${mode}-priority`} label="우선순위" defaultValue="normal">
                <Radio value="normal">일반</Radio>
                <Radio value="express">긴급</Radio>
              </RadioGroup>
            </Field>
            <Field label="재발송 사유 (미선택)" htmlFor={`rm-${mode}-reason`}>
              <RadioGroup id={`rm-${mode}-reason`} label="재발송 사유">
                <Radio value="lost">분실</Radio>
                <Radio value="damaged">파손</Radio>
              </RadioGroup>
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
