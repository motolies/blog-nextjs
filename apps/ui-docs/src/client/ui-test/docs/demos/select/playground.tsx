'use client';

import { Select } from '@hvy/ui';
import { useState } from 'react';
import { BoolControl, PlaygroundGrid } from '../../../playground';

/**
 * Select 플레이그라운드 — 옵션이 searchThreshold(10)를 넘으면 검색형이 된다.
 * 겉모습은 같고 열었을 때 패널 최상단에 검색 입력이 고정된다. 트리거에는 직접 입력할 수 없다.
 * 비활성은 mode="disabled" 하나로 표기하고, clearable 은 값이 있을 때 캐럿 왼쪽에 × 를 낸다.
 */
const SHORT_OPTIONS = [
  { value: 'AIR', label: '항공' },
  { value: 'SEA', label: '해상' },
  { value: 'EXP', label: '특송' },
];

/** 14개 — searchThreshold(10)를 넘겨 검색형 셀렉트가 된다. */
const LONG_OPTIONS = [
  ['KR', 'South Korea'],
  ['AD', 'Andorra'],
  ['AE', 'United Arab Emirates'],
  ['AU', 'Australia'],
  ['BR', 'Brazil'],
  ['CA', 'Canada'],
  ['CN', 'China'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['GB', 'United Kingdom'],
  ['JP', 'Japan'],
  ['SG', 'Singapore'],
  ['US', 'United States'],
  ['VN', 'Viet Nam'],
].map(([code, name]) => ({ value: code ?? '', label: `[${code}]${name}` }));

export function SelectPlaygroundDemo() {
  const [manyOptions, setManyOptions] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [clearable, setClearable] = useState(false);

  const options = manyOptions ? LONG_OPTIONS : SHORT_OPTIONS;
  const code = [
    `<Select options={${options.length}개} placeholder="전체"`,
    invalid ? ' invalid' : '',
    disabled ? ' mode="disabled"' : '',
    clearable ? ' clearable' : '',
    ` />  // ${options.length > 10 ? '검색형 — 패널 상단에 검색 입력 고정' : '일반형'}`,
  ].join('');

  return (
    <PlaygroundGrid
      controls={
        <>
          <BoolControl label="옵션 14개" checked={manyOptions} onChange={setManyOptions} />
          <BoolControl label="invalid" checked={invalid} onChange={setInvalid} />
          <BoolControl label='mode="disabled"' checked={disabled} onChange={setDisabled} />
          <BoolControl label="clearable" checked={clearable} onChange={setClearable} />
        </>
      }
      code={code}
    >
      {/* 옵션 세트가 바뀌면 고른 값이 무의미하다 — key 로 리마운트해 초기화한다 */}
      <Select
        key={String(manyOptions)}
        placeholder="전체"
        searchPlaceholder="검색"
        emptyLabel="검색 결과가 없습니다"
        options={options}
        invalid={invalid}
        mode={disabled ? 'disabled' : undefined}
        clearable={clearable}
        className="w-64"
      />
    </PlaygroundGrid>
  );
}
