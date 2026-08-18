import type { DateTimePickerProps, DateTimeRangePickerProps } from '@hvy/ui';
import {
  DateTimeBasicDemo,
  DateTimeLockDemo,
  DateTimeMinuteDemo,
} from '../../client/ui-test/docs/demos/date-time-picker/basic';
import { DateTimePickerModesDemo } from '../../client/ui-test/docs/demos/date-time-picker/modes';
import { DateTimeRangeDemo } from '../../client/ui-test/docs/demos/date-time-picker/range';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DateTimePicker, DateTimeRangePicker } from '@hvy/ui';

/* 값 = YYYY-MM-DD HH:mm:ss — Java Constant.DATETIME_FORMAT 과 1:1.
   초 없는 HH:mm 꼴은 백엔드 역직렬화기가 받지 않으므로 값에 초를 항상 포함한다 */
<DateTimePicker name="collectedAt" value={at} onValueChange={setAt} />

<DateTimeRangePicker startName="collectedFrom" endName="collectedTo"
  start={range.start} end={range.end} onRangeChange={setRange} />`;

/** DateTimePicker 문서 — 달력 + 시·분 리스트, 기간은 끝마다 자기 팝오버. */
export const dateTimePickerDoc: DocEntry = {
  slug: 'date-time-picker',
  category: 'components',
  title: 'DateTimePicker',
  description:
    '날짜+시간 선택 — DatePicker 와 별도 컴포넌트다(값 계약이 달라 boolean prop 으로 합치면 전 동작이 분기된다). 값은 YYYY-MM-DD HH:mm:ss 로 Java 정본과 1:1 이고, 팝업은 달력 + 시(0-23)·분(0-59) 스크롤 리스트다. 날짜·시간 클릭은 즉시 반영되고 팝업은 유지된다 — 두 차원을 조정해야 하므로. 리스트 선택은 초를 00 으로 두고, 초가 필요하면 타이핑으로 입력한다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '단일 일시',
      note: '날짜를 고르면 시간이 00:00 에서 시작하고, 시·분 리스트는 열릴 때 선택값을 중앙으로 끌어온다(Select 와 같은 규칙). 닫기는 [확인]·외부 클릭·ESC.',
      file: 'src/client/ui-test/docs/demos/date-time-picker/basic.tsx',
      Component: DateTimeBasicDemo,
    },
    {
      id: 'minute',
      title: '분 정밀도',
      note: 'precision="minute" — 값이 HH:mm 까지. 입력 수용은 두 모드 동일하고 출력만 다르다(타이핑된 초 절삭). 이 꼴은 백엔드 직송 불가 — zod 에서 :00 부착.',
      file: 'src/client/ui-test/docs/demos/date-time-picker/basic.tsx',
      Component: DateTimeMinuteDemo,
    },
    {
      id: 'range',
      title: '일시 기간',
      note: '끝마다 자기 팝오버 — 날짜 기간의 공유 달력과 다른 구조다(datetime 은 끝마다 2차원이라 공유 팝업이 과밀). 순서가 뒤집히면 맞바꾼다.',
      file: 'src/client/ui-test/docs/demos/date-time-picker/range.tsx',
      Component: DateTimeRangeDemo,
    },
    {
      id: 'lock',
      title: '잠금',
      note: 'FieldLock 규칙 그대로 — readonly 는 값 전송, disabled 는 전송 제외. 팝업 버튼도 함께 잠긴다. 폼 수준 mode="disabled" 와는 OR 합성 — mode 가 lock 을 지우지 않고 잠복시켜 edit 복귀 시 복원된다.',
      file: 'src/client/ui-test/docs/demos/date-time-picker/basic.tsx',
      Component: DateTimeLockDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: '값 계약이 datetime 문자열이라 view 는 그대로가 표시값이다. Range 의 view 는 "start ~ end" 한 스팬(한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸 — DatePicker 와 같은 규칙). view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). disabled 모드는 FormData 제외가 자동이고 끝마다 달린 팝오버 버튼도 함께 잠긴다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
      file: 'src/client/ui-test/docs/demos/date-time-picker/modes.tsx',
      Component: DateTimePickerModesDemo,
    },
  ],
  propsTables: [
    {
      title: 'DateTimePicker',
      rows: definePropRows<DateTimePickerProps>()([
        {
          name: 'value',
          type: 'string',
          description: 'YYYY-MM-DD HH:mm:ss. 주면 controlled, defaultValue 만 주면 내부 상태.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: '커밋 시점(팝업 선택·blur·Enter)에만 호출 — 타이핑 중간값은 나가지 않는다.',
        },
        {
          name: 'precision',
          type: "'second' | 'minute'",
          defaultValue: "'second'",
          description:
            '값 정밀도 — second 는 백엔드 정본과 1:1, minute 은 HH:mm 까지(백엔드 직송 불가 — zod 에서 :00 부착 필요). placeholder 기본값도 따라간다.',
        },
        {
          name: 'min',
          type: 'string',
          description:
            'ISO **날짜** 경계(포함) — 달력의 날짜 비활성용. 시간 단위 경계는 지원하지 않는다(필요해지면 그때 연다). max 도 같다.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '입력 자신이 값을 들어 FormData 로 전송된다 — hidden input 이 없다. disabled(lock 이든 mode 든)면 빠지고, view 모드는 입력 DOM 자체가 없어 아무 값도 나가지 않는다.',
        },
        {
          name: 'lock',
          type: "'auto' | 'readonly' | 'disabled'",
          description:
            'Input 과 같은 FieldLock — 배색 공유, 팝업 버튼도 함께 잠긴다. mode 와 OR 합성.',
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
      title: 'DateTimeRangePicker',
      rows: definePropRows<DateTimeRangePickerProps>()([
        {
          name: 'start',
          type: 'string',
          description: 'YYYY-MM-DD HH:mm:ss 또는 빈 문자열. end 와 쌍으로 주면 controlled.',
        },
        {
          name: 'end',
          type: 'string',
          description: 'YYYY-MM-DD HH:mm:ss 또는 빈 문자열. start 와 쌍으로 준다.',
        },
        {
          name: 'onRangeChange',
          type: '(range: { start; end }) => void',
          description: '맞바꿈이 두 값을 함께 바꾸므로 range 하나로 받는다.',
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
          description:
            '양끝 입력에 함께 적용되는 FieldLock — 팝오버 버튼도 잠긴다. mode 와 OR 합성.',
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
