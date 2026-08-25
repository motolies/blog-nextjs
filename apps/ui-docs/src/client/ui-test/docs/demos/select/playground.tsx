'use client';

import { CONTROL_SIZES, type ControlSize, Select } from '@hvy/ui';
import { useState } from 'react';
import { expr, jsxTag } from '../../../code-snippet';
import {
  BoolControl,
  ControlGroup,
  EnumControl,
  NumberControl,
  PlaygroundGrid,
} from '../../../playground';

/**
 * Select 플레이그라운드 — 옵션이 searchThreshold 를 넘으면 검색형이 된다.
 * 겉모습은 같고 열었을 때 패널 최상단에 검색 입력이 고정된다. 트리거에는 직접 입력할 수 없다.
 *
 * 개수와 문턱을 **둘 다 축으로** 올렸다. 주석으로 "10이 문턱이다"를 읽는 것과, 문턱을 3으로
 * 내려 규칙이 실제로 그 수에서 갈리는 것을 보는 것은 다르다. 프리셋(9·10·11)이 있는 이유도
 * 경계가 한 칸 차이인데 자유 입력만으로는 아무도 그 칸을 밟아보지 않기 때문이다.
 *
 * 라벨 세트는 트리거 말줄임과 패널 폭 규칙을 보는 자리다 — 값과 라벨이 다른 세트(dup)에서는
 * 같은 라벨이 여러 개라 "무엇을 골랐는지" 가 라벨만으로는 구분되지 않는 것도 함께 드러난다.
 */

/** 한 데이터셋을 잘라 쓴다 — 개수 축의 차이가 오직 개수뿐이어야 검색 동작이 내용에 가려지지 않는다. */
const TAGS = [
  'React',
  'Next.js',
  'TypeScript',
  'CSS',
  'Tailwind',
  '테스트',
  '성능',
  '접근성',
  '디자인 시스템',
  'Spring',
  '데이터베이스',
  'DevOps',
  '회고',
  '번역',
  '오픈소스',
  '도구',
  '사례',
  '입문',
  '패턴',
  '함정',
];

const LABEL_SETS = ['short', 'long', 'dup'] as const;
const LABEL_SET_TEXT: Record<(typeof LABEL_SETS)[number], string> = {
  short: '짧은 라벨',
  long: '아주 긴 라벨',
  dup: '중복 라벨',
};

function buildOptions(count: number, set: (typeof LABEL_SETS)[number]) {
  return TAGS.slice(0, count).map((tag, index) => {
    const value = `t${index}`;
    if (set === 'long') {
      return { value, label: `${tag} — 트리거를 넘길 만큼 아주 긴 라벨 ${index + 1}` };
    }
    if (set === 'dup') return { value, label: index % 3 === 0 ? '공통 라벨' : tag };
    return { value, label: tag };
  });
}

export function SelectPlaygroundDemo() {
  const [count, setCount] = useState(3);
  const [searchThreshold, setSearchThreshold] = useState(10);
  const [labelSet, setLabelSet] = useState<(typeof LABEL_SETS)[number]>('short');
  const [size, setSize] = useState<ControlSize>('md');
  const [matchTriggerWidth, setMatchTriggerWidth] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [clearable, setClearable] = useState(false);
  const [value, setValue] = useState('');

  const options = buildOptions(count, labelSet);
  const searching = options.length > searchThreshold;

  const code = [
    jsxTag('Select', {
      options: expr(`options /* ${options.length}개 */`),
      placeholder: '전체',
      searchThreshold,
      size: size === 'md' ? undefined : size,
      matchTriggerWidth: matchTriggerWidth ? undefined : false,
      invalid,
      mode: disabled ? 'disabled' : undefined,
      clearable,
    }),
    `// ${searching ? '검색형 — 패널 상단에 검색 입력 고정' : '일반형'}`,
  ].join('\n');

  return (
    <PlaygroundGrid
      onReset={() => {
        setCount(3);
        setSearchThreshold(10);
        setLabelSet('short');
        setSize('md');
        setMatchTriggerWidth(true);
        setInvalid(false);
        setDisabled(false);
        setClearable(false);
        setValue('');
      }}
      controls={
        <>
          <ControlGroup title="규모" note="문턱을 넘나들며 검색형 전환을 본다">
            <NumberControl
              label="옵션 개수"
              value={count}
              onChange={(next) => {
                setCount(next);
                // 잘려 나간 옵션의 선택은 유령이 된다 — 제어형이라 리마운트로는 안 지워진다.
                if (Number(value.slice(1)) >= next) setValue('');
              }}
              min={1}
              max={TAGS.length}
              presets={[3, 9, 10, 11, 20]}
              hint={searching ? '검색형' : '일반형'}
            />
            <NumberControl
              label="검색 문턱"
              value={searchThreshold}
              onChange={setSearchThreshold}
              min={1}
              max={50}
              presets={[3, 10]}
            />
          </ControlGroup>
          <ControlGroup title="표시">
            <EnumControl
              label="라벨 세트"
              value={labelSet}
              options={LABEL_SETS}
              onChange={(next) => {
                setLabelSet(next);
                setValue('');
              }}
              optionLabel={(entry) => LABEL_SET_TEXT[entry]}
            />
            <EnumControl label="size" value={size} options={CONTROL_SIZES} onChange={setSize} />
            <BoolControl
              label="matchTriggerWidth"
              checked={matchTriggerWidth}
              onChange={setMatchTriggerWidth}
            />
          </ControlGroup>
          <ControlGroup title="상태">
            <BoolControl label="invalid" checked={invalid} onChange={setInvalid} />
            <BoolControl label='mode="disabled"' checked={disabled} onChange={setDisabled} />
            <BoolControl label="clearable" checked={clearable} onChange={setClearable} />
          </ControlGroup>
        </>
      }
      code={code}
    >
      <Select
        value={value}
        onValueChange={setValue}
        placeholder="전체"
        searchPlaceholder="검색"
        emptyLabel="검색 결과가 없습니다"
        options={options}
        searchThreshold={searchThreshold}
        size={size}
        matchTriggerWidth={matchTriggerWidth}
        invalid={invalid}
        mode={disabled ? 'disabled' : undefined}
        clearable={clearable}
        className="w-64"
      />
    </PlaygroundGrid>
  );
}
