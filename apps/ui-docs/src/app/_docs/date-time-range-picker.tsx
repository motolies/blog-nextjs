import type { DateTimeRangePickerProps } from '@hvy/ui';
import { DateTimeRangePickerBasicDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/basic';
import { DateTimeRangePickerModesDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/modes';
import { DateTimeRangePickerNarrowDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/narrow';
import { DateTimeRangePickerPresetsDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/presets';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DateTimeRangePicker } from '@hvy/ui';

/* 값 = YYYY-MM-DD HH:mm:ss — Java Constant.DATETIME_FORMAT 과 1:1 */
<DateTimeRangePicker startName="collectedFrom" endName="collectedTo"
  start={range.start} end={range.end} onRangeChange={setRange} />`;

/** DateTimeRangePicker 문서 — 테두리 하나에 양끝 입력과 달력 버튼 하나를 담은 일시 기간. */
export const dateTimeRangePickerDoc: DocEntry = {
  slug: 'date-time-range-picker',
  category: 'components',
  title: 'DateTimeRangePicker',
  description:
    '일시 기간 — **테두리 하나(dl-field-box) 안에 시작 입력 · ~ · 종료 입력 · 달력 버튼 하나**. 값 16자×2 + 버튼 하나 ≈ 316px 라 모바일 검색 패널(약 325px)에서도 한 줄이고, 폭 분기가 없다(더 좁으면 줄바꿈 대신 입력 안에서 글자가 밀린다). 팝오버도 하나 — 상단 탭으로 시작/종료를 오가며 달력은 양끝을 함께 강조한다. 자동으로 넘어가지 않는다(datetime 은 날짜·시·분 3클릭이라 첫 클릭에서 넘기면 시·분을 고를 기회가 사라진다). 순서가 뒤집히면 맞바꾸는 규칙은 DateRangePicker 와 같은 orderRange 를 공유하고, 그때 편집 중인 탭도 값을 따라 옮긴다. lock(boolean)이면 양끝이 readOnly 가 되고 달력 버튼이 자물쇠 표식으로 바뀐다. clearable 은 없다(의도적 제외).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '일시 기간',
      note: '달력 버튼 하나가 팝오버 하나를 연다. 팝오버 상단 탭(시작/종료)이 편집할 끝을 고르고, 열 때는 채워가는 중이면 다음 빈칸, 다 찼으면 시작부터다. 푸터는 시작을 고치는 중에 종료가 비었으면 [다음](종료 탭으로), 그 외엔 [확인](닫기). 외부 클릭·ESC 로도 닫히고 날짜·시간 클릭으로는 닫히지 않는다 — 두 차원을 조정해야 하므로. 타이핑이든 선택이든 역순이면 두 값이 맞바뀐다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/basic.tsx',
      Component: DateTimeRangePickerBasicDemo,
    },
    {
      id: 'presets',
      title: '기간 프리셋 — 하루 전체로 넓혀진다',
      note: 'DateRangePicker 와 같은 presets prop 을 쓰되 산식이 두 갈래다 — 날짜 프리셋은 presetRange, 시각까지 담는 프리셋(예: 24시간)은 presetDateTimeRange. 날짜만 있는 프리셋은 toDateTimeRange 가 하루 전체(시작 00:00:00 · 종료 23:59:59)로 넓히고 이미 시각이 있는 값은 그대로 둔다 — datetime 검색 조건의 관례다. 프리셋 행은 팝오버 상단에 뜨고, 누르면 양끝이 한 번에 채워지고 닫힌다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/presets.tsx',
      Component: DateTimeRangePickerPresetsDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 "start ~ end" 한 스팬(한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸 — DateRangePicker 와 같은 규칙). view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). disabled 모드는 FormData 제외가 자동이고 셸 배색이 잠기며 달력 버튼도 함께 잠긴다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/modes.tsx',
      Component: DateTimeRangePickerModesDemo,
    },
    {
      id: 'narrow',
      title: '좁은 폭 — 325px 상자에서도 한 줄',
      note: 'iPhone SE(375px) 관리자 검색 패널의 가용 폭이 325px 다. size sm · precision minute 에서 셸이 약 316px 라 한 줄에 들어간다. 폭 분기(미디어쿼리·컨테이너쿼리·JS 측정)는 없다 — 더 좁아지면 줄바꿈 대신 입력 안에서 글자가 밀린다. precision second(19자×2)는 이 폭에 들어가지 않는다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/narrow.tsx',
      Component: DateTimeRangePickerNarrowDemo,
    },
  ],
  propsTables: [
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
          name: 'defaultStart',
          type: 'string',
          defaultValue: "''",
          description: '비제어 초기 시작값.',
        },
        {
          name: 'defaultEnd',
          type: 'string',
          defaultValue: "''",
          description: '비제어 초기 종료값.',
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
          name: 'precision',
          type: "'second' | 'minute'",
          defaultValue: "'second'",
          description: '양끝이 공유한다 — 같은 정밀도여야 문자열 비교(맞바꿈 판정)가 성립한다.',
        },
        {
          name: 'min',
          type: 'string',
          description:
            'ISO **날짜** 경계(포함) — 달력의 날짜 비활성용. 시간 단위 경계는 지원하지 않는다. max 도 같다.',
        },
        {
          name: 'max',
          type: 'string',
          description: 'ISO 날짜 경계(포함) — min 과 같은 규칙.',
        },
        {
          name: 'presets',
          type: 'readonly DateRangePreset[]',
          description:
            '팝오버 상단의 프리셋 버튼 행 — DateRangePicker 와 같은 계약. 날짜만 있는 range 는 toDateTimeRange 가 하루 전체로 넓힌다. 누르면 양끝을 채우고 닫는다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 비활성 표기는 이 축 하나다(mode="disabled", 셸 배색·양끝 입력·달력 버튼이 함께 잠기고 FormData 에서 빠진다). 생략하면 감싼 Field/FormMode 를 따른다.',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            '시스템 채움 영구 불변 — 양끝이 readOnly 가 되고 달력 버튼이 자물쇠 표식으로 스왑된다. 모든 mode 를 이기며 값은 두 이름 모두 전송된다.',
        },
        {
          name: 'invalid',
          type: 'boolean',
          description:
            '셸 테두리에 오류 배색(안의 입력은 테두리가 없어 하나로 충분하다). 양끝 입력에 aria-invalid. Field 안이면 컨텍스트가 이긴다.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '셸과 시작·종료 입력에 함께 적용되는 테마 스케일 유도 5단.',
        },
        {
          name: 'id',
          type: 'string',
          description:
            '시작 입력의 id — 감싼 Field/라벨의 htmlFor 가 가리킬 대상(DateRangePicker 와 같은 규약). 없으면 라벨 연결이 조용히 끊긴다.',
        },
        {
          name: 'className',
          type: 'string',
          description:
            '루트(셸 span)에 병합되는 클래스. 폭은 내용이 정하므로 w-* 를 덮어쓸 필요가 없다.',
        },
      ]),
    },
  ],
};
