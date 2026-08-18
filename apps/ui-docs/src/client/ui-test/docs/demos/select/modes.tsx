'use client';

import { Field, FormMode, NativeSelect, Select } from '@hvy/ui';

/**
 * Select 3모드 — view 는 code('KR')가 아니라 라벨('대한민국')을 **스스로 유도**한다.
 *
 * · 미선택 칸은 view 에서 placeholder 가 아니라 **빈칸**이다 — "고르라"는 입력 신호가
 *   조회 화면에 남으면 거짓말이 된다. 행 높이는 VALUE_MIN_H 가 유지한다.
 * · disabled(칸 disabled 든 FormMode disabled 든)는 hidden input 을 내지 않는다 —
 *   네이티브 컨트롤이 FormData 에서 빠지는 규약과 같다.
 * · NativeSelect 는 view 를 유도할 수 없다(선택 라벨이 children `<option>` 안) —
 *   **콘솔 경고 1회 후 편집 렌더를 유지**한다(조용한 빈칸 금지). 조회 모드가 필요한
 *   화면에서는 Select 를 쓴다. 아래 view 열의 경고가 그 의도된 동작이다.
 */
const COUNTRY_OPTIONS = [
  { value: 'KR', label: '대한민국' },
  { value: 'JP', label: '일본' },
  { value: 'US', label: '미국' },
];

const MODES = ['edit', 'view', 'disabled'] as const;

export function SelectModesDemo() {
  return (
    <div className="grid w-full gap-5 md:grid-cols-3">
      {MODES.map((mode) => (
        <FormMode key={mode} value={mode}>
          <div className="flex flex-col gap-4">
            <p className="text-dl-xs font-semibold text-dl-fg-muted">{mode}</p>
            <Field label="국가" htmlFor={`slm-${mode}-country`}>
              <Select
                id={`slm-${mode}-country`}
                placeholder="선택"
                options={COUNTRY_OPTIONS}
                defaultValue="KR"
              />
            </Field>
            <Field label="창고 (미선택)" htmlFor={`slm-${mode}-warehouse`}>
              <Select
                id={`slm-${mode}-warehouse`}
                placeholder="선택"
                options={[
                  { value: 'ICN', label: '인천 1센터' },
                  { value: 'GMP', label: '김포 2센터' },
                ]}
              />
            </Field>
            <Field label="정렬 기준 (NativeSelect)" htmlFor={`slm-${mode}-sort`}>
              <NativeSelect id={`slm-${mode}-sort`} defaultValue="date">
                <option value="date">주문일순</option>
                <option value="name">수취인순</option>
              </NativeSelect>
            </Field>
          </div>
        </FormMode>
      ))}
    </div>
  );
}
