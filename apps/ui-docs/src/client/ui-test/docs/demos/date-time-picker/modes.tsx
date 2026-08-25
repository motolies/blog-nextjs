'use client';

import { DateTimePicker, Field, FormMode } from '@hvy/ui';

/**
 * DateTimePicker 3모드 — 값 계약이 `YYYY-MM-DD HH:mm:ss` 문자열이라
 * view 는 그대로가 표시값이다.
 *
 * disabled 모드: 입력 자신이 name·value 를 드므로 FormData 제외가 자동이고,
 * 팝오버 버튼도 함께 잠긴다.
 *
 * 기간(range)의 3모드는 DateTimeRangePicker 문서에 따로 있다.
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function DateTimePickerModesDemo() {
  return (
    <div className="grid w-full gap-5 xl:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="발행일시" htmlFor={`dtm-${mode}-orderedAt`}>
              <DateTimePicker id={`dtm-${mode}-orderedAt`} defaultValue="2026-08-18 09:30:00" />
            </Field>
            <Field label="분 정밀도" htmlFor={`dtm-${mode}-minute`}>
              <DateTimePicker
                id={`dtm-${mode}-minute`}
                precision="minute"
                defaultValue="2026-08-18 09:30"
              />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
