'use client';

import { DateTimeRangePicker, Field, FormMode } from '@hvy/ui';

/**
 * DateTimeRangePicker 3모드 — 값 계약이 `YYYY-MM-DD HH:mm:ss` 문자열이라
 * view 는 그대로가 표시값이다.
 *
 * · view 는 `start ~ end` 한 스팬 — 한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸(DatePicker 계열과 같은 규칙).
 * · disabled 모드: FormData 제외가 자동이고 셸 배색과 **달력 버튼**도 함께 잠긴다.
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function DateTimeRangePickerModesDemo() {
  return (
    <div className="flex w-full flex-col gap-5">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="수집 기간" htmlFor={`dtrpm-${mode}-period`}>
              <DateTimeRangePicker
                defaultStart="2026-08-01 00:00:00"
                defaultEnd="2026-08-18 23:59:59"
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
