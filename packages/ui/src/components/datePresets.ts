import { toIsoDate } from './isoDate';
import type { DateRange } from './rangeOrder';

/**
 * 기간 프리셋 산식 — "오늘 / 최근 7일 / 이번 달" 류의 날짜 계산.
 *
 * **라벨은 여기 없다** — `ui` 는 사전을 모르므로 앱이 라벨을 붙여
 * `DateRangePicker` 의 `presets` prop 으로 조립한다(`PagerLabels` 와 같은 규약).
 * 산식만 중앙에 두는 이유: "최근 7일"이 오늘 포함인지 아닌지 같은 정책이
 * 화면마다 갈리면 같은 버튼이 다른 기간을 조회하게 된다.
 *
 * React 에 의존하지 않는다 — vitest 환경이 node(DOM 없음)라 **순수 모듈만**
 * 단위 테스트가 가능하다(`rangeOrder.ts` 와 같은 이유). `today` 를 인자로
 * 받는 것도 같은 목적이다 — 내부에서 `new Date()` 를 부르면 경계일 테스트가 불가능하다.
 *
 * 월 산식은 JS `Date` 의 오버플로 정규화를 그대로 쓴다 — `new Date(y, m + 1, 0)`
 * 이 말일, `new Date(y, m, d - 6)` 이 월·연 경계를 알아서 넘는다.
 */

export type DatePresetKind =
  | 'today'
  | 'yesterday'
  /** 오늘 **포함** 7일 — 어드민 조회 관례(AntD presets 와 동일). */
  | 'last7'
  /** 오늘 **포함** 30일. */
  | 'last30'
  /** 이번 달 1일 ~ 말일 — 조회 조건이므로 미래(말일)를 자르지 않는다. */
  | 'thisMonth'
  | 'lastMonth';

export const DATE_PRESET_KINDS: readonly DatePresetKind[] = [
  'today',
  'yesterday',
  'last7',
  'last30',
  'thisMonth',
  'lastMonth',
];

/**
 * 날짜 기간을 datetime 계약(`YYYY-MM-DD HH:mm:ss`)으로 정규화한다 —
 * 날짜만 있는 쪽은 **하루 전체**(시작 00:00 · 종료 23:59)로 넓히고,
 * 이미 datetime 인 쪽은 그대로 둔다(minute 정밀도면 초만 절삭). DateTimeRangePicker 의 프리셋이 쓴다.
 */
export function toDateTimeRange(
  range: DateRange,
  precision: 'second' | 'minute' = 'second',
): DateRange {
  const expand = (value: string, time: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value} ${time}` : value;
  // minute 정밀도에서는 이미 datetime 인 값도 초를 절삭한다 — `last24h` 처럼 초까지 계산된
  // 프리셋과 예전 링크의 `HH:mm:ss` 값이 분 단위 입력에 초를 달고 들어오지 않도록.
  const clip = (value: string) =>
    precision === 'minute' ? value.replace(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):\d{2}$/, '$1') : value;
  return {
    start: clip(expand(range.start, precision === 'minute' ? '00:00' : '00:00:00')),
    end: clip(expand(range.end, precision === 'minute' ? '23:59' : '23:59:59')),
  };
}

/** 프리셋 종류 → 기간. `today` 는 로컬 기준 오늘 — 호출부가 `new Date()` 로 준다. */
export function presetRange(kind: DatePresetKind, today: Date): DateRange {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  switch (kind) {
    case 'today': {
      const iso = toIsoDate(today);
      return { start: iso, end: iso };
    }
    case 'yesterday': {
      const iso = toIsoDate(new Date(year, month, day - 1));
      return { start: iso, end: iso };
    }
    case 'last7':
      return { start: toIsoDate(new Date(year, month, day - 6)), end: toIsoDate(today) };
    case 'last30':
      return { start: toIsoDate(new Date(year, month, day - 29)), end: toIsoDate(today) };
    case 'thisMonth':
      return {
        start: toIsoDate(new Date(year, month, 1)),
        end: toIsoDate(new Date(year, month + 1, 0)),
      };
    case 'lastMonth':
      return {
        start: toIsoDate(new Date(year, month - 1, 1)),
        end: toIsoDate(new Date(year, month, 0)),
      };
  }
}

/**
 * 시각까지 포함하는 프리셋 종류 — 날짜 경계로는 표현할 수 없는 구간만 여기 둔다.
 *
 * `DatePresetKind` 와 **합치지 않는다**: 저쪽은 `YYYY-MM-DD` 를 돌려주는 날짜 전용 계약이라
 * `DatePicker`·`DateRangePicker` 가 함께 쓴다. datetime 값이 섞여 들어가면 날짜 피커가 깨진다.
 */
export type DateTimePresetKind =
  /** 지금부터 24시간 전까지 — 자정 경계와 무관한 슬라이딩 윈도우. */
  'last24h';

export const DATE_TIME_PRESET_KINDS: readonly DateTimePresetKind[] = ['last24h'];

/**
 * 프리셋 종류 → datetime 기간(`YYYY-MM-DD HH:mm:ss`).
 * `now` 를 인자로 받는 이유는 `presetRange` 와 같다 — 내부에서 `new Date()` 를 부르면
 * 경계 시각 테스트가 불가능하다.
 *
 * 반환값이 이미 시각을 담고 있으므로 `toDateTimeRange` 는 이 값을 그대로 통과시킨다
 * (날짜만 있는 프리셋만 하루 전체로 넓힌다).
 */
export function presetDateTimeRange(kind: DateTimePresetKind, now: Date): DateRange {
  switch (kind) {
    case 'last24h': {
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { start: toIsoDateTime(from), end: toIsoDateTime(now) };
    }
  }
}

/** 로컬 벽시계 → `YYYY-MM-DD HH:mm:ss`. `toIsoDate` 와 같은 이유로 `toISOString()` 을 쓰지 않는다. */
function toIsoDateTime(date: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${toIsoDate(date)} ${time}`;
}
