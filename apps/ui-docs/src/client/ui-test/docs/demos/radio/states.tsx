'use client';

import { Radio, RadioGroup } from '@hvy/ui';
import { useState } from 'react';

/**
 * RadioGroup 상태 전수 — 20px 규격. 그룹에 label 이 없으면 스크린리더가 그룹을 못 읽는다.
 * 항목 하나는 Radio.disabled(항목 단위 — 유지된 prop), 그룹 전체는 mode="disabled" 로 잠근다.
 * checked+비활성 조합은 그룹을 분리해야 값이 살아 있다.
 */
export function RadioStatesDemo() {
  const [value, setValue] = useState('on');

  return (
    <div className="flex flex-col gap-2.5">
      <RadioGroup label="라디오 데모" value={value} onValueChange={setValue} orientation="vertical">
        <Radio value="on">Radio On</Radio>
        <Radio value="off">Radio Off</Radio>
        <Radio value="d1" disabled>
          Disabled
        </Radio>
      </RadioGroup>
      <RadioGroup label="라디오 비활성 데모" value="d2" onValueChange={() => {}} mode="disabled">
        <Radio value="d2">Disabled + Checked</Radio>
      </RadioGroup>
    </div>
  );
}
