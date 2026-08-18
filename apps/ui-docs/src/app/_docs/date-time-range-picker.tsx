import type { DateTimeRangePickerProps } from '@hvy/ui';
import { DateTimeRangePickerBasicDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/basic';
import { DateTimeRangePickerModesDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/modes';
import { DateTimeRangePickerPresetsDemo } from '../../client/ui-test/docs/demos/date-time-range-picker/presets';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DateTimeRangePicker } from '@hvy/ui';

/* 값 = YYYY-MM-DD HH:mm:ss — Java Constant.DATETIME_FORMAT 과 1:1 */
<DateTimeRangePicker startName="collectedFrom" endName="collectedTo"
  start={range.start} end={range.end} onRangeChange={setRange} />`;

/** DateTimeRangePicker 문서 — 끝마다 자기 팝오버를 가진 일시 기간. */
export const dateTimeRangePickerDoc: DocEntry = {
  slug: 'date-time-range-picker',
  category: 'components',
  title: 'DateTimeRangePicker',
  description:
    '일시 기간 — DateRangePicker(공유 달력 1개)와 달리 **끝마다 자기 팝오버**를 가진다. datetime 은 끝마다 날짜+시간 2차원이라 공유 팝업 하나에 시간 리스트 2벌을 담으면 과밀하고, QA 의 기준일자 검색 변형도 입력별 달력 형태다. 순서가 뒤집히면 맞바꾸는 규칙은 DateRangePicker 와 같은 orderRange 를 공유한다 — 값이 "날짜 공백 시각" 동일 포맷이고 양끝이 precision 을 공유해 문자열 비교가 그대로 성립한다. lock(boolean)이면 양끝이 readOnly 가 되고 팝오버 버튼이 자물쇠 표식으로 바뀐다. clearable 은 없다 — 우측 슬롯이 양끝 각각에 있어 과밀해진다(의도적 제외).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '일시 기간',
      note: '양끝이 각자 팝오버를 연다. 팝오버는 [확인]·외부 클릭·ESC 로 닫히고 날짜·시간 클릭으로는 닫히지 않는다 — 두 차원을 조정해야 하므로. 타이핑이든 선택이든 역순이면 두 값이 맞바뀐다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/basic.tsx',
      Component: DateTimeRangePickerBasicDemo,
    },
    {
      id: 'presets',
      title: '기간 프리셋 — 하루 전체로 넓혀진다',
      note: 'DateRangePicker 와 같은 presets prop·같은 presetRange 산식을 쓴다. 날짜만 있는 프리셋은 toDateTimeRange 가 하루 전체(시작 00:00:00 · 종료 23:59:59)로 넓힌다 — datetime 검색 조건의 관례다. 프리셋 행은 양쪽 팝오버 상단에 똑같이 뜨고, 어느 쪽에서 눌러도 양끝이 한 번에 채워지고 그 팝오버만 닫힌다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/presets.tsx',
      Component: DateTimeRangePickerPresetsDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 "start ~ end" 한 스팬(한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸 — DateRangePicker 와 같은 규칙). view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). disabled 모드는 FormData 제외가 자동이고 끝마다 달린 팝오버 버튼도 함께 잠긴다.',
      file: 'src/client/ui-test/docs/demos/date-time-range-picker/modes.tsx',
      Component: DateTimeRangePickerModesDemo,
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
            '양쪽 팝오버 상단의 프리셋 버튼 행 — DateRangePicker 와 같은 계약. 날짜만 있는 range 는 toDateTimeRange 가 하루 전체로 넓힌다.',
        },
        {
          name: 'mode',
          type: "'edit' | 'view' | 'disabled'",
          description:
            '폼 상태 — 비활성 표기는 이 축 하나다(mode="disabled", 양끝 입력·팝오버 버튼이 함께 잠기고 FormData 에서 빠진다). 생략하면 감싼 Field/FormMode 를 따른다.',
        },
        {
          name: 'lock',
          type: 'boolean',
          description:
            '시스템 채움 영구 불변 — 양끝이 readOnly 가 되고 팝오버 버튼이 자물쇠 표식으로 스왑된다. 모든 mode 를 이기며 값은 두 이름 모두 전송된다.',
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
        {
          name: 'className',
          type: 'string',
          description: '루트(행 span)에 병합되는 클래스.',
        },
      ]),
    },
  ],
};
