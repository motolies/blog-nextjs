import type { MultiSelectProps } from '@hvy/ui';
import { MultiSelectBulkDemo } from '../../client/ui-test/docs/demos/multi-select/bulk';
import { MultiSelectGroupsDemo } from '../../client/ui-test/docs/demos/multi-select/groups';
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

/** MultiSelect 문서 — 다중 선택 + 전체 토글 + 개수 배지 + 대량 목록의 선택 요약. */
export const multiSelectDoc: DocEntry = {
  slug: 'multi-select',
  category: 'components',
  title: 'MultiSelect',
  description:
    '다중 선택 드롭다운. 골라도 패널이 닫히지 않고 선택 개수가 배지로 트리거에 남는다(QA multi-select). 옵션이 searchThreshold(기본 10)를 넘으면 패널 상단에 검색 입력이 붙고, 하나라도 고르면 그 아래에 선택 요약(칩 + ✕)이 붙는다(문턱 없음, 0개면 사라진다) — 120개짜리 목록에서 트리거는 "[20] 서울 1센터, 서울 반품…" 으로 잘리므로, 무엇을 골랐는지 보고 바로 빼는 자리가 패널 안에 필요하다. 검색 중에도 전체 토글은 사라지지 않고 사정권이 "검색 결과"로 바뀐다 — 누르면 검색 결과가 기존 선택에 더해지고(덮어쓰지 않는다) 다시 누르면 그 범위만 빠진다. 상태 축은 mode 하나다 — 비활성은 mode="disabled"(disabled boolean prop 은 타입에서 제거됐다). clearable 을 주면 선택이 있을 때 캐럿 왼쪽에 × 가 떠 전체 해제한다. 폼 전송은 name 지정 시 값마다 hidden input — formData.getAll(name) 로 읽는다(단 edit 모드가 아니면 내지 않는다). view 모드는 라벨을 value 순서로 쉼표 연결해 그린다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'MultiSelect',
      note: 'selectAllLabel 항목은 전체 선택/해제 토글이다. 옵션 개수 5 → 12 에서 검색 입력이 나타난다(searchThreshold 10 경계). 선택 요약 칩은 문턱 없이 하나만 골라도 패널 상단에 붙고 0개가 되면 사라진다. 여러 개 고른 뒤 트리거의 개수 배지를 확인한다. clearable 을 켜면 선택이 있을 때 캐럿 왼쪽에 × 가 뜬다 — 누르면 전체 해제된다(접근성 이름은 clearAllLabel).',
      file: 'src/client/ui-test/docs/demos/multi-select/playground.tsx',
      Component: MultiSelectPlaygroundDemo,
    },
    {
      id: 'bulk',
      title: '대량 목록 — 120개 중 20개',
      note: '열자마자 20개가 선택되어 요약 칩이 보인다 — 칩의 ✕ 로 하나 빼도 패널이 닫히지 않고(포커스를 패널 안으로 되돌린다), 칩에 포커스를 두고 Enter 를 눌러도 활성 행이 함께 토글되지 않는다. "냉장" 으로 좁히면 전체 토글이 「검색 결과 전체 [12]」 로 바뀐다 — 누르면 그 12개가 기존 선택에 더해지고, 다시 누르면 그 12개만 빠진다(검색 밖에서 고른 값은 그대로다). 검색어를 지우면 사정권이 120개로 돌아온다. 코드(C0104)로도 검색된다 — value 도 필터 대상이다.',
      file: 'src/client/ui-test/docs/demos/multi-select/bulk.tsx',
      Component: MultiSelectBulkDemo,
    },
    {
      id: 'groups',
      title: '옵션 그룹 (SelectOption.group)',
      note: 'Select 와 같은 계약이다. 그룹에 속한 옵션은 들여써서 헤더가 상위 계층으로 읽히고, 전체 토글 행은 그룹 밖이라 들여쓰지 않는다. 헤더는 시각 전용이라 전체 토글·검색·키보드 이동이 그룹을 몰라도 그대로 동작한다.',
      file: 'src/client/ui-test/docs/demos/multi-select/groups.tsx',
      Component: MultiSelectGroupsDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 라벨(대응 option 이 없으면 raw value)을 value 순서로 쉼표 연결한다 — 트리거(옵션 순서로 선택분만 나열)와 달리 누락이 없다. 0개 선택이면 빈칸. disabled(칸의 mode="disabled" 든 FormMode 든)는 값마다 내던 hidden input 을 내지 않아 FormData 에서 빠진다. 선택 요약은 패널 안이라 view·disabled 어느 쪽에도 나타나지 않는다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
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
          description:
            '{ value, label, disabled?, group? } 목록 — disabled 는 항목 단위 비활성, group 은 그룹 헤더(같은 그룹 연속 배치 전제).',
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
          name: 'defaultValue',
          type: 'readonly string[]',
          defaultValue: '[]',
          description: '비제어 초기값. 관리형이라 비제어에서도 view 모드가 현재값을 안다.',
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
            '있으면 값마다 hidden input 을 낸다 — formData.getAll(name) 로 읽는다. 단 edit 모드가 아니면(view·disabled) 내지 않는다 — 네이티브 컨트롤이 FormData 에서 빠지는 규약과 맞춘다.',
        },
        {
          name: 'selectAllLabel',
          type: 'string',
          description: '있으면 맨 위에 전체 선택/해제 토글 항목이 생긴다(QA "전체").',
        },
        {
          name: 'selectFilteredLabel',
          type: 'string',
          defaultValue: "'검색 결과 전체'",
          description:
            '검색 중 전체 토글 문구 — 사정권이 목록 전체가 아니라 검색 결과임을 밝힌다. 옆의 개수 배지가 그 결과 수를 낸다. selectAllLabel 이 없으면 전체 토글 자체가 없으므로 이 문구도 쓰이지 않는다.',
        },
        {
          name: 'searchThreshold',
          type: 'number',
          defaultValue: '10',
          description: '이 개수를 넘으면 검색형이 된다.',
        },
        {
          name: 'searchPlaceholder',
          type: 'string',
          defaultValue: "'검색'",
          description: '검색 입력 안내문구 — ui 는 사전을 모르므로 주입받는다.',
        },
        {
          name: 'emptyLabel',
          type: 'string',
          defaultValue: "'검색 결과가 없습니다'",
          description: '검색 결과가 없을 때 문구.',
        },
        {
          name: 'summaryLabel',
          type: 'string',
          defaultValue: "'선택'",
          description:
            '선택 요약(패널 상단, 검색 입력 아래) 헤더 문구 — 요약은 선택이 하나라도 있으면 문턱 없이 항상 붙는다. 개수는 배지가 내므로 이 문구에 숫자를 넣지 않는다.',
        },
        {
          name: 'clearAllLabel',
          type: 'string',
          defaultValue: "'전체 해제'",
          description:
            '요약 헤더 우측 버튼 문구이자 트리거 × (clearable)의 접근성 이름 — 어느 쪽이든 누르면 선택이 전부 비워진다(검색 중이어도 전부).',
        },
        {
          name: 'removeLabel',
          type: '(label: string) => string',
          // biome-ignore lint/suspicious/noTemplateCurlyInString: 기본값 원문을 그대로 보여주는 문자열이다
          defaultValue: '(label) => `${label} 제거`',
          description:
            '칩 제거 버튼의 접근성 이름 — ✕ 아이콘뿐이라 스크린리더가 읽을 문구가 따로 필요하다. ui 는 사전을 모르므로 주입받는다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 비활성 표기는 이 축 하나다(mode="disabled"). 생략하면 감싼 Field/FormMode 를 따르고, 명시하면 폼이 view 여도 이긴다.',
        },
        {
          name: 'clearable',
          type: 'boolean',
          description:
            '값 지우기(×) — 선택이 있을 때 캐럿 왼쪽에 뜨고 누르면 전체 해제한다(접근성 이름은 clearAllLabel). 비활성 칸에서는 뜨지 않는다.',
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
          name: 'id',
          type: 'string',
          description: '생략하면 감싼 Field 의 htmlFor 가 자동 연결된다(useFieldControl).',
        },
        {
          name: 'className',
          type: 'string',
          description:
            '루트에 병합되는 클래스(폭 지정 등) — clearable 이면 래퍼 span, 아니면 트리거가 루트다.',
        },
        {
          name: 'matchTriggerWidth',
          type: 'boolean',
          defaultValue: 'true',
          description: '목록 폭이 트리거보다 넓어야 할 때만 끈다.',
        },
      ]),
    },
  ],
};
