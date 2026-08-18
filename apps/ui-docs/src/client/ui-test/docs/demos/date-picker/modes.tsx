'use client';

import { DatePicker, DateRangePicker, Field, FormMode } from '@hvy/ui';

/**
 * DatePicker·DateRangePicker 3모드 — 값 계약이 `YYYY-MM-DD` 문자열이라 view 는 그대로가 표시값이다.
 *
 * · Range 의 view 는 `start ~ end` 한 스팬 — **한쪽만 있으면 그쪽만** 그린다.
 *   `~` 는 양쪽 값이 있을 때만 뜻이 있고, 양쪽 빈값이면 빈칸이다.
 * · disabled 모드: 입력 자신이 name·value 를 드므로 FormData 제외가 자동이고,
 *   달력 버튼도 함께 잠긴다(lock 과 OR 합성 — mode 는 lock 을 잠복시킬 뿐 지우지 않는다).
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function DatePickerModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="주문일" htmlFor={`dpm-${mode}-orderDate`}>
              <DatePicker id={`dpm-${mode}-orderDate`} defaultValue="2026-08-18" />
            </Field>
            <Field label="조회 기간" htmlFor={`dpm-${mode}-period`}>
              <DateRangePicker defaultStart="2026-08-01" defaultEnd="2026-08-18" />
            </Field>
            <Field label="시작일만 입력됨" htmlFor={`dpm-${mode}-open`}>
              <DateRangePicker defaultStart="2026-08-01" />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
