import { type DateRangePreset, presetRange } from '@hvy/ui';

/**
 * 검색 필드용 기간 프리셋 — **산식은 `ui`(presetRange), 라벨은 앱이 소유한다.**
 * `ui` 는 사전을 모르므로 라벨을 주입받고, 대신 "최근 7일이 오늘 포함인지" 같은 정책은
 * 중앙에서 쥔다(datePresets.ts 헤더 주석). 그리드 크롬의 `PAGER_LABELS`(grid/gridLabels.ts)
 * 와 같은 규약이고, 이 파일은 그 검색 필드판이다.
 *
 * ⚠️ `range` 는 **함수여야 한다.** `presetRange('today', new Date())` 로 값을 굳히면
 * 모듈 로드 시점의 오늘이 박제돼, 화면을 밤새 열어두면 "오늘"이 어제를 가리킨다.
 * 함수로 주면 `DateRangePicker` 의 applyPreset 이 클릭 시점의 `new Date()` 로 계산한다.
 *
 * 라벨 문구는 ui-docs 데모(demos/date-range-picker/presets.tsx)와 글자까지 같다 —
 * 같은 컴포넌트가 문서와 앱에서 다른 문구를 쓰면 문서가 정본 노릇을 못 한다.
 *
 * 5종인 이유: 칩 행이 nowrap 이라 **프리셋 행이 팝오버 폭을 결정한다**(달력은 min-w-64 로
 * 따라온다). 다섯 개가 292px 로, 좁은 화면에서도 팝오버가 화면을 넘지 않는 한계선이다.
 */
export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  { label: '오늘', range: (today) => presetRange('today', today) },
  { label: '최근 7일', range: (today) => presetRange('last7', today) },
  { label: '최근 30일', range: (today) => presetRange('last30', today) },
  // { label: '이번 달', range: (today) => presetRange('thisMonth', today) },
  // { label: '지난달', range: (today) => presetRange('lastMonth', today) },
];
