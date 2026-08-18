import type { Switch } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { SwitchModesDemo } from '../../client/ui-test/docs/demos/switch/modes';
import { SwitchStatesDemo } from '../../client/ui-test/docs/demos/switch/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Switch } from '@hvy/ui';

<Switch checked={enabled} onCheckedChange={setEnabled} label="알림 받기" />`;

/** Switch 문서 — 트랙 36×20, controlled 전용. */
export const switchDoc: DocEntry = {
  slug: 'switch',
  category: 'components',
  title: 'Switch',
  description:
    '온/오프 토글 — 트랙 36×20 규격. controlled 전용이라 checked · onCheckedChange 가 필수고, 라벨이 옆에 있어도 자체 label prop(스크린리더용 이름)이 필요하다. <button role="switch"> 라 어느 모드에서도 FormData 에 실리지 않는다 — 전송이 필요하면 호출부가 값을 폼 상태로 든다.',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: '상태 전수',
      note: '비활성은 off 와 on 의 배색이 다르다 — QA 실측. hover 링은 활성 상태에서만 뜬다.',
      file: 'src/client/ui-test/docs/demos/switch/states.tsx',
      Component: SwitchStatesDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 트랙이 아니라 주입된 말(viewLabels {on, off})로 그린다 — 누락 시 콘솔 경고 + 빈칸(Checkbox 와 같은 규칙). controlled 전용이라 이 데모는 세 열이 상태를 공유한다 — edit 열을 켜고 끄면 view 열 문구가 함께 바뀐다. 모드 왕복은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/switch/modes.tsx',
      Component: SwitchModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Switch',
      rows: definePropRows<ComponentProps<typeof Switch>>()([
        {
          name: 'checked',
          type: 'boolean',
          required: true,
          description: 'controlled 값.',
        },
        {
          name: 'onCheckedChange',
          type: '(checked: boolean) => void',
          required: true,
          description: '토글 콜백.',
        },
        {
          name: 'label',
          type: 'string',
          required: true,
          description: '스위치 자체 이름 — 옆에 시각 라벨이 있어도 스크린리더용으로 필요하다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description:
            '비활성 — off/on 전용 배색(QA 실측). 폼 수준 mode="disabled" 와 OR 합성이다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '테마 스케일 유도 5단 — 기본 md 가 QA 36×20 이다.',
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
      ]),
    },
  ],
};
