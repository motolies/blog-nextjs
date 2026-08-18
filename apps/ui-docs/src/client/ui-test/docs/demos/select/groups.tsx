'use client';

import { Select, type SelectOption } from '@hvy/ui';

/**
 * 옵션 그룹 — 같은 group 은 연속 배치가 전제다(순서는 호출부 몫, ui 는 정렬하지 않는다).
 * 그룹에 속한 옵션은 들여써서 헤더가 상위 계층으로 읽힌다("기타"는 무그룹이라 안 들여쓴다).
 * 헤더는 시각 전용이라 키보드 이동·검색 인덱스에 끼어들지 않는다 —
 * 검색으로 좁히면 남은 옵션의 그룹 헤더만 따라 남는다.
 * clearable — 트리거 × 와 선택된 옵션 재클릭, 두 경로 모두 선택 취소다.
 */
const CARRIERS: readonly SelectOption[] = [
  { value: 'CJT', label: 'CJ대한통운', group: '국내 택배' },
  { value: 'LTT', label: '롯데택배', group: '국내 택배' },
  { value: 'HJT', label: '한진택배', group: '국내 택배' },
  { value: 'EMS', label: '우체국 EMS', group: '국제 특송' },
  { value: 'FDX', label: 'FedEx', group: '국제 특송' },
  { value: 'DHL', label: 'DHL', group: '국제 특송' },
  { value: 'UPS', label: 'UPS', group: '국제 특송' },
  { value: 'AIR', label: '항공 직송', group: '포워딩' },
  { value: 'SEA', label: '해상 직송', group: '포워딩' },
  { value: 'ETC', label: '기타' },
];

export function SelectGroupsDemo() {
  return (
    <div className="max-w-xs">
      <Select placeholder="배송사 선택" options={CARRIERS} searchThreshold={5} clearable />
    </div>
  );
}
