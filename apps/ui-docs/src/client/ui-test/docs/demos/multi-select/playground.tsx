'use client';

import { MultiSelect } from '@hvy/ui';
import { useState } from 'react';
import { expr, jsxTag } from '../../../code-snippet';
import { BoolControl, ControlGroup, NumberControl, PlaygroundGrid } from '../../../playground';

/**
 * MultiSelect 플레이그라운드 — 골라도 패널이 닫히지 않고, 선택 개수가 배지로 트리거에 남는다.
 * selectAllLabel 항목은 전체 선택/해제 토글이다. 비활성은 mode="disabled" 하나로 표기하고,
 * clearable 은 선택이 있을 때 캐럿 왼쪽에 × 를 내 전체 해제한다(이름은 clearAllLabel).
 *
 * 이 데모의 축은 **임계값을 경계 양쪽에서 밟아 보는 것**이다:
 *   · searchThreshold — 이 수를 넘으면 패널 상단에 검색 입력이 고정된다(기본 10).
 * 문턱 자체도 컨트롤로 올려 두었다. 주석으로 "10이 문턱이다"를 읽는 것과, 문턱을 3으로
 * 내려 규칙이 실제로 그 수에서 갈리는 것을 보는 것은 다르다.
 * 선택 요약(칩)에는 문턱이 없다 — 하나만 골라도 패널 상단에 붙고 0개가 되면 사라진다.
 * (한때 summaryThreshold 가 있었지만 6개째에서 갑자기 패널이 자라는 쪽이 더 낯설어 걷어냈다.)
 *
 * 개수 프리셋(5 · 10 · 11 · 120)이 자유 입력과 함께 있는 이유: 경계는 10↔11 한 칸 차이인데
 * 자유 입력만으로는 아무도 그 한 칸을 밟아보지 않는다.
 */

/** 주제 12개 — 태그 슬러그의 앞자리가 된다. */
const TOPICS = [
  'react',
  'nextjs',
  'css',
  'spring',
  'database',
  'devops',
  'testing',
  'a11y',
  'perf',
  'docs',
  'tooling',
  'retro',
];

const FACETS = [
  '입문',
  '패턴',
  '함정',
  '성능',
  '테스트',
  '마이그레이션',
  '회고',
  '번역',
  '도구',
  '사례',
];

/**
 * 태그 120개 = 12주제 × 10성격. value(`react-03`)도 검색 대상이다.
 *
 * **하나의 데이터셋을 잘라 쓴다.** 개수 축의 차이가 오직 개수뿐이어야 검색·요약이 규모에
 * 따라 어떻게 달라지는지가 목록 내용에 가려지지 않는다 — 5개일 때만 다른 어휘를 쓰면
 * "검색이 붙지 않은 것"이 개수 때문인지 내용 때문인지 구분할 수 없다.
 */
const TAG_OPTIONS = TOPICS.flatMap((topic) =>
  FACETS.map((facet, facetIndex) => ({
    value: `${topic}-${String(facetIndex + 1).padStart(2, '0')}`,
    label: `${topic} · ${facet}`,
  })),
);

export function MultiSelectPlaygroundDemo() {
  const [count, setCount] = useState(5);
  const [searchThreshold, setSearchThreshold] = useState(10);
  const [value, setValue] = useState<readonly string[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [clearable, setClearable] = useState(false);

  const options = TAG_OPTIONS.slice(0, count);
  const searching = options.length > searchThreshold;

  const code = [
    jsxTag('MultiSelect', {
      options: expr(`TAG_OPTIONS /* ${options.length}개 */`),
      placeholder: '전체',
      selectAllLabel: '전체',
      searchThreshold,
      mode: disabled ? 'disabled' : undefined,
      clearable,
    }),
    `// ${searching ? '검색형' : '일반형'} · 선택 ${value.length}개${
      value.length > 0 ? ' — 요약 칩 표시' : ''
    }`,
  ].join('\n');

  return (
    <PlaygroundGrid
      controls={
        <>
          <ControlGroup title="규모" note="임계값을 경계 양쪽에서 밟아 본다">
            <NumberControl
              label="옵션 개수"
              value={count}
              onChange={(next) => {
                setCount(next);
                // 잘려 나간 옵션의 선택은 유령이 된다 — 배지 숫자에만 남고 목록엔 없다.
                // 제어형이라 리마운트로는 안 지워지므로 여기서 직접 걸러낸다.
                const alive = new Set(TAG_OPTIONS.slice(0, next).map((option) => option.value));
                setValue((previous) => previous.filter((entry) => alive.has(entry)));
              }}
              min={1}
              max={TAG_OPTIONS.length}
              presets={[5, 10, 11, 120]}
              hint={searching ? '검색형 — 패널 상단 검색 입력 고정' : '일반형 — 검색 입력 없음'}
            />
            <NumberControl
              label="검색 문턱"
              value={searchThreshold}
              onChange={setSearchThreshold}
              min={1}
              max={200}
              presets={[3, 10]}
            />
          </ControlGroup>
          <ControlGroup title="상태">
            <BoolControl label='mode="disabled"' checked={disabled} onChange={setDisabled} />
            <BoolControl label="clearable" checked={clearable} onChange={setClearable} />
          </ControlGroup>
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
        searchThreshold={searchThreshold}
        mode={disabled ? 'disabled' : undefined}
        clearable={clearable}
        className="w-64"
      />
    </PlaygroundGrid>
  );
}
