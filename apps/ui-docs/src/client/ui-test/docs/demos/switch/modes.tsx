'use client';

import { Field, FormMode, Switch } from '@hvy/ui';
import { useState } from 'react';

/**
 * Switch 3모드 — view 는 트랙이 아니라 **주입된 말**(`viewLabels`)로 그린다.
 * 누락 시 콘솔 경고 + 빈칸(Checkbox 와 같은 규칙 — `ui` 는 사전을 모른다).
 *
 * Switch 는 `<button role="switch">` 라 **어느 모드에서도 FormData 에 없다** —
 * 전송이 필요하면 호출부가 값을 폼 상태로 든다. 이 데모는 세 열이 한 상태를 공유하도록
 * controlled 로 묶었다 — edit 열을 켜고 끄면 view 열의 문구가 함께 바뀐다
 * (관리형이라 비제어 defaultChecked 도 되지만, 그러면 열마다 상태가 따로 논다).
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function SwitchModesDemo() {
  const [notify, setNotify] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);

  return (
    <div className="grid w-full max-w-4xl gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="알림 수신" htmlFor={`swm-${mode}-notify`}>
              <Switch
                id={`swm-${mode}-notify`}
                label="알림 수신"
                checked={notify}
                onCheckedChange={setNotify}
                viewLabels={{ on: '수신', off: '수신 안 함' }}
              />
            </Field>
            <Field label="초안 자동 저장" htmlFor={`swm-${mode}-print`}>
              <Switch
                id={`swm-${mode}-print`}
                label="초안 자동 저장"
                checked={autoPrint}
                onCheckedChange={setAutoPrint}
                viewLabels={{ on: '자동 출력', off: '수동 출력' }}
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
