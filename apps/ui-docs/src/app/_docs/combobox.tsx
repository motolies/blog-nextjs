import type { ComboboxProps } from '@hvy/ui';
import { ComboboxBasicDemo } from '../../client/ui-test/docs/demos/combobox/basic';
import { ComboboxCreateDemo } from '../../client/ui-test/docs/demos/combobox/create';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Combobox } from '@hvy/ui';

<Combobox
  options={tags.map((t) => ({ value: String(t.id), label: t.name }))}
  pickedValues={selected.map((t) => String(t.id))}
  triggerLabel="태그 추가"
  onPick={(value) => addTag(value)}
/>`;

/** 콤보박스 문서 — blog 추가분(피커형). */
export const comboboxDoc: DocEntry = {
  slug: 'combobox',
  category: 'components',
  title: 'Combobox',
  description:
    '피커형 콤보박스 — Select 와 달리 값을 고정하지 않는다. 고르면 onPick 콜백이 불리고 닫힐 뿐, 선택 결과는 앱이 칩·목록 등 다른 자리에 그린다. onCreate 를 주면 자유입력 생성 행이 열리고(태그 생성 패턴), query/onQueryChange 를 주면 서버 검색 모드가 된다(내부 필터 꺼짐 — 디바운스·API 는 앱 몫). 값이 고정되는 폼 컨트롤이 필요하면 Select/MultiSelect 를 쓴다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 피커형',
      note: '고른 항목은 pickedValues 로 체크 표시된다 — 이미 추가한 항목을 다시 고르는 실수를 줄인다.',
      file: 'src/client/ui-test/docs/demos/combobox/basic.tsx',
      Component: ComboboxBasicDemo,
    },
    {
      id: 'create',
      title: '자유입력 생성 — onCreate',
      note: "검색어와 정확히 일치하는 옵션이 없을 때만 '만들기' 행이 열린다. 문구(createLabel)는 앱이 주입한다 — ui 는 사전을 모른다.",
      file: 'src/client/ui-test/docs/demos/combobox/create.tsx',
      Component: ComboboxCreateDemo,
    },
  ],
  propsTables: [
    {
      title: 'Combobox',
      rows: definePropRows<ComboboxProps>()([
        {
          name: 'options',
          type: 'ComboboxOption[]',
          required: true,
          description: '{value, label, disabled?} 목록.',
        },
        {
          name: 'onPick',
          type: '(value: string) => void',
          required: true,
          description: '고르면 호출되고 닫힌다 — 값은 고정되지 않는다.',
        },
        {
          name: 'triggerLabel',
          type: 'ReactNode',
          required: true,
          description: "트리거에 표시할 문구 — '태그 추가' 같은 행동 문구가 맞다.",
        },
        {
          name: 'pickedValues',
          type: 'string[]',
          description: '체크 표시할 값들 — 중복 선택 실수를 줄인다.',
        },
        {
          name: 'onCreate',
          type: '(input: string) => void',
          description: "있으면 정확 일치 옵션이 없을 때 '만들기' 행이 열린다.",
        },
        {
          name: 'query',
          type: 'string',
          description: '주면 서버 검색 모드(controlled) — 내부 필터가 꺼진다.',
        },
        {
          name: 'onQueryChange',
          type: '(query: string) => void',
          description: '검색어 변경 콜백 — 디바운스·API 호출은 앱 몫.',
        },
        {
          name: 'loading',
          type: 'boolean',
          description: '서버 검색 진행 중 — 목록 대신 스피너 행.',
        },
      ]),
    },
  ],
};
