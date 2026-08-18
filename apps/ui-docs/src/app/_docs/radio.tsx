import type { RadioGroupProps, RadioProps } from '@hvy/ui';
import { RadioModesDemo } from '../../client/ui-test/docs/demos/radio/modes';
import { RadioStatesDemo } from '../../client/ui-test/docs/demos/radio/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Radio, RadioGroup } from '@hvy/ui';

<RadioGroup label="배송 방식" name="shipping" value={value} onValueChange={setValue}>
  <Radio value="AIR">항공</Radio>
  <Radio value="SEA">해상</Radio>
</RadioGroup>`;

/** Radio · RadioGroup 문서 — Radix 기반, 그룹 label 필수 관행. */
export const radioDoc: DocEntry = {
  slug: 'radio',
  category: 'components',
  title: 'Radio',
  description:
    '20px 규격 라디오. Radix RadioGroup 기반이라 키보드 이동·roving tabindex 가 붙어 있고, name 지정 시 hidden input 으로 폼에 실린다(view 모드에서는 Radix Root 자체가 안 그려져 hidden input 도 없다). 그룹 label 이 없으면 스크린리더가 그룹을 못 읽는다.',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: '상태 전수',
      note: 'checked+disabled 조합은 그룹을 분리해야 값이 살아 있다 — 데모 코드의 두 번째 그룹이 그 예다.',
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
            '있으면 폼 전송에 실린다(Radix 가 hidden input 을 만든다 — 그룹이 disabled 면 빠진다).',
        },
        {
          name: 'id',
          type: 'string',
          description: '생략하면 감싼 Field 의 htmlFor 가 자동 연결된다(useFieldControl).',
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
          name: 'disabled',
          type: 'boolean',
          description: '그룹 전체 비활성.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '그룹의 모든 Radio 에 내려간다 — 개별 Radio 의 명시 size 가 이긴다. 생략하면 감싼 Field 의 size 를 따른다(다른 컨트롤과 같은 계약).',
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
          description: '항목 단위 비활성.',
        },
      ]),
    },
  ],
};
