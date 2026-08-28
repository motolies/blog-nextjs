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
  'createdAtFrom',
  'createdAtTo',
] as const;

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

/** /admin/posts 용. 예: `?status=TEM`, `?hasDraft=true` */
export function pickPostFilters(search: string): Record<string, string> {
  return pick(search, POST_FILTER_KEYS);
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
  const hasDateFilter = 'createdAtFrom' in picked || 'createdAtTo' in picked;
  return hasDateFilter ? picked : { ...picked };
}
