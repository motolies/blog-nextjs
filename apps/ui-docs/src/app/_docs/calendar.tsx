import type { CalendarProps } from '@hvy/ui';
import { CalendarBasicDemo } from '../../client/ui-test/docs/demos/calendar/basic';
import { CalendarBoundsDemo } from '../../client/ui-test/docs/demos/calendar/bounds';
import { CalendarIsoUtilsDemo } from '../../client/ui-test/docs/demos/calendar/iso-utils';
import { CalendarKeyboardDemo } from '../../client/ui-test/docs/demos/calendar/keyboard';
import { CalendarRangeDemo } from '../../client/ui-test/docs/demos/calendar/range';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Calendar } from '@hvy/ui';
// lucide 아이콘에도 Calendar 가 있다 — 같은 파일에서 쓰면 별칭이 필요하다.
// import { Calendar as CalendarIcon } from 'lucide-react';

<Calendar
  value={date}                 // 'YYYY-MM-DD' 문자열 — Date 객체가 아니다
  onSelect={setDate}
  min="2026-07-01"
  max="2026-07-31"
/>`;

/** ISO 유틸 표의 행 이름을 barrel export 이름으로 강제한다(work-tabs.tsx 와 같은 기법). */
type HvyUiModule = typeof import('@hvy/ui');

/** Calendar 문서 — 피커 4종이 얹히는 달력 그리드 본체. */
export const calendarDoc: DocEntry = {
  slug: 'calendar',
  category: 'components',
  title: 'Calendar',
  description:
    '달력 그리드 — DatePicker · DateRangePicker · DateTimePicker · DateTimeRangePicker 네 피커의 팝업 본체다. 날짜 라이브러리를 쓰지 않는 이유가 값의 계약에 있다: `YYYY-MM-DD` **문자열**이라(URL·FormData 가 전부 문자열을 주고받는다) 필요한 연산이 월 그리드 생성과 문자열 비교뿐이고, ISO 형식은 사전순 비교가 곧 날짜 비교라 min/max·범위 판정이 `<=` 하나로 끝난다. 타임존 문제도 없다 — Date 는 로컬 y/m/d 계산에만 쓰고 값으로는 절대 들고 다니지 않는다. 표시 달은 내부 상태다: 팝업이 닫히면 언마운트되므로 다시 열 때마다 value → range.start → 오늘 순으로 시작 달이 정해진다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '단일 선택 · 6주 고정 그리드',
      note: '검증 포인트 — ① 달을 앞뒤로 넘겨도 행 수가 변하지 않는다(항상 6주 42칸): 4~6행으로 출렁이면 이 그리드를 팝업으로 쓰는 피커의 높이가 널뛴다 ② 앞뒤 인접 달 날짜는 흐리게(outside) 그려지되 누르면 선택된다 ③ 오늘은 굵은 primary 글자 + aria-current="date" 이고 선택은 primary 채움이다 — 오늘이면서 선택된 날은 선택 배색이 이긴다 ④ 값의 계약은 Date 가 아니라 YYYY-MM-DD 문자열이다(아래 출력으로 확인) ⑤ 헤더 « ‹ › » 는 각각 −1년 −1월 +1월 +1년이다.',
      file: 'src/client/ui-test/docs/demos/calendar/basic.tsx',
      Component: CalendarBasicDemo,
    },
    {
      id: 'range',
      title: '범위 강조 — 양끝과 사이가 다르게 그려진다',
      note: '검증 포인트 — ① 양끝은 primary 채움, 사이는 tonal 이다 ② 사이 칸만 라운드가 없어 띠가 끊기지 않고 이어진다 — 라운드를 주면 칸마다 잘려 보인다 ③ start > end 로 뒤집힌 범위를 만들면 띠를 그리지 않는다(start <= end 를 요구한다 — ISO 문자열이라 사전순 비교가 곧 날짜 비교다) ④ start 만 있고 end 가 없는 "고르는 중" 상태에서는 시작점만 강조된다 ⑤ 범위 강조는 표시일 뿐이고 클릭을 어떻게 start/end 로 해석할지는 호출부(DateRangePicker)가 정한다.',
      file: 'src/client/ui-test/docs/demos/calendar/range.tsx',
      Component: CalendarRangeDemo,
    },
    {
      id: 'bounds',
      title: 'min / max — 경계 밖은 눌리지 않는다',
      note: '검증 포인트 — ① 경계 밖 날짜는 label-disabled 배색이고 hover 배경도 뜨지 않는다(눌리지 않는 것에 어포던스를 주지 않는다) ② 경계는 **포함**이다: min 당일과 max 당일은 눌린다 ③ min 만·max 만·양쪽 다 준 세 칸을 나란히 두고 비교한다 ④ 판정은 문자열 비교 하나로 끝난다(iso < min) — ISO 형식을 값의 계약으로 고른 이유이자 타임존 문제가 없는 이유다.',
      file: 'src/client/ui-test/docs/demos/calendar/bounds.tsx',
      Component: CalendarBoundsDemo,
    },
    {
      id: 'keyboard',
      title: '로빙 포커스 — 그리드 안에서 Tab 이 한 번만 걸린다',
      note: '검증 포인트 — ① 그리드 전체에서 tabIndex=0 인 칸은 하나뿐이다: Tab 한 번으로 그리드에 들어오고 한 번 더 누르면 나간다(42칸을 Tab 으로 지나가지 않는다) ② ←→ 는 ±1일, ↑↓ 는 ±7일, PageUp/PageDown 은 ±1개월이다 ③ 달 경계를 넘으면 표시 달이 따라 바뀐다 — 안 따라가면 포커스가 화면 밖 칸에 남는다 ④ 마우스만 쓰는 동안에는 포커스가 따라오지 않는다(그리드 안에 포커스가 있을 때만 옮긴다 — 마우스 사용자를 방해하지 않는 조건이다) ⑤ 월 표시가 aria-live="polite" 라 달을 넘기면 스크린리더가 읽는다.',
      file: 'src/client/ui-test/docs/demos/calendar/keyboard.tsx',
      Component: CalendarKeyboardDemo,
    },
    {
      id: 'iso-utils',
      title: 'parseIsoDate · toIsoDate — 문자열 계약의 경계',
      note: '입력칸에 값을 넣어 두 함수의 결과를 직접 본다. 검증 포인트 — ① parseIsoDate 는 형식이 어긋나거나(2026/01/01) 존재하지 않는 날짜(2026-02-31)면 null 이다 — Date 가 오버플로를 조용히 3월 3일로 굴리는 것을 막는다 ② 왕복(parse → toIso)이 원문과 같은지 확인한다 ③ toIsoDate 는 **로컬** y/m/d 로 만든다 — toISOString() 을 쓰면 한국 시간대에서 자정 직후가 전날로 밀린다. 아래 대조 줄이 그것인데, 그 계산 자체가 서버·브라우저 타임존에 따라 갈리므로 **마운트 후에만** 그린다(이 데모가 증명하려는 현상이 데모 자신을 깨뜨리지 않게).',
      file: 'src/client/ui-test/docs/demos/calendar/iso-utils.tsx',
      Component: CalendarIsoUtilsDemo,
    },
  ],
  propsTables: [
    {
      title: 'Calendar',
      rows: definePropRows<CalendarProps>()([
        {
          name: 'value',
          type: "string ('YYYY-MM-DD')",
          description: '단일 선택 강조(primary 채움). Date 객체가 아니라 ISO 문자열이다.',
        },
        {
          name: 'range',
          type: '{ start?: string; end?: string }',
          description:
            '범위 강조 — 양끝은 primary, 사이는 tonal. start <= end 를 요구한다(뒤집히면 띠를 그리지 않는다). 클릭을 start/end 중 무엇으로 볼지는 호출부가 정한다.',
        },
        {
          name: 'onSelect',
          type: '(iso: string) => void',
          description: '날짜 클릭 — 인접 달 칸(outside)도 같은 콜백을 부른다.',
        },
        {
          name: 'min',
          type: "string ('YYYY-MM-DD')",
          description: '하한(**포함**). 밖의 날짜는 비활성이고 hover 배경도 뜨지 않는다.',
        },
        { name: 'max', type: "string ('YYYY-MM-DD')", description: '상한(**포함**).' },
        {
          name: 'initialFocus',
          type: "string ('YYYY-MM-DD')",
          description:
            '처음 보여줄 달의 기준 날짜 — 없으면 value → range.start → 오늘 순이다. 표시 달은 내부 상태라 팝업이 닫혔다 열리면 이 규칙으로 다시 정해진다.',
        },
        { name: 'className', type: 'string', description: '' },
      ]),
    },
    {
      title: 'ISO 유틸',
      rows: definePropRows<HvyUiModule>()([
        {
          name: 'parseIsoDate',
          type: '(value: string | undefined) => Date | null',
          description:
            '유효한 ISO 날짜면 **로컬** Date 로, 아니면 null. 형식 불일치와 존재하지 않는 날짜(2026-02-31)를 모두 거른다 — Date 생성자가 오버플로를 조용히 다음 달로 굴리는 것을 막는다.',
        },
        {
          name: 'toIsoDate',
          type: '(date: Date) => string',
          description:
            '로컬 y/m/d → `YYYY-MM-DD`. **toISOString() 을 쓰지 않는 이유**가 여기 있다 — UTC 로 바꾸면 KST 자정 부근이 전날로 밀린다.',
        },
      ]),
    },
  ],
};
