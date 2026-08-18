'use client';

import { MultiSelect } from '@hvy/ui';
import { useState } from 'react';

/**
 * 대량 목록 — 120개 중 다중 선택. 실사용(센터 선택) 규모다.
 *
 * 5개짜리 플레이그라운드에서는 드러나지 않는 세 가지를 여기서 확인한다:
 *   · 120 > searchThreshold(10) 라 **검색 입력이 자동으로** 붙는다.
 *   · 선택이 summaryThreshold(5)를 넘으면 패널 상단에 선택 요약(칩 + ✕)이 붙는다 —
 *     열자마자 20개가 선택되어 있으므로 요약이 처음부터 보인다. 칩의 ✕ 로 하나 빼도
 *     패널이 닫히지 않는다(포커스를 패널 안으로 되돌린다).
 *   · 검색 중 전체 토글은 사정권이 "검색 결과"로 바뀐다 — 배지가 그 개수를 낸다.
 *     "냉장" 으로 좁힌 뒤 전체 토글을 누르면 그 12개만 **더해지고** 나머지 선택은 유지된다.
 */
const REGIONS = [
  '서울',
  '부산',
  '인천',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '전북',
];

const KINDS = ['1센터', '2센터', '3센터', '냉장', '냉동', '반품', '통관', '보세', '직구', '역직구'];

/** 120개 = 12지역 × 10유형. value 도 검색 대상이라 코드(`C0104`)로도 찾힌다. */
const CENTER_OPTIONS = REGIONS.flatMap((region, regionIndex) =>
  KINDS.map((kind, kindIndex) => ({
    value: `C${String(regionIndex + 1).padStart(2, '0')}${String(kindIndex + 1).padStart(2, '0')}`,
    label: `${region} ${kind}`,
  })),
);

/** 초기 선택 20개 — "120개 중 20개" 상태를 열자마자 보여준다(요약 영역이 곧바로 뜬다). */
const INITIAL_SELECTION = CENTER_OPTIONS.filter((_, index) => index % 6 === 0).map(
  (option) => option.value,
);

export function MultiSelectBulkDemo() {
  const [value, setValue] = useState<readonly string[]>(INITIAL_SELECTION);

  return (
    <MultiSelect
      value={value}
      onValueChange={setValue}
      options={CENTER_OPTIONS}
      placeholder="전체"
      selectAllLabel="전체"
      className="w-80"
    />
  );
}
