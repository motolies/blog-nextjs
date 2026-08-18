'use client';

import { DateRangePicker, Field, FormMode } from '@hvy/ui';

/**
 * DateRangePicker 3모드 — 값 계약이 `YYYY-MM-DD` 문자열이라 view 는 그대로가 표시값이다.
 *
 * · view 는 `start ~ end` 한 스팬 — **한쪽만 있으면 그쪽만** 그린다.
 *   `~` 는 양쪽 값이 있을 때만 뜻이 있고, 양쪽 빈값이면 빈칸이다.
 * · disabled 모드: 입력 자신이 name·value 를 드므로 FormData 제외가 자동이고,
 *   **달력 버튼 두 개가 모두** 함께 잠긴다. lock 은 별개 축이다 — 모든 mode 를 이긴다.
 * · `Field` 의 `htmlFor` 는 **시작일 입력**에 걸린다 — 라벨을 눌러 시작일로 포커스가 간다.
 */
const MODES = ['edit', 'view', 'disabled'] as const;

export function DateRangePickerModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="조회 기간" htmlFor={`drpm-${mode}-period`}>
              <DateRangePicker defaultStart="2026-08-01" defaultEnd="2026-08-18" />
            </Field>
            <Field label="시작일만 입력됨" htmlFor={`drpm-${mode}-open`}>
              <DateRangePicker defaultStart="2026-08-01" />
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
