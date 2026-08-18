import type { NativeSelectProps, SelectProps } from '@hvy/ui';
import { SelectModesDemo } from '../../client/ui-test/docs/demos/select/modes';
import { SelectPlaygroundDemo } from '../../client/ui-test/docs/demos/select/playground';
import { SelectStatesDemo } from '../../client/ui-test/docs/demos/select/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Select } from '@hvy/ui';

<Select
  name="serviceType"
  options={options}
  placeholder="전체"   // "전체"(거르지 않음) vs "선택"(아직 안 고름) — 뜻이 다르다
  searchPlaceholder="검색"
  emptyLabel="검색 결과가 없습니다"
/>`;

/** Select · NativeSelect 문서 — 검색형 전환(threshold 10)이 핵심이다. */
export const selectDoc: DocEntry = {
  slug: 'select',
  category: 'components',
  title: 'Select',
  description:
    '단일 선택 드롭다운. 옵션이 searchThreshold(기본 10)를 넘으면 검색형이 된다 — 겉모습은 같고 패널 상단에 검색 입력이 고정된다. 트리거 radius 는 8 로 입력(6)과 의도적으로 다르다(QA 실측). view 모드에서는 선택 라벨을 스스로 유도해 텍스트로 그린다(대응 option 이 아직 없으면 raw value — 빈칸은 소실로 읽힌다). OS 팝업이면 충분한 자리는 NativeSelect 를 쓰되, 조회(view) 모드가 필요한 화면에서는 Select 를 쓴다 — NativeSelect 는 view 를 유도할 수 없다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'Select',
      note: '옵션 14개 토글로 일반형 ↔ 검색형 전환을 확인한다. 트리거에는 직접 입력할 수 없다.',
      file: 'src/client/ui-test/docs/demos/select/playground.tsx',
      Component: SelectPlaygroundDemo,
    },
    {
      id: 'states',
      title: '상태 3열 · NativeSelect',
      note: 'QA component.html 의 기본 · 비활성 · 오류 3열 패턴. NativeSelect 는 플레이그라운드 컨트롤(EnumControl)이 쓰는 도그푸딩 대상이기도 하다.',
      file: 'src/client/ui-test/docs/demos/select/states.tsx',
      Component: SelectStatesDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 code 가 아니라 라벨을 그린다("KR" → "대한민국") · 미선택 칸은 placeholder 가 아니라 빈칸 — "고르라"는 입력 신호가 조회 화면에 남으면 거짓말이 된다 · disabled(칸이든 FormMode 든)는 hidden input 을 내지 않아 FormData 에서 빠진다. NativeSelect 는 view 미지원이라 콘솔 경고 1회 후 편집 렌더를 유지한다 — 이 페이지의 view 열에서 뜨는 경고가 그 의도된 동작이다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/select/modes.tsx',
      Component: SelectModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Select',
      rows: definePropRows<SelectProps>()([
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
          description:
            '미선택 문구. v3 는 "전체"(거르지 않음)와 "선택"(아직 안 고름)을 구분한다 — 뜻이 달라 호출부가 정한다.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '있으면 hidden input 을 함께 낸다 — 검색 폼이 FormData 로 읽는 전제. 없으면 폼 값이 실리지 않는다. 단 disabled(칸이든 FormMode disabled 든)면 내지 않는다 — 네이티브 컨트롤이 FormData 에서 빠지는 규약과 맞춘다.',
        },
        {
          name: 'searchThreshold',
          type: 'number',
          defaultValue: '10',
          description: '이 개수를 넘으면 검색형이 된다(v3 규칙 10).',
        },
        {
          name: 'searchPlaceholder',
          type: 'string',
          description: '검색 입력 안내문구 — ui 는 사전을 모르므로 주입받는다.',
        },
        {
          name: 'emptyLabel',
          type: 'string',
          description: '검색 결과가 없을 때 문구.',
        },
        {
          name: 'value',
          type: 'string',
          description: 'controlled 로 쓸 때. 생략하면 defaultValue 로 시작하는 내부 상태.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: '선택 변경 콜백.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: '오류 배색 — Field 안이면 error 컨텍스트가 자동 배선한다.',
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
        {
          name: 'matchTriggerWidth',
          type: 'boolean',
          defaultValue: 'true',
          description: '목록 폭이 트리거보다 넓어야 할 때만 끈다(코드+국가명처럼 긴 항목).',
        },
      ]),
    },
    {
      title: 'NativeSelect',
      rows: definePropRows<NativeSelectProps>()([
        {
          name: 'invalid',
          type: 'boolean',
          description: '오류 배색. 그 밖에는 <select> 네이티브 속성을 그대로 받는다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description:
            '비활성 — dl-field-locked 배색을 입고 FormData 에서 빠진다(네이티브 규약, 폼 수준 mode="disabled" 와 OR 합성). view 모드는 지원하지 않는다 — 선택 라벨이 children <option> 안이라 유도할 수 없어, 콘솔 경고 후 편집 렌더를 유지한다. 조회가 필요하면 Select 를 쓴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '테마 스케일 유도 5단. 생략하면 감싼 Field 의 size 를 따른다.',
        },
      ]),
    },
  ],
};
