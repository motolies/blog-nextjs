import type { DatePickerProps, DateRangePickerProps } from '@hvy/ui';
import {
  DatePickerBasicDemo,
  DatePickerBoundsDemo,
  DatePickerLockDemo,
} from '../../client/ui-test/docs/demos/date-picker/basic';
import { DatePickerMessagesDemo } from '../../client/ui-test/docs/demos/date-picker/messages';
import { DatePickerModesDemo } from '../../client/ui-test/docs/demos/date-picker/modes';
import { DateRangeBasicDemo } from '../../client/ui-test/docs/demos/date-picker/range';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DatePicker, DateRangePicker } from '@hvy/ui';

/* 값의 계약은 YYYY-MM-DD 문자열 — URL·FormData·zod 와 그대로 오간다 */
<DatePicker name="orderDate" value={date} onValueChange={setDate} />

/* 검색 조건의 기간 — 시작·종료가 각자 name 을 가진다 */
<DateRangePicker startName="orderDateFrom" endName="orderDateTo"
  start={range.start} end={range.end} onRangeChange={setRange} />`;

/** DatePicker 문서 — 타이핑 + 달력 팝업, 기간 선택. */
export const datePickerDoc: DocEntry = {
  slug: 'date-picker',
  category: 'components',
  title: 'DatePicker',
  description:
    '타이핑과 달력 팝업을 둘 다 지원하는 날짜 선택. 값은 YYYY-MM-DD 문자열이고 입력이 name 을 직접 들어 FormData 검색 폼과 그대로 맞물린다. 달력은 날짜 라이브러리 없이 자체 그리드다 — 값이 문자열이라 필요한 연산이 월 그리드 생성과 사전순 비교뿐이기 때문(요구가 커지면 내부만 교체하면 된다). 날짜 칸은 이것 하나다 — 달력이 안 열리던 구 DateInput 은 어포던스가 거짓이라 제거했다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '단일 날짜',
      note: '아이콘을 누르면 달력, 칸에는 타이핑 — 20261231·2026.12.31 도 blur/Enter 에서 정규화되고, 무효 입력은 이전 값으로 되돌아간다.',
      file: 'src/client/ui-test/docs/demos/date-picker/basic.tsx',
      Component: DatePickerBasicDemo,
    },
    {
      id: 'bounds',
      title: 'min / max',
      note: '경계 밖 날짜는 달력에서 비활성(label-disabled 배색). 키보드는 그리드에서 화살표 이동·PageUp/Down 달 이동·Enter 선택.',
      file: 'src/client/ui-test/docs/demos/date-picker/basic.tsx',
      Component: DatePickerBoundsDemo,
    },
    {
      id: 'lock',
      title: '잠금 3종',
      note: 'Input 의 FieldLock 규칙 그대로 — auto·readonly 는 값 전송(readOnly), disabled 만 전송 제외. 잠기면 달력 버튼도 함께 죽는다. 폼 수준 mode="disabled" 와는 OR 합성 — mode 가 lock 을 지우지 않고 잠복시켜 edit 복귀 시 복원된다.',
      file: 'src/client/ui-test/docs/demos/date-picker/basic.tsx',
      Component: DatePickerLockDemo,
    },
    {
      id: 'messages',
      title: '오류 메시지 해제',
      note: '빈 칸으로 [검사] → 두 칸에 오류가 뜬다. 위 칸은 달력에서 클릭, 아래 칸은 타이핑 후 Enter — 두 경로 모두 오류가 즉시 사라져야 한다. 달력은 Portal 이라 Field 의 이벤트 버블링이 닿지 않아, 커밋 지점마다 notifyDirty 를 직접 부르지 않으면 값이 채워져도 오류가 남는다.',
      file: 'src/client/ui-test/docs/demos/date-picker/messages.tsx',
      Component: DatePickerMessagesDemo,
    },
    {
      id: 'range',
      title: '기간 선택',
      note: '첫 클릭 시작 → 둘째 클릭 종료(닫힘). 시작보다 앞을 찍으면 재시작, 타이핑으로 뒤집히면 맞바꾼다 — 뒤집힌 기간이라는 상태를 만들지 않는다.',
      file: 'src/client/ui-test/docs/demos/date-picker/range.tsx',
      Component: DateRangeBasicDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: '값 계약이 YYYY-MM-DD 문자열이라 view 는 그대로가 표시값이다. Range 의 view 는 "start ~ end" 한 스팬 — ~ 는 양쪽 값이 있을 때만 뜻이 있어 한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸이다. view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). disabled 모드는 입력이 name·value 를 직접 드므로 FormData 제외가 자동이고 달력 버튼도 함께 잠긴다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/date-picker/modes.tsx',
      Component: DatePickerModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'DatePicker',
      rows: definePropRows<DatePickerProps>()([
        {
          name: 'value',
          type: 'string',
          description: 'YYYY-MM-DD. 주면 controlled, defaultValue 만 주면 내부 상태.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: '커밋 시점(달력 선택·blur·Enter)에만 호출 — 타이핑 중간값은 나가지 않는다.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '입력 자신이 값을 들어 FormData 로 전송된다 — hidden input 이 없다. disabled(lock 이든 mode 든)면 네이티브 규약대로 빠지고, view 모드는 입력 DOM 자체가 없어 아무 값도 나가지 않는다(전환 폼 제어형 필수).',
        },
        {
          name: 'min',
          type: 'string',
          description: 'ISO 경계(포함). 달력에서 밖의 날짜가 비활성이 된다. max 도 같다.',
        },
        {
          name: 'lock',
          type: "'auto' | 'readonly' | 'disabled'",
          description: 'Input 과 같은 FieldLock — 배색 공유, 달력 버튼도 함께 잠긴다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: 'Field 밖에서 단독으로 쓸 때만. Field 안이면 컨텍스트가 이긴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '테마 스케일 유도 5단. 생략하면 감싼 Field 의 size 를 따른다.',
        },
      ]),
    },
    {
      title: 'DateRangePicker',
      rows: definePropRows<DateRangePickerProps>()([
        {
          name: 'start',
          type: 'string',
          description: 'YYYY-MM-DD 또는 빈 문자열. end 와 쌍으로 주면 controlled.',
        },
        {
          name: 'end',
          type: 'string',
          description: 'YYYY-MM-DD 또는 빈 문자열. start 와 쌍으로 준다.',
        },
        {
          name: 'onRangeChange',
          type: '(range: { start; end }) => void',
          description: '한 이벤트(재시작·맞바꿈)가 두 값을 함께 바꾸므로 range 하나로 받는다.',
        },
        {
          name: 'startName',
          type: 'string',
          description: '검색 조건 관례대로 시작·종료가 각자 이름으로 전송된다.',
        },
        {
          name: 'endName',
          type: 'string',
          description: '종료 입력의 전송 이름.',
        },
        {
          name: 'lock',
          type: "'auto' | 'readonly' | 'disabled'",
          description: '양끝 입력에 함께 적용되는 FieldLock — 달력 버튼도 잠긴다. mode 와 OR 합성.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description: '양끝 입력에 함께 오류 배색. Field 안이면 컨텍스트가 이긴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '시작·종료 입력 둘 다에 적용되는 테마 스케일 유도 5단.',
        },
      ]),
    },
  ],
};
