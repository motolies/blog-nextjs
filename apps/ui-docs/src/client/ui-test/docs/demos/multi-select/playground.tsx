'use client';

import { MultiSelect } from '@hvy/ui';
import { useState } from 'react';
import { BoolControl, EnumControl, PlaygroundGrid } from '../../../playground';

/**
 * MultiSelect 플레이그라운드 — 골라도 패널이 닫히지 않고, 선택 개수가 배지로 트리거에 남는다.
 * selectAllLabel 항목은 전체 선택/해제 토글이다. 비활성은 mode="disabled" 하나로 표기하고,
 * clearable 은 선택이 있을 때 캐럿 왼쪽에 × 를 내 전체 해제한다(이름은 clearAllLabel).
 *
 * 옵션 개수 컨트롤은 **임계값 두 개를 경계 양쪽에서** 보기 위한 것이다:
 *   · searchThreshold(10) — 5 에서는 검색 입력이 없고 12 에서 나타난다.
 *   · summaryThreshold(5) — 6개째를 고르는 순간 패널 상단에 선택 요약(칩)이 붙는다.
 * 120 은 검색으로 좁힌 뒤 전체 토글을 눌러 "검색 결과 전체" 사정권을 확인하는 자리다.
 */
const PRODUCT_OPTIONS = [
  { value: '1', label: '일반 상품' },
  { value: '2', label: '사은품' },
  { value: '3', label: '샘플' },
  { value: '4', label: '추가구성' },
  { value: '5', label: '세트 상품' },
];

/** I 는 숫자 1 과 혼동되어 창고 구역명에서 빠진다. */
const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];

/** 로케이션 120개 = 12구역 × 10단. value(`A-01`)도 검색 대상이다. */
const LOCATION_OPTIONS = ZONES.flatMap((zone) =>
  Array.from({ length: 10 }, (_, index) => {
    const stage = String(index + 1).padStart(2, '0');
    return { value: `${zone}-${stage}`, label: `${zone}구역 ${stage}단` };
  }),
);

/**
 * 12 는 120 의 앞부분을 그대로 자른 것이다 — 12↔120 의 차이가 **개수뿐**이어야
 * 검색·요약이 규모에 따라 어떻게 달라지는지가 목록 내용에 가려지지 않는다.
 */
const OPTION_SETS = {
  '5': PRODUCT_OPTIONS,
  '12': LOCATION_OPTIONS.slice(0, 12),
  '120': LOCATION_OPTIONS,
};

const OPTION_COUNTS = ['5', '12', '120'] as const;
type OptionCount = (typeof OPTION_COUNTS)[number];

export function MultiSelectPlaygroundDemo() {
  const [count, setCount] = useState<OptionCount>('5');
  const [value, setValue] = useState<readonly string[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [clearable, setClearable] = useState(false);

  const options = OPTION_SETS[count];
  const code = [
    `<MultiSelect options={${options.length}개} placeholder="전체" selectAllLabel="전체"`,
    disabled ? ' mode="disabled"' : '',
    clearable ? ' clearable' : '',
    ` />  // ${options.length > 10 ? '검색형' : '일반형'} · 선택 ${value.length}개`,
    value.length > 5 ? ' — 요약 칩 표시' : '',
  ].join('');

  return (
    <PlaygroundGrid
      controls={
        <>
          <EnumControl
            label="옵션 개수"
            value={count}
            options={OPTION_COUNTS}
            onChange={(next) => {
              // 세트가 바뀌면 고른 값이 무의미하다 — 제어형이라 리마운트로는 안 지워진다.
              setCount(next);
              setValue([]);
            }}
          />
          <BoolControl label='mode="disabled"' checked={disabled} onChange={setDisabled} />
          <BoolControl label="clearable" checked={clearable} onChange={setClearable} />
        </>
      }
      code={code}
    >
      <MultiSelect
        value={value}
        onValueChange={setValue}
        options={options}
        placeholder="전체"
        selectAllLabel="전체"
        mode={disabled ? 'disabled' : undefined}
        clearable={clearable}
        className="w-64"
      />
    </PlaygroundGrid>
  );
}
