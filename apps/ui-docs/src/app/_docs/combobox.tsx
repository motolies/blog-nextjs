import type { ComboboxProps } from '@hvy/ui';
import { ComboboxBasicDemo } from '../../client/ui-test/docs/demos/combobox/basic';
import { ComboboxCreateDemo } from '../../client/ui-test/docs/demos/combobox/create';
import { ComboboxKeyboardDemo } from '../../client/ui-test/docs/demos/combobox/keyboard';
import { ComboboxServerSearchDemo } from '../../client/ui-test/docs/demos/combobox/server-search';
import { ComboboxStatesDemo } from '../../client/ui-test/docs/demos/combobox/states';
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
      note: '검증 포인트 — ① 고른 항목은 pickedValues 로 체크 표시된다(이미 추가한 항목을 다시 고르는 실수를 줄인다) ② 트리거 문구가 고른 뒤에도 변하지 않는다 — 값이 고정되는 폼 컨트롤이 필요하면 Select/MultiSelect 다 ③ 열면 검색 입력에 자동 포커스가 간다 ④ 고르지 않고 닫았다 다시 열면 검색어가 비어 있다 ⑤ 목록은 label 부분 일치로 걸러진다(대소문자 무시).',
      file: 'src/client/ui-test/docs/demos/combobox/basic.tsx',
      Component: ComboboxBasicDemo,
    },
    {
      id: 'create',
      title: '자유입력 생성 — onCreate',
      note: "검증 포인트 — ① 검색어와 **정확히 일치**하는 옵션이 없을 때만 만들기 행이 열린다(대소문자 무시 — 기존 목록에 있는 이름을 치면 열리지 않는다) ② 문구(createLabel)는 앱이 주입한다: ui 는 사전을 모른다 ③ 만들기 행은 목록의 마지막 행이라 ↑↓ 로 옵션들과 같은 줄에서 이동하고 Enter 로 확정된다 ④ minCreateLength 를 올리면 그 글자 수 미만에서는 행이 뜨지 않는다 — 행을 띄워 놓고 누르면 오류를 뱉는 것은 '누를 수 있는데 항상 실패하는 버튼'이다.",
      file: 'src/client/ui-test/docs/demos/combobox/create.tsx',
      Component: ComboboxCreateDemo,
    },
    {
      id: 'server-search',
      title: '서버 검색 — 내부 필터를 끄는 controlled query',
      note: '검색어를 앱이 소유하고(query/onQueryChange) 목록은 앱이 걸러 온 결과를 그대로 그린다 — 디바운스(여기서는 300ms)와 호출은 전부 앱 몫이다. 검증 포인트 — ① 타이핑을 멈춘 뒤에야 목록이 바뀐다 ② 그 사이에는 loading 이 켜져 목록 대신 스피너 행이 뜬다 ③ 결과가 0건이면 emptyLabel 이 뜬다 ④ 고르지 않고 닫았다 다시 열었을 때 지난 검색 결과가 남아 있으면 버그다 — 검색어가 앱 state 라 컴포넌트가 열림·닫힘에서 비워 주지 않으면 지난 결과가 새 결과처럼 보인다(이 모드의 핵심 계약) ⑤ 내부 필터가 정말 꺼졌는지 본다: 서버가 검색어와 무관한 항목("서버가 끼워 넣은 추천")을 하나 섞어 돌려주는데 그대로 나와야 한다 — 내부 필터가 살아 있으면 사라진다.',
      file: 'src/client/ui-test/docs/demos/combobox/server-search.tsx',
      Component: ComboboxServerSearchDemo,
    },
    {
      id: 'keyboard',
      title: '키보드와 가상 포커스',
      note: '검증 포인트 — ① 포커스는 검색 입력에 있고 옵션은 focusable 이 아니다: 하이라이트는 aria-activedescendant 로 옮겨 다닌다(개발자 도구로 입력의 속성 값이 바뀌는지 볼 것) ② ↑↓ 는 순환하고 disabled 옵션은 건너뛴다 ③ Enter 는 하이라이트된 행을 확정하고 disabled 행에서는 아무 일도 일어나지 않는다 ④ Esc 는 닫기만 한다 ⑤ 마우스를 올리면 하이라이트가 그 행으로 따라온다(키보드와 같은 상태를 공유한다) ⑥ 검색어를 고치면 하이라이트가 첫 행으로 되돌아간다 ⑦ 오른쪽은 전 항목이 disabled 다 — ↑↓ 로 아무 데도 못 가고 Enter 도 먹지 않는다.',
      file: 'src/client/ui-test/docs/demos/combobox/keyboard.tsx',
      Component: ComboboxKeyboardDemo,
    },
    {
      id: 'states',
      title: '크기와 상태 — size 5단 · disabled · 라벨 연결',
      note: '검증 포인트 — ① size 5단(xs~xl)에서 트리거 높이·글자가 함께 움직인다: **패널 안 검색 입력은 항상 sm 규격**이다(패널은 트리거 크기를 따라가지 않는다) ② disabled 트리거는 dl-field-locked 배색이고 열리지 않는다 ③ 패널 폭은 트리거 폭을 따라간다(--radix-popover-trigger-width, 최소 40) — 맨 오른쪽 좁은 트리거를 열어 패널도 좁아지는지 본다 ④ id 를 주고 Label htmlFor 로 묶으면 라벨 클릭으로 열려야 한다 ⑤ 열리면 트리거 보더가 primary-hover 가 되고 캐럿이 180° 돈다.',
      file: 'src/client/ui-test/docs/demos/combobox/states.tsx',
      Component: ComboboxStatesDemo,
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
        {
          name: 'minCreateLength',
          type: 'number',
          defaultValue: '1',
          description:
            "만들기 행이 열리는 최소 글자 수. 앱이 더 긴 하한을 요구하면(태그 2자 등) 여기서 막는다 — 행을 띄워 놓고 누르면 오류를 뱉는 것은 '누를 수 있는데 항상 실패하는 버튼'이다.",
        },
        {
          name: 'createLabel',
          type: '(input: string) => string',
          description: "'{input}' 만들기의 표시 형식 — 사전은 앱 소유라 문구를 주입받는다.",
        },
        {
          name: 'searchPlaceholder',
          type: 'string',
          description: '패널 상단 검색 입력의 placeholder.',
        },
        {
          name: 'emptyLabel',
          type: 'string',
          description: '결과 0건일 때의 문구. 서버 검색 모드에서 특히 자주 보인다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description:
            '트리거 5단 사이즈. **패널 안 검색 입력은 이 값을 따라가지 않는다** — 항상 sm 규격이다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: 'dl-field-locked 배색이 되고 열리지 않는다.',
        },
        {
          name: 'id',
          type: 'string',
          description: '라벨과 연결할 트리거 id — `<Label htmlFor>` 의 대상이 된다.',
        },
        {
          name: 'className',
          type: 'string',
          description:
            '트리거 폭 조정 등. 패널 폭이 트리거 폭을 따라가므로 여기가 패널에도 영향을 준다.',
        },
      ]),
    },
  ],
};
