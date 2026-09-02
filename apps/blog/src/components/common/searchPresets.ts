import { type DateRangePreset, presetDateTimeRange, presetRange } from '@hvy/ui';

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

/**
 * 일시 검색 필드(`type: 'dateTimeRange'`)용 프리셋 — 위 날짜 프리셋의 datetime 판이다.
 *
 * **맨 앞이 "24시간"인 이유**: 나머지 셋은 캘린더 경계(00:00~23:59)를 채우는데, 이것만
 * *경과 시간* 기준 슬라이딩 윈도우다. 자정을 갓 넘긴 시각에 "오늘"을 누르면 30분치만
 * 나오지만 "24시간"은 어제 저녁까지 함께 잡는다 — 이 필드를 datetime 으로 올린 이유가
 * 그 구간이라, 가장 먼저 눈에 띄어야 한다.
 *
 * 뒤 셋은 `presetRange`(날짜)를 그대로 쓴다 — `DateTimeRangePicker` 의 applyPreset 이
 * `toDateTimeRange` 로 하루 전체(00:00~23:59, 양식은 분 정밀도)로 넓히므로 산식을 새로 짤 필요가 없다.
 * 그 `23:59` 는 전송 시 `:59` 가 붙고(sanitizeSearchParams) 백엔드에서 +1초 되어 다음 날
 * 자정이 된다 — 날짜 단위로 조회하던 시절과 결과가 같아지는 지점이다(BrowserDateTimeConverter#toUtcDateTimeRange).
 *
 * 위 날짜 프리셋의 폭 제약(다섯 개가 한계)은 **여기엔 적용되지 않는다**. 팝오버 폭을
 * 프리셋 행이 아니라 달력(min-w-64)+시·분 열이 결정하기 때문이다 — 실측 391px 로,
 * 프리셋이 0개일 때와 같다(칩 넷은 226px). 여유가 160px 남으니 몇 개는 더 들어간다.
 */
export const DATE_TIME_RANGE_PRESETS: readonly DateRangePreset[] = [
  { label: '24시간', range: (now) => presetDateTimeRange('last24h', now) },
  { label: '오늘', range: (today) => presetRange('today', today) },
  { label: '최근 7일', range: (today) => presetRange('last7', today) },
  { label: '최근 30일', range: (today) => presetRange('last30', today) },
];
