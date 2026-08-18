'use client';

import { MultiSelect } from '@hvy/ui';
import { useState } from 'react';
import { BoolControl, PlaygroundGrid } from '../../../playground';

/**
 * MultiSelect 플레이그라운드 — 골라도 패널이 닫히지 않고, 선택 개수가 배지로 트리거에 남는다.
 * selectAllLabel 항목은 전체 선택/해제 토글이다.
 */
const PRODUCT_OPTIONS = [
  { value: '1', label: '일반 상품' },
  { value: '2', label: '사은품' },
  { value: '3', label: '샘플' },
  { value: '4', label: '추가구성' },
  { value: '5', label: '세트 상품' },
];

export function MultiSelectPlaygroundDemo() {
  const [value, setValue] = useState<readonly string[]>([]);
  const [disabled, setDisabled] = useState(false);

  const code = [
    `<MultiSelect value={[${value.join(', ')}]} selectAllLabel="전체"`,
    disabled ? ' disabled' : '',
    ' />',
  ].join('');

  return (
    <PlaygroundGrid
      controls={<BoolControl label="disabled" checked={disabled} onChange={setDisabled} />}
      code={code}
    >
      <MultiSelect
        value={value}
        onValueChange={setValue}
        options={PRODUCT_OPTIONS}
        placeholder="전체"
        selectAllLabel="전체"
        disabled={disabled}
        className="w-64"
      />
    </PlaygroundGrid>
  );
}
