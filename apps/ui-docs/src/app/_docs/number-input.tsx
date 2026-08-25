import type { NumberInputProps } from '@hvy/ui';
import { NumberInputBasicDemo } from '../../client/ui-test/docs/demos/number-input/basic';
import { NumberInputModesDemo } from '../../client/ui-test/docs/demos/number-input/modes';
import { NumberInputStepperDemo } from '../../client/ui-test/docs/demos/number-input/stepper';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Field, NumberInput } from '@hvy/ui';

<Field label="첨부 용량" htmlFor="amount" error={errors.amount}>
  <NumberInput
    id="amount"
    name="amount"
    align="left"
    decimalPlaces={2}
    value={amount}
    onValueChange={setAmount}
  />
</Field>`;

/** NumberInput 문서 — 값 계약이 number | null 이고 blur/Enter 에 확정한다. */
export const numberInputDoc: DocEntry = {
  slug: 'number-input',
  category: 'components',
  title: 'NumberInput',
  description:
    '값 계약이 number | null 인 숫자 입력이다(Input 은 문자열). 표시는 천단위 구분(1,234,567.89)이고 편집 중에는 친 그대로 두었다가 blur/Enter 에 확정한다 — 숫자가 아니면 조용히 이전 값으로 되돌린다(반쯤 친 문자열을 값으로 남기지 않는다. 그리드 셀 에디터와 같은 규칙, 정본 numberFormat.ts). ↑/↓ 는 step 만큼 증감하고 min/max 는 확정 시 클램프, decimalPlaces 는 표시(0 채움)와 확정(반올림) 양쪽에 적용된다. 폼 전송은 name 이 있으면 hidden input 이 원시 숫자 문자열을 든다 — 표시 입력의 콤마는 전송되지 않고, 빈 값(null)이면 키 자체를 내지 않는다(빈 문자열 전송은 0 오독을 부른다). 기본 정렬이 가운데다 — "숫자 칸은 가운데"(v3), 폼 안 숫자는 align="left" 로 뒤집는다. 관리형이라 비제어에서도 view 가 성립하고, 상태 계약(mode·lock)을 따른다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — 천단위 · 클램프 · 소수 자릿수',
      note: '편집 중에는 친 그대로 두고 blur/Enter 에 확정한다 — 숫자가 아니면 이전 값으로 되돌아가고, min/max 는 확정 시 클램프된다(수량 칸에 1234 를 치고 벗어나 볼 것). ↑/↓ 는 step 만큼 증감한다. decimalPlaces 는 표시(0 채움)와 확정(반올림) 양쪽에 적용된다 — 첨부 용량에 1.999 를 치면 2.00 이 된다. 아래 확정값 표시가 값 계약(number | null)의 실증이다 — 빈 칸은 0 이 아니라 null 이다.',
      file: 'src/client/ui-test/docs/demos/number-input/basic.tsx',
      Component: NumberInputBasicDemo,
    },
    {
      id: 'stepper',
      title: '스텝퍼 버튼 (−/+)',
      note: '키보드 ↑/↓ 만으로는 증감이 발견되지 않아 opt-in 버튼을 단다 — 같은 nudge 경로라 min/max 클램프가 동일하다. 버튼은 tabIndex -1 이다(키보드 사용자는 입력 안에서 ↑/↓ 를 쓴다 — 탭 순서를 더럽히지 않는다). lock·disabled 에서는 숨긴다 — 잠긴 값에 비활성 버튼은 거짓 어포던스다.',
      file: 'src/client/ui-test/docs/demos/number-input/stepper.tsx',
      Component: NumberInputStepperDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled + lock',
      note: '열마다 FormMode 로 감은 정적 대비. view 는 천단위 구분 텍스트만 남고 정렬이 유지되며 빈값(null)은 빈칸이다. disabled 는 컨트롤이 남은 채 비활성 — hidden input 도 실리지 않는다(submits 가드). lock 은 readOnly + 자물쇠로 어느 모드에서도 유지되고(모든 mode 를 이긴다) 값은 FormData 에 실린다 — 시스템이 채운 값은 저장에 함께 나가야 한다.',
      file: 'src/client/ui-test/docs/demos/number-input/modes.tsx',
      Component: NumberInputModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'NumberInput',
      rows: definePropRows<NumberInputProps>()([
        {
          name: 'value',
          type: 'number | null',
          description:
            '주면 controlled — null(빈 값)도 유효한 controlled 값이다. 값 계약이 숫자라 콤마·문자열 파싱은 컨트롤 몫이다.',
        },
        {
          name: 'defaultValue',
          type: 'number | null',
          defaultValue: 'null',
          description: '비제어 초기값 — 관리형이라 비제어에서도 view 가 성립한다.',
        },
        {
          name: 'onValueChange',
          type: '(value: number | null) => void',
          description: '확정(blur/Enter)·↑/↓ 증감 때 호출된다. 편집 중 타이핑에는 호출되지 않는다.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '있으면 hidden input 이 원시 숫자 문자열을 든다 — 표시 입력의 콤마는 전송되지 않는다. 빈 값(null)이면 키 자체를 내지 않는다.',
        },
        {
          name: 'placeholder',
          type: 'string',
          description: '빈 값일 때 표시 — 잠긴 칸에서는 감춘다.',
        },
        {
          name: 'min',
          type: 'number',
          description: '확정 시 클램프 경계(포함) — 타이핑을 막지 않고 확정할 때 자른다.',
        },
        {
          name: 'max',
          type: 'number',
          description: '확정 시 클램프 경계(포함).',
        },
        {
          name: 'step',
          type: 'number',
          defaultValue: '1',
          description: '↑/↓ 증감 폭 — 증감 결과도 min/max 로 클램프된다.',
        },
        {
          name: 'stepper',
          type: 'boolean',
          description:
            '−/+ 버튼 표시(opt-in) — 키보드 ↑/↓ 와 같은 경로다. lock·disabled·readOnly 에서는 숨긴다.',
        },
        {
          name: 'stepperLabels',
          type: '{ up; down }',
          defaultValue: "{ up: '증가', down: '감소' }",
          description: '스텝퍼 버튼의 접근성 이름 — 한국어 기본값, 앱이 번역으로 덮는다.',
        },
        {
          name: 'decimalPlaces',
          type: 'number',
          description: '소수 자릿수 고정 — 표시(0 채움)와 확정(반올림) 양쪽에 적용된다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          defaultValue: "'edit'",
          description:
            '폼 모드 — 생략하면 감싼 Field/FormMode 를 따르고 명시하면 이긴다(단독 상태 유지). view 는 천단위 구분 텍스트만 남는다.',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            '시스템 채움 영구 불변 — readOnly + 자물쇠. 모든 mode 를 이기고 값은 FormData 에 실린다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: 'Field 밖 단독 사용 시의 오류 배색. Field 안이면 error 컨텍스트가 이긴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '5단 사이즈. 생략하면 감싼 Field 의 size 를 따른다.',
        },
        {
          name: 'align',
          type: "'left' | 'center'",
          defaultValue: "'center'",
          description:
            '기본이 가운데다 — "숫자 칸은 가운데"(v3). 폼 안 숫자는 left 로 뒤집는다(Input 의 기본과 반대).',
        },
        {
          name: 'id',
          type: 'string',
          description: '표시 입력에 붙는다 — Field 의 htmlFor 가 가리키는 대상이다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '표시 입력에 붙는다.',
        },
      ]),
    },
  ],
};
