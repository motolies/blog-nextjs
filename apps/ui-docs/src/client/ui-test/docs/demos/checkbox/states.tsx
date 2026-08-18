'use client';

import { Checkbox } from '@hvy/ui';
import { useState } from 'react';

/**
 * Checkbox 상태 전수 — 20px 규격. hover 링(shadow-action)은 활성 상태에서만 뜨고,
 * 비활성은 off(연회색)와 on(하늘색)이 다른 배색이다(QA 실측).
 * indeterminate 는 DOM 프로퍼티라 그리드 전체선택의 "일부 선택" 표시에 쓰인다.
 */
export function CheckboxStatesDemo() {
  const [checked, setChecked] = useState(true);

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor="pg-cb" className="flex items-center gap-2 text-dl-sm">
        <Checkbox
          id="pg-cb"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        Checkbox
      </label>
      <label htmlFor="pg-cb-some" className="flex items-center gap-2 text-dl-sm">
        <Checkbox id="pg-cb-some" indeterminate readOnly checked={false} />
        일부 선택(indeterminate)
      </label>
      <label
        htmlFor="pg-cb-d1"
        className="flex items-center gap-2 text-dl-label-disabled text-dl-sm"
      >
        <Checkbox id="pg-cb-d1" disabled />
        Disabled
      </label>
      <label
        htmlFor="pg-cb-d2"
        className="flex items-center gap-2 text-dl-label-disabled text-dl-sm"
      >
        <Checkbox id="pg-cb-d2" checked readOnly disabled />
        Disabled + Checked
      </label>
    </div>
  );
}
