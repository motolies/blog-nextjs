import { toDateTimeRange } from '@hvy/ui';
import { isIsoDate } from './quant/kstDate';

/**
 * URL 쿼리스트링 → 그리드 검색 기본값.
 *
 * 대시보드의 타일·에러 행이 필터가 걸린 화면으로 바로 보내려면 목적지가 URL 을 읽어야 한다.
 * 허용 목록 방식인 이유: 임의의 쿼리 파라미터가 그대로 검색 조건으로 흘러 들어가면
 * 백엔드에 예상치 못한 필드가 전달된다.
 */

const POST_FILTER_KEYS = [
  'subject',
  'categoryId',
  'tagName',
  'status',
  'publicAccess',
  'hasDraft',
  'minViewCount',
  'maxViewCount',
  'dateField',
  'dateFrom',
  'dateTo',
] as const;

/** 기준일 선택이 생기기 전 링크(`?createdAtFrom=`)의 키 → 새 키. 작성일 구간으로 읽는다. */
const LEGACY_POST_DATE_KEYS = { createdAtFrom: 'dateFrom', createdAtTo: 'dateTo' } as const;

/** 기준일 허용값 — 백엔드 PostAdminSearchRequest.dateField 와 같다. 그 밖의 값은 버린다. */
const POST_DATE_FIELDS: readonly string[] = ['createdAt', 'updatedAt'];

const LOG_FILTER_KEYS = [
  'traceId',
  'spanId',
  'requestUri',
  'controllerName',
  'methodName',
  'httpMethodType',
  'remoteAddr',
  'status',
  'createdAtFrom',
  'createdAtTo',
] as const;

/** 로그 화면의 일시 키 — 값 꼴을 맞춰줘야 하는 대상이다. posts 는 `dateFrom`/`dateTo` 를 쓴다. */
const LOG_DATE_TIME_KEYS = ['createdAtFrom', 'createdAtTo'] as const;

/**
 * URL 의 날짜 값을 일시 계약(`YYYY-MM-DD HH:mm`)으로 맞춘다.
 *
 * 기간 필터가 일시로 올라가기 전에 만들어진 링크(`?createdAtFrom=2026-08-01`)가 아직
 * 북마크에 남아 있을 수 있다. 날짜만 온 값은 `toDateTimeRange` 가 하루 전체로 넓히므로
 * 그 링크는 예전과 같은 구간을 조회한다. 이미 시각이 붙은 값은 분까지만 남긴다 —
 * 양식이 분 정밀도라 초가 붙은 값이 입력에 그대로 보이면 안 된다.
 *
 * `pick` 은 값 형식을 검증하지 않는다 — 형식을 아는 유일한 자리가 여기다.
 */
function normalizeDateTimeValues(
  picked: Record<string, string>,
  [fromKey, toKey]: readonly [string, string],
): Record<string, string> {
  if (!(fromKey in picked) && !(toKey in picked)) return picked;

  const expanded = toDateTimeRange(
    { start: picked[fromKey] ?? '', end: picked[toKey] ?? '' },
    'minute',
  );
  const normalized = { ...picked };
  // 원래 없던 쪽은 그대로 비워 둔다 — 한쪽만 지정한 조회를 양쪽으로 늘리지 않는다.
  if (fromKey in picked) normalized[fromKey] = expanded.start;
  if (toKey in picked) normalized[toKey] = expanded.end;
  return normalized;
}

function pick(search: string, keys: readonly string[]): Record<string, string> {
  const params = new URLSearchParams(search);
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value !== null && value !== '') {
      picked[key] = value;
    }
  }
  return picked;
}

/**
 * /admin/posts 용. 예: `?status=TEM`, `?hasDraft=true`, `?dateField=updatedAt&dateFrom=2026-08-01`
 *
 * 기준일(`dateField`)이 없던 옛 링크의 `createdAtFrom/To` 는 `dateFrom/dateTo` 로 옮긴다 —
 * 기준일 기본값이 작성일이라 예전과 같은 구간을 조회한다. 새 키가 함께 오면 새 키가 이긴다.
 */
export function pickPostFilters(search: string): Record<string, string> {
  const picked = pick(search, POST_FILTER_KEYS);
  const legacy = pick(search, Object.keys(LEGACY_POST_DATE_KEYS));
  for (const [oldKey, newKey] of Object.entries(LEGACY_POST_DATE_KEYS)) {
    const value = legacy[oldKey];
    if (value !== undefined && !(newKey in picked)) picked[newKey] = value;
  }
  const dateField = picked.dateField;
  if (dateField !== undefined && !POST_DATE_FIELDS.includes(dateField)) delete picked.dateField;
  return normalizeDateTimeValues(picked, ['dateFrom', 'dateTo']);
}

/**
 * /admin/system-log 용. 예: `?traceId=abc`
 *
 * traceId 로 찾아 들어온 경우에는 날짜 기본값(오늘)을 걸지 않는다 —
 * 트레이스 검색은 시점을 모르고 하는 조회라 날짜로 가두면 아무것도 안 나온다.
 */
export function pickLogFilters(
  search: string,
  fallback: Record<string, string>,
): Record<string, string> {
  const picked = pick(search, LOG_FILTER_KEYS);
  if (Object.keys(picked).length === 0) {
    return fallback;
  }
  // URL 필터가 하나라도 있으면 날짜 기본값을 걸지 않는다 — 날짜 키를 함께 넘겼는지는
  // 따지지 않는다(예전 코드의 hasDateFilter 분기는 양쪽 결과가 같은 죽은 가지였다).
  return normalizeDateTimeValues(picked, LOG_DATE_TIME_KEYS);
}

const QUANT_RUN_FILTER_KEYS = ['jobType', 'status', 'from', 'to'] as const;

/**
 * /admin/quant/collect·advisor 실행 이력 탭용. 예: `?jobType=DAILY&status=FAILED&from=2026-09-01&to=2026-09-20`
 *
 * 허용 목록만이 아니라 **값도 검증한다** — `jobType`·`status` 는 백엔드 enum 경로 변수라 모르는 값을 보내면
 * 400 이 나고 400 은 Slack 을 울린다. 허용 값 목록은 모듈(stock/advisor)마다 달라 호출부가 넘긴다.
 * `from`/`to` 는 `@DateTimeFormat(ISO.DATE)` 가 받는 `YYYY-MM-DD` 만 통과시킨다(dateRange 피커 값 계약과 같다).
 * `tab`·`run` 같은 화면 상태 키는 여기 없으므로 자연히 걸러진다.
 */
export function pickQuantRunFilters(
  search: string,
  allowed: { jobTypes: readonly string[]; statuses: readonly string[] },
): Record<string, string> {
  const picked = pick(search, QUANT_RUN_FILTER_KEYS);
  if (picked.jobType !== undefined && !allowed.jobTypes.includes(picked.jobType)) {
    delete picked.jobType;
  }
  if (picked.status !== undefined && !allowed.statuses.includes(picked.status)) {
    delete picked.status;
  }
  if (picked.from !== undefined && !isIsoDate(picked.from)) delete picked.from;
  if (picked.to !== undefined && !isIsoDate(picked.to)) delete picked.to;
  return picked;
}
