'use client';

import { DateTimePicker, DateTimeRangePicker, Field, FormMode } from '@hvy/ui';

/**
 * DateTimePicker·DateTimeRangePicker 3모드 — 값 계약이 `YYYY-MM-DD HH:mm:ss` 문자열이라
 * view 는 그대로가 표시값이다. Range 규칙은 DatePicker 와 같다: `start ~ end`,
 * 한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸.
 *
 * disabled 모드: 입력 자신이 name·value 를 드므로 FormData 제외가 자동이고,
 * 끝마다 달린 팝오버 버튼도 함께 잠긴다.
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function DateTimePickerModesDemo() {
  return (
    <div className="grid w-full gap-5 xl:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="주문일시" htmlFor={`dtm-${mode}-orderedAt`}>
              <DateTimePicker id={`dtm-${mode}-orderedAt`} defaultValue="2026-08-18 09:30:00" />
            </Field>
            <Field label="집계 구간" htmlFor={`dtm-${mode}-window`}>
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
