import type { DatePickerProps } from '@hvy/ui';
import {
  DatePickerBasicDemo,
  DatePickerBoundsDemo,
  DatePickerLockDemo,
} from '../../client/ui-test/docs/demos/date-picker/basic';
import { DatePickerMessagesDemo } from '../../client/ui-test/docs/demos/date-picker/messages';
import { DatePickerModesDemo } from '../../client/ui-test/docs/demos/date-picker/modes';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DatePicker } from '@hvy/ui';

/* 값의 계약은 YYYY-MM-DD 문자열 — URL·FormData·zod 와 그대로 오간다 */
<DatePicker name="orderDate" value={date} onValueChange={setDate} />`;

/** DatePicker 문서 — 타이핑 + 달력 팝업. 기간은 DateRangePicker 문서로 분리했다. */
export const datePickerDoc: DocEntry = {
  slug: 'date-picker',
  category: 'components',
  title: 'DatePicker',
  description:
    '타이핑과 달력 팝업을 둘 다 지원하는 날짜 선택. 값은 YYYY-MM-DD 문자열이고 입력이 name 을 직접 들어 FormData 검색 폼과 그대로 맞물린다. 달력은 날짜 라이브러리 없이 자체 그리드다 — 값이 문자열이라 필요한 연산이 월 그리드 생성과 사전순 비교뿐이기 때문(요구가 커지면 내부만 교체하면 된다). 날짜 칸은 이것 하나다 — 달력이 안 열리던 구 DateInput 은 어포던스가 거짓이라 제거했다. 상태 축은 mode(edit·view·disabled) 하나고, lock 은 별개의 boolean 축이다 — 시스템 채움 영구 불변으로 readOnly 가 되고 달력 버튼 자리가 자물쇠 표식으로 바뀐다(모든 mode 를 이긴다).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '단일 날짜',
      note: '아이콘을 누르면 달력, 칸에는 타이핑 — 20261231·2026.12.31 도 blur/Enter 에서 정규화되고, 무효 입력은 이전 값으로 되돌아간다. clearable 이라 값이 있으면 달력 버튼 왼쪽에 × 가 뜬다 — 누르면 빈 값이 된다.',
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
      title: '잠금 (lock) vs mode="disabled"',
      note: 'lock 은 boolean — 시스템 채움 영구 불변. readOnly 로 잠기고 달력 버튼 자리가 자물쇠 표식으로 스왑된다(눌리지 않는 버튼은 어포던스가 거짓이라 버튼을 남기지 않는다). 값은 FormData 에 실리고 복사도 된다. 모든 mode 를 이긴다 — 폼이 edit 로 돌아와도 편집 불가. 전송까지 막아야 하면 lock 이 아니라 mode="disabled" 다(두 번째 칸 — 네이티브 disabled 라 FormData 제외).',
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
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: '값 계약이 YYYY-MM-DD 문자열이라 view 는 그대로가 표시값이고, 미선택이면 placeholder 가 아니라 빈칸이다. view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). disabled 모드는 입력이 name·value 를 직접 드므로 FormData 제외가 자동이고 달력 버튼도 함께 잠긴다. 기간의 3모드는 DateRangePicker 문서에 있다. 모드 왕복·값 보존은 Field 문서의 3모드 데모 참조.',
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
          name: 'defaultValue',
          type: 'string',
          defaultValue: "''",
          description: '비제어 초기값.',
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
            '입력 자신이 값을 들어 FormData 로 전송된다 — hidden input 이 없다. lock 은 readOnly 라 값이 실리고, mode="disabled" 면 네이티브 규약대로 빠지며, view 모드는 입력 DOM 자체가 없어 아무 값도 나가지 않는다(전환 폼 제어형 필수).',
        },
        {
          name: 'placeholder',
          type: 'string',
          defaultValue: "'YYYY-MM-DD'",
          description:
            '안내문구. lock 칸에서는 dl-field-locked-hint 로 다시 보인다 — "자동 / 저장 시 발급" 형식으로 언제 채워지는지 적는다.',
        },
        {
          name: 'min',
          type: 'string',
          description: 'ISO 경계(포함). 달력에서 밖의 날짜가 비활성이 된다. max 도 같다.',
        },
        {
          name: 'max',
          type: 'string',
          description: 'ISO 경계(포함) — min 과 같은 규칙. 타이핑 값은 서버 검증이 막는다.',
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
            '시스템 채움 영구 불변 — readOnly + 달력 버튼 자리에 자물쇠 표식(비활성 버튼이 아니라 표식으로 스왑 — 거짓 어포던스를 남기지 않는다). 모든 mode 를 이긴다(폼이 edit 로 돌아와도 편집 불가). 값은 전송된다.',
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
            '값 지우기(×) — 값이 있을 때 달력 버튼 왼쪽에 뜬다. lock·disabled 칸에서는 뜨지 않는다 — 잠긴 값은 지울 수 있는 값이 아니다.',
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
