import type { DateRangePickerProps } from '@hvy/ui';
import {
  DateRangePickerBasicDemo,
  DateRangePickerBoundsDemo,
  DateRangePickerEmptyDemo,
  DateRangePickerLockDemo,
} from '../../client/ui-test/docs/demos/date-range-picker/basic';
import { DateRangePickerModesDemo } from '../../client/ui-test/docs/demos/date-range-picker/modes';
import { DateRangePickerPresetsDemo } from '../../client/ui-test/docs/demos/date-range-picker/presets';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { DateRangePicker } from '@hvy/ui';

/* 검색 조건의 기간 — 시작·종료가 각자 name 을 가진다 */
<DateRangePicker startName="writtenAtFrom" endName="writtenAtTo"
  start={range.start} end={range.end} onRangeChange={setRange} />`;

/** DateRangePicker 문서 — DatePicker 를 기반으로 조립한 기간 컨트롤. */
export const dateRangePickerDoc: DocEntry = {
  slug: 'date-range-picker',
  category: 'components',
  title: 'DateRangePicker',
  description:
    'DatePicker 를 기반으로 조립한 기간 선택 — 타이핑 정규화·달력 버튼·팝업 배색을 그대로 재사용하고 "두 값을 한 몸으로 다룬다"는 부분만 더한다. **테두리 하나(dl-field-box) 안에 시작 입력 · ~ · 종료 입력 · 달력 버튼 하나**로, DateTimeRangePicker 와 같은 셸이라 어느 폭에서도 한 줄이다. 팝오버는 하나고 상단 탭이 어느 칸을 고칠지 정한다 — 열 때는 채워가는 중이면 다음 빈칸, 다 찼으면 시작부터. 달력 클릭은 한쪽을 확정하고 반대편이 비어 있을 때만 닫지 않고 그쪽으로 넘어간다. 순서가 뒤집히면 경로를 가리지 않고 맞바꾸고 그때 편집 탭도 값을 따라 옮긴다 — 뒤집힌 기간이라는 상태를 만들지 않는다. lock(boolean)이면 양끝이 readOnly 가 되고 달력 버튼이 자물쇠 표식으로 바뀐다. clearable 은 없다(의도적 제외).',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기간 선택',
      note: '달력 버튼 하나가 팝오버를 연다. 이미 채워진 기간은 시작 탭부터 — 종료만 고치려면 종료 탭(또는 종료 입력에 포커스). 고른 칸 하나만 바뀌고 팝오버가 닫힌다 — 종료일 자리에 시작일보다 앞선 날짜를 찍으면 값이 날아가지 않고 두 값이 맞바뀐다.',
      file: 'src/client/ui-test/docs/demos/date-range-picker/basic.tsx',
      Component: DateRangePickerBasicDemo,
    },
    {
      id: 'empty',
      title: '빈 기간에서 두 번 클릭',
      note: '빈 기간은 시작 탭부터 열린다. 첫 클릭이 시작일이고, 반대편이 비어 있으므로 팝오버가 열린 채 종료 탭으로 넘어가 둘째 클릭에서 정렬되어 닫힌다. 반쪽 상태에서는 정렬하지 않는다(비교 대상이 없어 뒤집을 근거가 없다). 종료부터 고르려면 종료 탭을 먼저 누른다.',
      file: 'src/client/ui-test/docs/demos/date-range-picker/basic.tsx',
      Component: DateRangePickerEmptyDemo,
    },
    {
      id: 'presets',
      title: '기간 프리셋 — 오늘 · 최근 7일 · 이번 달',
      note: '산식은 presetRange(ui — "최근 7일이 오늘 포함인가" 같은 정책이 화면마다 갈리지 않게 중앙화), 라벨은 앱이 붙인다. range 를 함수로 주면 클릭 시점의 오늘로 계산한다 — 화면을 밤새 열어둬도 맞다. 클릭하면 달력 클릭과 같은 커밋 경로(orderRange)를 지나 양끝이 채워지고 닫힌다.',
      file: 'src/client/ui-test/docs/demos/date-range-picker/presets.tsx',
      Component: DateRangePickerPresetsDemo,
    },
    {
      id: 'bounds',
      title: 'min / max',
      note: '경계 밖 날짜는 달력에서 비활성(label-disabled 배색). 타이핑 값은 검증하지 않는다 — 서버 검증이 막는다.',
      file: 'src/client/ui-test/docs/demos/date-range-picker/basic.tsx',
      Component: DateRangePickerBoundsDemo,
    },
    {
      id: 'lock',
      title: '잠금 (lock) vs mode="disabled"',
      note: 'lock 은 boolean — 양끝 입력이 readOnly 로 잠기고 달력 버튼이 자물쇠 표식으로 스왑된다(값은 두 이름 모두 FormData 에 실린다). 모든 mode 를 이긴다 — 폼이 edit 로 돌아와도 편집 불가. 전송까지 막아야 하면 mode="disabled" 다 — 두 번째 행이 그 대비다(셸 배색이 잠기고 달력 버튼은 남되 눌리지 않는다).',
      file: 'src/client/ui-test/docs/demos/date-range-picker/basic.tsx',
      Component: DateRangePickerLockDemo,
    },
    {
      id: 'modes',
      title: '3모드 — edit · view · disabled',
      note: 'view 는 "start ~ end" 한 스팬 — ~ 는 양쪽 값이 있을 때만 뜻이 있어 한쪽만 있으면 그쪽만, 양쪽 빈값이면 빈칸이다. view 에서는 입력 DOM 이 사라져 폼 값이 안 나간다(전환 폼 제어형 필수). Field 의 htmlFor 는 시작일 입력에 걸린다.',
      file: 'src/client/ui-test/docs/demos/date-range-picker/modes.tsx',
      Component: DateRangePickerModesDemo,
    },
  ],
  propsTables: [
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
          description: '한 이벤트(맞바꿈·이어받기)가 두 값을 함께 바꾸므로 range 하나로 받는다.',
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
          name: 'presets',
          type: 'readonly DateRangePreset[]',
          description:
            '달력 팝오버 상단의 프리셋 버튼 행 — { label, range } 배열. 산식은 presetRange 를 조립하고 라벨은 앱이 주입한다. edit 에서만 렌더된다.',
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
            '시작일 입력의 id — 감싼 Field 의 htmlFor 가 가리킬 대상이다. Field 안이면 컨텍스트가 주므로 생략한다.',
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
