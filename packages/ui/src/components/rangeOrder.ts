/**
 * 기간 값의 정렬 규칙 — **뒤집힌 기간이라는 상태를 만들지 않는다.**
 *
 * DateRangePicker·DateTimeRangePicker 가 공유한다. 한때 같은 규칙이 세 곳에
 * 복제되어 있었고 그중 달력 클릭 경로만 "재시작"(종료값을 버리고 다시 시작)으로
 * 갈라져 있었다 — 마우스로 고르면 값이 하나 날아가고 키보드로 치면 보존되는
 * 차이가 여기서 났다. 정책은 이 파일 하나가 갖는다.
 *
 * React 에 의존하지 않는다 — vitest 환경이 node(DOM 없음)라 **순수 모듈만**
 * 단위 테스트가 가능하다(`src/grid/columnLayout.ts` 와 같은 이유).
 */

/** 각각 `YYYY-MM-DD`(datetime 계열은 `YYYY-MM-DD HH:mm:ss`) 또는 빈 문자열. */
export type DateRange = { readonly start: string; readonly end: string };

/**
 * 시작 > 종료면 두 값을 맞바꾼다.
 *
 * 한쪽이 비면 비교 자체가 성립하지 않으므로 그대로 둔다 — 기간을 채워가는
 * 도중(반쪽 상태)을 역순으로 오판해 뒤집으면 안 된다.
 *
 * 문자열 비교로 끝나는 근거: 값이 ISO 포맷이라 **사전순 = 날짜순**이다
 * (`calendar.tsx` 헤더 주석). datetime 도 `날짜 공백 시각` 동일 포맷이고
 * 양끝이 precision 을 공유하므로 같은 비교가 그대로 성립한다.
 */
export function orderRange(range: DateRange): DateRange {
  if (range.start && range.end && range.start > range.end) {
    return { start: range.end, end: range.start };
  }
  return range;
}
