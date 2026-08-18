import type { CheckboxProps } from '@hvy/ui';
import { CheckboxModesDemo } from '../../client/ui-test/docs/demos/checkbox/modes';
import { CheckboxStatesDemo } from '../../client/ui-test/docs/demos/checkbox/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Checkbox } from '@hvy/ui';

<label htmlFor="agree" className="flex items-center gap-2 text-dl-sm">
  <Checkbox id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
  동의합니다
</label>`;

/** Checkbox 문서 — 20px 규격 + indeterminate. */
export const checkboxDoc: DocEntry = {
  slug: 'checkbox',
  category: 'components',
  title: 'Checkbox',
  description:
    '20px 규격 체크박스. 네이티브 <input type="checkbox"> 가 그대로 살아 있어 폼 전송·라벨 연결이 표준 방식이고, 내부적으로는 값을 useControllableState 로 미러링하는 관리형이다(네이티브 onChange API 는 그대로) — 비제어(defaultChecked)에서도 view 모드가 현재값을 아는 근거다. 상태 축은 mode 하나다 — 비활성은 mode="disabled"(disabled boolean prop 은 타입에서 제거됐다). Field 안에서는 htmlFor 의 id 뿐 아니라 size·error 도 컨텍스트로 도달한다 — invalid 는 aria-invalid 로 방출된다(배색은 QA 미규정). 그리드 전체선택의 "일부 선택" 표시는 indeterminate 로 한다.',
  usage: USAGE,
  examples: [
    {
      id: 'states',
      title: '상태 전수',
      note: 'hover 링(shadow-action)은 활성 상태에서만 뜨고, 비활성(mode="disabled")은 off(연회색)와 on(하늘색)이 다른 배색이다 — QA 실측.',
      file: 'src/client/ui-test/docs/demos/checkbox/states.tsx',
      Component: CheckboxStatesDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 체크 모양이 아니라 주입된 말(viewLabels {on, off})로 그린다 — 불리언→말 사전을 ui 는 모른다. view 모드인데 viewLabels 가 없으면 콘솔 경고 + 빈칸이다. disabled 모드 배색은 dl-field-locked 가 아니라 체크박스 전용 disabled 토큰(QA 실측). 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/checkbox/modes.tsx',
      Component: CheckboxModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Checkbox',
      rows: definePropRows<CheckboxProps>()([
        {
          name: 'indeterminate',
          type: 'boolean',
          description:
            '일부만 선택된 상태. DOM 프로퍼티라 속성으로 줄 수 없어 내부에서 effect 로 넣는다 — 그리드 전체선택에서 이게 없으면 "일부 선택"이 "전체 선택"으로 보인다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 비활성 표기는 이 축 하나다(mode="disabled"). 생략하면 감싼 Field/FormMode 를 따르고, 명시하면 폼이 view 여도 이긴다.',
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
            '테마 스케일 유도 5단 — 기본 md 가 QA 20×20 이다. 생략하면 감싼 Field 의 size 를 따른다.',
        },
        {
          name: 'checked',
          type: 'boolean',
          description:
            'controlled 값. 그 밖에는 <input type="checkbox"> 네이티브 속성(onChange·readOnly 등)을 그대로 받는다 — 단 disabled 는 타입에서 제거됐다(mode 로 표기).',
        },
        {
          name: 'defaultChecked',
          type: 'boolean',
          description:
            '비제어 초기값. 내부가 값을 미러링하므로 비제어여도 view 모드가 현재값을 알고, view↔edit 왕복 시 remount 에서 값이 복원된다.',
        },
        {
          name: 'viewLabels',
          type: '{ on: ReactNode; off: ReactNode }',
          description:
            'view 모드 표시 문구 — ui 는 불리언→말 사전을 모르므로 주입받는다(예: { on: "동의함", off: "동의 안 함" }). view 모드인데 없으면 콘솔 경고 + 빈칸이다 — 체크 모양만 남기면 입력으로 오독된다.',
        },
      ]),
    },
  ],
};
