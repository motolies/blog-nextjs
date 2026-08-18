import type { DateTimePickerProps } from '@hvy/ui';
import {
  DateTimeBasicDemo,
  DateTimeLockDemo,
  DateTimeMinuteDemo,
} from '../../client/ui-test/docs/demos/date-time-picker/basic';
import { DateTimePickerModesDemo } from '../../client/ui-test/docs/demos/date-time-picker/modes';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DateTimePicker } from '@hvy/ui';

/* 값 = YYYY-MM-DD HH:mm:ss — Java Constant.DATETIME_FORMAT 과 1:1.
   초 없는 HH:mm 꼴은 백엔드 역직렬화기가 받지 않으므로 값에 초를 항상 포함한다 */
<DateTimePicker name="collectedAt" value={at} onValueChange={setAt} />`;

/** DateTimePicker 문서 — 달력 + 시·분 리스트. 기간은 DateTimeRangePicker 문서로 분리했다. */
export const dateTimePickerDoc: DocEntry = {
  slug: 'date-time-picker',
  category: 'components',
  title: 'DateTimePicker',
  description:
    '날짜+시간 선택 — DatePicker 와 별도 컴포넌트다(값 계약이 달라 boolean prop 으로 합치면 전 동작이 분기된다). 값은 YYYY-MM-DD HH:mm:ss 로 Java 정본과 1:1 이고, 팝업은 달력 + 시(0-23)·분(0-59) 스크롤 리스트다. 날짜·시간 클릭은 즉시 반영되고 팝업은 유지된다 — 두 차원을 조정해야 하므로. 리스트 선택은 초를 00 으로 두고, 초가 필요하면 타이핑으로 입력한다. 상태 축은 mode 하나고, lock(boolean)은 별개 축이다 — readOnly 로 잠기고 선택 버튼 자리가 자물쇠 표식으로 바뀐다(모든 mode 를 이긴다).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '단일 일시',
      note: '날짜를 고르면 시간이 00:00 에서 시작하고, 시·분 리스트는 열릴 때 선택값을 중앙으로 끌어온다(Select 와 같은 규칙). 닫기는 [확인]·외부 클릭·ESC. clearable 이라 값이 있으면 선택 버튼 왼쪽에 × 가 뜬다.',
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
      id: 'lock',
      title: '잠금 (lock) vs mode="disabled"',
      note: 'lock 은 boolean — readOnly 로 잠기고 선택 버튼 자리가 자물쇠 표식으로 스왑된다(값은 FormData 에 실린다). 모든 mode 를 이긴다 — 폼이 edit 로 돌아와도 편집 불가. 전송까지 막아야 하면 mode="disabled" 다 — 두 번째 칸이 그 대비다.',
      file: 'src/client/ui-test/docs/demos/date-time-picker/basic.tsx',
      Component: DateTimeLockDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: '값 계약이 datetime 문자열이라 view 는 그대로가 표시값이다. view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). disabled 모드는 FormData 제외가 자동이고 팝오버 버튼도 함께 잠긴다. 기간의 3모드는 DateTimeRangePicker 문서에 있다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
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
          name: 'defaultValue',
          type: 'string',
          defaultValue: "''",
          description: '비제어 초기값.',
        },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: '커밋 시점(팝업 선택·blur·Enter)에만 호출 — 타이핑 중간값은 나가지 않는다.',
        },
        {
          name: 'name',
          type: 'string',
          description:
            '입력 자신이 값을 들어 FormData 로 전송된다 — hidden input 이 없다. lock 은 readOnly 라 값이 실리고, mode="disabled" 면 빠지며, view 모드는 입력 DOM 자체가 없어 아무 값도 나가지 않는다.',
        },
        {
          name: 'placeholder',
          type: 'string',
          description:
            '안내문구. 생략하면 precision 에 맞는 기본값(YYYY-MM-DD HH:mm:ss 또는 HH:mm 까지)이 뜬다.',
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
          name: 'max',
          type: 'string',
          description: 'ISO 날짜 경계(포함) — min 과 같은 규칙.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 비활성 표기는 이 축 하나다(mode="disabled"). 생략하면 감싼 Field/FormMode 를 따르고, 명시하면 폼이 view 여도 이긴다.',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            '시스템 채움 영구 불변 — readOnly + 선택 버튼 자리에 자물쇠 표식(버튼 스왑 — 거짓 어포던스를 남기지 않는다). 모든 mode 를 이기며 값은 전송된다.',
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
        {
          name: 'id',
          type: 'string',
          description: '생략하면 감싼 Field 의 htmlFor 가 자동 연결된다(useFieldControl).',
        },
        {
          name: 'clearable',
          type: 'boolean',
          description:
            '값 지우기(×) — 값이 있을 때 선택 버튼 왼쪽에 뜬다. lock·disabled 칸에서는 뜨지 않는다.',
        },
        {
          name: 'clearLabel',
          type: 'string',
          defaultValue: "'지우기'",
          description: '× 버튼의 접근성 이름 — ui 는 사전을 모르므로 필요하면 번역을 주입한다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '루트(span)에 병합되는 클래스(폭 지정 등).',
        },
      ]),
    },
  ],
};
