import type { SwitchProps } from '@hvy/ui';
import { SwitchModesDemo } from '../../client/ui-test/docs/demos/switch/modes';
import { SwitchStatesDemo } from '../../client/ui-test/docs/demos/switch/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Switch } from '@hvy/ui';

<Switch checked={enabled} onCheckedChange={setEnabled} label="알림 받기" />`;

/** Switch 문서 — 트랙 36×20, 관리형(비제어 가능). */
export const switchDoc: DocEntry = {
  slug: 'switch',
  category: 'components',
  title: 'Switch',
  description:
    '온/오프 토글 — 트랙 36×20 규격. 다른 선택형 컨트롤과 같은 관리형이다(useControllableState) — controlled(checked + onCheckedChange)와 비제어(defaultChecked) 둘 다 되고, 비제어에서도 view 모드가 현재값을 안다(한때 controlled 전용이던 제약이 풀렸다). 상태 축은 mode 하나다 — 비활성은 mode="disabled"(disabled boolean prop 은 타입에서 제거됐다). 라벨이 옆에 있어도 자체 label prop(스크린리더용 이름)이 필요하다. <button role="switch"> 라 어느 모드에서도 FormData 에 실리지 않는다 — 전송이 필요하면 호출부가 값을 폼 상태로 든다.',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: '상태 전수',
      note: '비활성(mode="disabled")은 off 와 on 의 배색이 다르다 — QA 실측. 비활성 예시 두 개는 비제어(defaultChecked)다 — 더는 onCheckedChange 더미를 강요받지 않는다.',
      file: 'src/client/ui-test/docs/demos/switch/states.tsx',
      Component: SwitchStatesDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 트랙이 아니라 주입된 말(viewLabels {on, off})로 그린다 — 누락 시 콘솔 경고 + 빈칸(Checkbox 와 같은 규칙). 이 데모는 세 열이 한 상태를 공유하도록 controlled 로 묶었다 — edit 열을 켜고 끄면 view 열 문구가 함께 바뀐다(비제어로 두면 열마다 상태가 따로 논다). 모드 왕복은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/switch/modes.tsx',
      Component: SwitchModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Switch',
      rows: definePropRows<SwitchProps>()([
        {
          name: 'checked',
          type: 'boolean',
          description: '주면 controlled. 생략하면 defaultChecked 로 시작하는 내부 상태가 된다.',
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description:
            '비제어 초기값. 관리형이라 비제어에서도 view 모드가 현재값을 안다 — 다른 선택형 컨트롤과 같은 계약.',
        },
        {
          name: 'onCheckedChange',
          type: '(checked: boolean) => void',
          description: '토글 콜백. 비제어에서도 알림용으로 쓸 수 있다.',
        },
        {
          name: 'label',
          type: 'string',
          required: true,
          description: '스위치 자체 이름 — 옆에 시각 라벨이 있어도 스크린리더용으로 필요하다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 비활성 표기는 이 축 하나다(mode="disabled", off/on 전용 배색 QA 실측). 생략하면 감싼 Field/FormMode 를 따르고, 명시하면 폼이 view 여도 이긴다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description:
            'Field 밖에서 단독으로 쓸 때만 — Field 안이면 error 컨텍스트가 이긴다. 배색은 QA 미규정이라 aria-invalid 만 단다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '테마 스케일 유도 5단 — 기본 md 가 QA 36×20 이다. 생략하면 감싼 Field 의 size 를 따른다.',
        },
        {
          name: 'id',
          type: 'string',
          description: '생략하면 감싼 Field 의 htmlFor 가 자동 연결된다(useFieldControl).',
        },
        {
          name: 'viewLabels',
          type: '{ on: ReactNode; off: ReactNode }',
          description:
            'view 모드 표시 문구 — ui 는 불리언→말 사전을 모르므로 주입받는다(예: { on: "수신", off: "수신 안 함" }). view 모드인데 없으면 콘솔 경고 + 빈칸이다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '트랙(button)에 병합되는 클래스.',
        },
      ]),
    },
  ],
};
