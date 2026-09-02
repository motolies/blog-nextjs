import { type DateRange, orderRange } from './rangeOrder';

/**
 * 범위 피커(DateRangePicker · DateTimeRangePicker)의 편집 흐름 규칙 — 팝오버 하나가 양끝을
 * 번갈아 고칠 때의 판단만 모았다. 값 포맷은 가리지 않는다(`YYYY-MM-DD` 든 `… HH:mm` 이든 사전순 비교).
 *
 * React 에 의존하지 않는다 — vitest 환경이 node(DOM 없음)라 **순수 모듈만**
 * 단위 테스트가 가능하다(`rangeOrder.ts` 와 같은 이유). barrel 에 노출하지 않는다.
 */

/** 기간의 한쪽. */
export type RangeSide = 'start' | 'end';

const opposite = (side: RangeSide): RangeSide => (side === 'start' ? 'end' : 'start');

/**
 * 팝오버를 열 때 먼저 고칠 쪽 — 시작이 비었으면 시작, 시작만 있으면 종료, 둘 다 있으면 시작.
 * "채워가는 중"이면 다음 빈칸으로, 다 채워졌으면 처음부터 — 사용자가 탭으로 언제든 바꿀 수 있다.
 */
export function initialEditingSide(range: DateRange): RangeSide {
  if (!range.start) return 'start';
  if (!range.end) return 'end';
  return 'start';
}

/**
 * 한쪽 값을 커밋한다 — `orderRange` 로 두 값이 맞바뀌었으면 **편집 중인 쪽도 값을 따라 반대로** 옮긴다.
 *
 * 공유 팝오버에서 이걸 안 하면 방금 고른 값이 반대 칸으로 옮겨간 뒤 다음 시·분 클릭이
 * 엉뚱한 칸(원래 편집 중이던 쪽에 남은 예전 값)을 고친다. 맞바뀌지 않았으면 커밋한 쪽이 곧 편집 쪽이다
 * (타이핑으로 반대 칸을 고쳤을 때 팝오버가 그 칸을 따라가게).
 */
export function commitRangeSide(
  range: DateRange,
  side: RangeSide,
  value: string,
): { readonly range: DateRange; readonly editing: RangeSide } {
  const next: DateRange = { ...range, [side]: value };
  const ordered = orderRange(next);
  const swapped = ordered.start !== next.start;
  return { range: ordered, editing: swapped ? opposite(side) : side };
}

/**
 * 날짜 범위의 달력 클릭 — 한 번의 클릭이 한쪽을 확정한다(일시와 달리 시·분이 없다).
 * 반대쪽이 **비어 있을 때만** 열어 둔 채 그쪽으로 넘어간다(빈 기간에서 두 번 클릭 = 기간 완성).
 * 반쪽 상태에서는 정렬하지 않는다 — 비교 대상이 없어 뒤집을 근거가 없다.
 * 반대쪽이 이미 있으면 `commitRangeSide` 로 정렬해 확정하고 닫는다.
 */
export function selectRangeDate(
  range: DateRange,
  editing: RangeSide,
  iso: string,
): { readonly range: DateRange; readonly editing: RangeSide; readonly close: boolean } {
  const other = opposite(editing);
  if (!range[other]) {
    return { range: { ...range, [editing]: iso }, editing: other, close: false };
  }
  return { ...commitRangeSide(range, editing, iso), close: true };
}

/**
 * 팝오버 푸터 버튼의 뜻 — 시작을 고치는 중이고 종료가 비었으면 `next`(종료 탭으로 넘어가고 닫지 않음),
 * 그 외엔 `confirm`(닫기). 자동으로 넘어가지 않는 이유는 datetime 이 날짜·시·분 3클릭이라
 * 첫 클릭에서 넘기면 시·분을 고를 기회가 사라지기 때문이다.
 */
export function footerAction(editing: RangeSide, range: DateRange): 'next' | 'confirm' {
  return editing === 'start' && !range.end ? 'next' : 'confirm';
}

/**
 * 탭 라벨 옆 현재값 — 연도·초를 뺀 `MM-DD HH:mm`. 읽기 전용 표시에만 쓰는 축약이다
 * (입력 칸은 타이핑 계약 `YYYY-MM-DD HH:mm` 을 지켜야 하므로 축약하지 않는다). 형식이 어긋나면 빈 문자열.
 */
export function abbreviateDateTime(value: string): string {
  const match = value.match(/^\d{4}-(\d{2}-\d{2} \d{2}:\d{2})/);
  return match?.[1] ?? '';
}

/** 날짜 범위의 탭 라벨 옆 현재값 — 연도를 뺀 `MM-DD`. 형식이 어긋나면 빈 문자열. */
export function abbreviateDate(value: string): string {
  const match = value.match(/^\d{4}-(\d{2}-\d{2})$/);
  return match?.[1] ?? '';
}
