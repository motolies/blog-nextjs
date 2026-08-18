'use client';

import { MultiSelect, type SelectOption } from '@hvy/ui';

/**
 * 옵션 그룹 — Select 와 같은 계약(SelectOption.group). 전체 토글 행은 그룹 밖이다.
 * 헤더는 시각 전용이라 전체 토글·검색·키보드 이동이 그룹을 몰라도 그대로 동작한다.
 */
const CARRIERS: readonly SelectOption[] = [
  { value: 'CJT', label: 'CJ대한통운', group: '국내 택배' },
  { value: 'LTT', label: '롯데택배', group: '국내 택배' },
  { value: 'EMS', label: '우체국 EMS', group: '국제 특송' },
  { value: 'FDX', label: 'FedEx', group: '국제 특송' },
  { value: 'DHL', label: 'DHL', group: '국제 특송' },
];

export function MultiSelectGroupsDemo() {
  return (
    <div className="max-w-xs">
      <MultiSelect placeholder="전체" options={CARRIERS} selectAllLabel="전체" />
    </div>
  );
}
