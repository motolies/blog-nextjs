import type { MultiSelectProps } from '@hvy/ui';
import { MultiSelectModesDemo } from '../../client/ui-test/docs/demos/multi-select/modes';
import { MultiSelectPlaygroundDemo } from '../../client/ui-test/docs/demos/multi-select/playground';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { MultiSelect } from '@hvy/ui';

<MultiSelect
  name="productTypes"     // formData.getAll('productTypes') 로 읽는다
  options={options}
  placeholder="전체"
  selectAllLabel="전체"
/>`;

/** MultiSelect 문서 — 다중 선택 + 전체 토글 + 개수 배지. */
export const multiSelectDoc: DocEntry = {
  slug: 'multi-select',
  category: 'components',
  title: 'MultiSelect',
  description:
    '다중 선택 드롭다운. 골라도 패널이 닫히지 않고 선택 개수가 배지로 트리거에 남는다(QA multi-select). 폼 전송은 name 지정 시 값마다 hidden input — formData.getAll(name) 로 읽는다(단 disabled 면 내지 않는다). view 모드는 라벨을 value 순서로 쉼표 연결해 그린다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'MultiSelect',
      note: 'selectAllLabel 항목은 전체 선택/해제 토글이다. 여러 개 고른 뒤 트리거의 개수 배지를 확인한다.',
      file: 'src/client/ui-test/docs/demos/multi-select/playground.tsx',
      Component: MultiSelectPlaygroundDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 라벨(대응 option 이 없으면 raw value)을 value 순서로 쉼표 연결한다 — 트리거(옵션 순서로 선택분만 나열)와 달리 누락이 없다. 0개 선택이면 빈칸. disabled(칸이든 FormMode 든)는 값마다 내던 hidden input 을 내지 않아 FormData 에서 빠진다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/multi-select/modes.tsx',
      Component: MultiSelectModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'MultiSelect',
      rows: definePropRows<MultiSelectProps>()([
        {
          name: 'options',
          type: 'readonly SelectOption[]',
          required: true,
          description: '{ value, label } 목록.',
        },
        {
          name: 'placeholder',
          type: 'string',
          required: true,
          description: '0개 선택일 때 트리거 문구 — "전체" 또는 "선택". 뜻이 달라 호출부가 정한다.',
        },
        {
          name: 'value',
          type: 'readonly string[]',
          description: 'controlled 값. 생략하면 defaultValue 로 시작하는 내부 상태.',
        },
        {
          name: 'onValueChange',
          type: '(value: readonly string[]) => void',
          description: '선택 변경 콜백.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '있으면 값마다 hidden input 을 낸다 — formData.getAll(name) 로 읽는다. 단 disabled(칸이든 FormMode disabled 든)면 내지 않는다 — 네이티브 컨트롤이 FormData 에서 빠지는 규약과 맞춘다.',
        },
        {
          name: 'selectAllLabel',
          type: 'string',
          description: '있으면 맨 위에 전체 선택/해제 토글 항목이 생긴다(QA "전체").',
        },
        {
          name: 'searchThreshold',
          type: 'number',
          defaultValue: '10',
          description: '이 개수를 넘으면 검색형이 된다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: '오류 배색.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '테마 스케일 유도 5단. 생략하면 감싼 Field 의 size 를 따른다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description:
            '비활성 — dl-field-locked 배색을 입고 hidden input 을 내지 않는다(FormData 제외). 폼 수준 mode="disabled" 와 OR 합성이다.',
        },
      ]),
    },
  ],
};
