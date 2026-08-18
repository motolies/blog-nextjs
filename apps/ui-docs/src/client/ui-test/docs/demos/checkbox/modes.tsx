'use client';

import { Checkbox, Field, FormMode } from '@hvy/ui';

/**
 * Checkbox 3모드 — view 는 체크 모양이 아니라 **주입된 말**로 그린다.
 *
 * · 불리언 → 말 사전(`동의함`/`동의 안 함`)을 `ui` 는 모른다 — `viewLabels` 로 주입받는다.
 *   **view 모드인데 viewLabels 가 없으면 콘솔 경고 + 빈칸**이다(체크 모양만 남기면
 *   입력으로 오독된다). 이 데모는 콘솔을 더럽히지 않으려 미주입 케이스를 렌더하지 않는다.
 * · 비제어(defaultChecked)여도 view 가 현재값을 안다 — 내부가 useControllableState 로
 *   값을 미러링하는 관리형이기 때문이다(네이티브 onChange API 는 그대로).
 * · disabled 모드 배색은 dl-field-locked 가 아니라 체크박스 전용 disabled 토큰이다(QA 실측).
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function CheckboxModesDemo() {
  return (
    <div className="grid w-full max-w-4xl gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="개인정보 동의 (켜짐)" htmlFor={`cm-${mode}-on`}>
              <Checkbox
                id={`cm-${mode}-on`}
                defaultChecked
                viewLabels={{ on: '동의함', off: '동의 안 함' }}
              />
            </Field>
            <Field label="마케팅 수신 (꺼짐)" htmlFor={`cm-${mode}-off`}>
              <Checkbox id={`cm-${mode}-off`} viewLabels={{ on: '수신', off: '수신 안 함' }} />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
