import type { CheckboxGroupProps } from '@hvy/ui';
import {
  CheckboxGroupBasicDemo,
  CheckboxGroupModesDemo,
} from '../../client/ui-test/docs/demos/checkbox-group/basic';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { CheckboxGroup } from '@hvy/ui';

<Field label="서비스 타입" htmlFor="categories">
  <CheckboxGroup
    id="categories"
    label="서비스 타입"
    name="categories"
    options={[
      { value: 'DEV', label: '개발' },
      { value: 'ESSAY', label: '에세이' },
    ]}
    value={value}
    onValueChange={setValue}
  />
</Field>
/* 서버: formData.getAll('categories') */`;

/** CheckboxGroup 문서 — RadioGroup 의 다중 선택 대칭. */
export const checkboxGroupDoc: DocEntry = {
  slug: 'checkbox-group',
  category: 'components',
  title: 'CheckboxGroup',
  description:
    'RadioGroup 의 다중 선택 대칭 — 다중 코드값 검색조건(카테고리 복수 선택 등)을 Checkbox 나열로 수동 조립하던 것을 흡수한다. 값 계약은 readonly string[] 이고 관리형이라 비제어에서도 view 가 성립한다(선택형 공통 규약). 폼 전송은 네이티브 체크박스의 name/value 규약 그대로다 — 체크된 항목만 formData.getAll(name) 에 실리고 disabled 모드의 미전송도 네이티브가 이행한다. RadioGroup 과 달리 children 합성이 아니라 options 배열인 이유: view 모드가 선택 라벨들을 join 해 그려야 해서 그룹이 라벨을 알아야 한다(Select 와 같은 이유). 항목 잠금은 option.disabled → 그 항목의 mode="disabled" 로 내려간다 — disabled boolean prop 은 타입에서 제거된 축이다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 관리형 다중 선택',
      note: '항목 잠금(option.disabled)은 목록에서 빼지 않고 회색으로 남긴다(v3 — 왜 못 고르는지 값으로 알 수 있어야 한다). 첫 항목만 Field 의 id 를 받아 라벨 클릭이 첫 체크박스로 간다 — 나머지는 고유 생성 id 라 중복 id 가 없다.',
      file: 'src/client/ui-test/docs/demos/checkbox-group/basic.tsx',
      Component: CheckboxGroupBasicDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 선택 라벨을 ", " 로 join 한 텍스트만 남고(미선택이면 빈칸 — placeholder 금지 규칙) 컨트롤 DOM 이 사라져 폼 값이 안 나간다. disabled 는 컨트롤이 남은 채 네이티브 규약으로 전송에서 빠진다.',
      file: 'src/client/ui-test/docs/demos/checkbox-group/basic.tsx',
      Component: CheckboxGroupModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'CheckboxGroup',
      rows: definePropRows<CheckboxGroupProps>()([
        {
          name: 'value',
          type: 'readonly string[]',
          description: '주면 controlled — 선택된 값들의 배열.',
        },
        {
          name: 'defaultValue',
          type: 'readonly string[]',
          defaultValue: '[]',
          description: '비제어 초기값 — 관리형이라 비제어에서도 view 가 성립한다.',
        },
        {
          name: 'onValueChange',
          type: '(value: readonly string[]) => void',
          description: '토글마다 전체 배열로 알린다.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '있으면 체크된 항목의 value 가 전부 실린다 — 서버는 formData.getAll(name). 네이티브 체크박스 규약이라 hidden input 이 없다.',
        },
        {
          name: 'options',
          type: 'readonly { value; label; disabled? }[]',
          required: true,
          description:
            '항목 정의 — label 은 이미 번역된 값(ui 는 사전을 모른다). disabled 항목은 mode="disabled" 로 잠긴다.',
        },
        {
          name: 'label',
          type: 'string',
          description: '그룹 자체의 이름(aria-label) — 없으면 스크린리더가 그룹을 못 읽는다.',
        },
        {
          name: 'orientation',
          type: "'horizontal' | 'vertical'",
          defaultValue: "'horizontal'",
          description: '배치 방향 — RadioGroup 과 같은 축.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description: '폼 상태. 생략하면 감싼 Field/FormMode 를 따른다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: 'Field 밖 단독 사용 시만 — Field 안이면 컨텍스트가 이긴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '그룹의 모든 체크박스에 내려가는 5단.',
        },
        {
          name: 'id',
          type: 'string',
          description: '첫 체크박스의 id — Field 의 htmlFor 대상. Field 안이면 컨텍스트가 준다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '루트(fieldset)에 병합되는 클래스.',
        },
      ]),
    },
  ],
};
