/**
 * KST 날짜 유틸 — 순수 함수(React 무의존, vitest node 환경).
 *
 * "오늘 파이프라인"의 오늘은 백엔드 `MarketClock.today()`(Asia/Seoul)와 같아야 한다.
 * 브라우저 로컬 TZ 를 쓰면 해외에서 열었을 때 어제/내일 run 을 오늘로 오판한다.
 */

const KST = 'Asia/Seoul';

/** `en-CA` 로케일은 `YYYY-MM-DD` 순서로 찍는다 — 문자열 조립 없이 ISO 날짜를 얻는 가장 짧은 길이다. */
const KST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: KST,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 오늘(KST) `YYYY-MM-DD`. 테스트를 위해 기준 시각을 주입받는다. */
export function todayKst(now: Date = new Date()): string {
  return KST_DATE.format(now);
}

/** ISO 시각(Instant) → KST 날짜 `YYYY-MM-DD`. 파싱 불가하면 null. */
export function kstDateOf(instant: string | null | undefined): string | null {
  if (!instant) return null;
  const date = new Date(instant);
  return Number.isNaN(date.getTime()) ? null : KST_DATE.format(date);
}

/**
 * `YYYY-MM-DD` **유효 날짜** 판정 — URL 딥링크·수동 실행 폼 값 검증용(백엔드 `@DateTimeFormat(ISO.DATE)`·`LocalDate` 가 받는 꼴).
 *
 * 형식만 보지 않고 UTC 자정으로 왕복시켜 `2026-02-31` 같은 존재하지 않는 날짜를 거른다 —
 * 잘못된 날짜가 POST body 로 나가면 `HttpMessageNotReadable` 이라 컨트롤러 지역 핸들러를 거치지 않고
 * 전역 핸들러(Slack #hvy-error)로 간다.
 */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
