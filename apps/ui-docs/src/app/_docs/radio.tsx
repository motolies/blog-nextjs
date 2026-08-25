import type { RadioGroupProps, RadioProps } from '@hvy/ui';
import { RadioModesDemo } from '../../client/ui-test/docs/demos/radio/modes';
import { RadioStatesDemo } from '../../client/ui-test/docs/demos/radio/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Radio, RadioGroup } from '@hvy/ui';

<RadioGroup label="편집기" name="editor" value={value} onValueChange={setValue}>
  <Radio value="rich">리치 텍스트</Radio>
  <Radio value="markdown">마크다운</Radio>
</RadioGroup>`;

/** Radio · RadioGroup 문서 — Radix 기반, 그룹 label 필수 관행. */
export const radioDoc: DocEntry = {
  slug: 'radio',
  category: 'components',
  title: 'Radio',
  description:
    '20px 규격 라디오. Radix RadioGroup 기반이라 키보드 이동·roving tabindex 가 붙어 있고, name 지정 시 hidden input 으로 폼에 실린다(view 모드에서는 Radix Root 자체가 안 그려져 hidden input 도 없다). 그룹 비활성은 mode="disabled" 하나로 표기한다 — 그룹의 disabled boolean prop 은 타입에서 제거됐고, 항목 단위 Radio.disabled 만 남는다. 그룹 label 이 없으면 스크린리더가 그룹을 못 읽는다.',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: '상태 전수',
      note: '항목 하나만 잠그면 Radio.disabled(항목 단위 — 유지된 prop), 그룹 전체를 잠그면 mode="disabled". checked+비활성 조합은 그룹을 분리해야 값이 살아 있다 — 데모 코드의 두 번째 그룹이 그 예다.',
      file: 'src/client/ui-test/docs/demos/radio/states.tsx',
      Component: RadioStatesDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 체크된 Radio 의 children(라벨)만 남긴다 — 나머지 항목은 렌더하지 않고, 미선택 그룹이면 빈칸이다. 비제어(defaultValue)여도 view 가 체크 항목을 판정한다 — RadioGroup 이 내부적으로 항상 controlled 이기 때문이다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/radio/modes.tsx',
      Component: RadioModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'RadioGroup',
      rows: definePropRows<RadioGroupProps>()([
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: 'Radio 항목들.',
        },
        {
          name: 'label',
          type: 'string',
          description: '그룹 자체의 이름 — 라벨 요소가 따로 없으면 스크린리더가 그룹을 못 읽는다.',
        },
        {
          name: 'value',
          type: 'string',
          description:
            'controlled 값. 생략하면 defaultValue 로 시작하는 내부 상태 — 내부는 항상 controlled(useControllableState)라 비제어에서도 view 모드가 체크 항목을 판정한다.',
        },
        {
          name: 'defaultValue',
          type: 'string',
          description: '비제어 초기값. 없으면 미선택으로 시작한다.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: '선택 변경 콜백.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '있으면 폼 전송에 실린다(Radix 가 hidden input 을 만든다 — 그룹이 disabled 모드면 빠진다).',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 그룹 전체 비활성은 mode="disabled" 로 표기한다(그룹 disabled prop 은 제거). 생략하면 감싼 Field/FormMode 를 따르고, 명시하면 폼이 view 여도 이긴다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description:
            'Field 밖 단독 사용 시의 오류 표시(aria-invalid). Field 안이면 error 가 이긴다.',
        },
        {
          name: 'orientation',
          type: "'horizontal' | 'vertical'",
          defaultValue: "'horizontal'",
          description: '배치 방향.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '그룹의 모든 Radio 에 내려간다 — 개별 Radio 의 명시 size 가 이긴다. 생략하면 감싼 Field 의 size 를 따른다(다른 컨트롤과 같은 계약).',
        },
        {
          name: 'id',
          type: 'string',
          description: '생략하면 감싼 Field 의 htmlFor 가 자동 연결된다(useFieldControl).',
        },
        {
          name: 'className',
          type: 'string',
          description: '그룹 루트에 병합되는 클래스.',
        },
      ]),
    },
    {
      title: 'Radio',
      rows: definePropRows<RadioProps>()([
        {
          name: 'value',
          type: 'string',
          required: true,
          description: '이 항목이 선택될 때의 그룹 값.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: '라벨 텍스트 — 클릭 영역이 라벨까지 넓어진다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description:
            '항목 단위 비활성 — mode 축으로 옮기지 않고 남긴 예외다(선택지 하나만 잠그는 용도라 폼 상태가 아니다).',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          description: '생략하면 그룹(RadioGroup)의 size 를 따른다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '항목 라벨(label 요소)에 병합되는 클래스.',
        },
      ]),
    },
  ],
};
