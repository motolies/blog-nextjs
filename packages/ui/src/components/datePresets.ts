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
 * 이미 datetime 인 쪽은 그대로 둔다. DateTimeRangePicker 의 프리셋이 쓴다.
 */
export function toDateTimeRange(
  range: DateRange,
  precision: 'second' | 'minute' = 'second',
): DateRange {
  const expand = (value: string, time: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value} ${time}` : value;
  return {
    start: expand(range.start, precision === 'minute' ? '00:00' : '00:00:00'),
    end: expand(range.end, precision === 'minute' ? '23:59' : '23:59:59'),
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
