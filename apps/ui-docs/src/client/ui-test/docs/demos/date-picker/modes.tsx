'use client';

import { DatePicker, Field, FormMode } from '@hvy/ui';

/**
 * DatePicker 3모드 — 값 계약이 `YYYY-MM-DD` 문자열이라 view 는 그대로가 표시값이다.
 *
 * · view 는 값 텍스트만 남는다 — 미선택이면 placeholder 가 아니라 **빈칸**이다.
 * · disabled 모드: 입력 자신이 name·value 를 드므로 FormData 제외가 자동이고,
 *   달력 버튼도 함께 잠긴다. lock 은 별개 축이다 — 모든 mode 를 이겨 edit 로 돌아와도 잠긴 채다.
 *
 * 기간(range)의 3모드는 DateRangePicker 문서에 따로 있다.
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function DatePickerModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="작성일" htmlFor={`dpm-${mode}-writtenAt`}>
              <DatePicker id={`dpm-${mode}-writtenAt`} defaultValue="2026-08-18" />
            </Field>
            <Field label="미선택" htmlFor={`dpm-${mode}-empty`}>
              <DatePicker id={`dpm-${mode}-empty`} />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
