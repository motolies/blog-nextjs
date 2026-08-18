import { HttpResponse } from 'msw';

/**
 * hvy-common ApiResponse 봉투 재현.
 *
 * 실물 대조(curl https://api.hvy.kr/api/category, 2026-08-19):
 *   성공 = `{timestamp, path, status: "SUCCESS", data}` — message 키 없음.
 *   axios 인터셉터(axiosClient.ts)는 `'status' in data && 'path' in data` 일 때만
 *   평탄화하므로 두 키가 반드시 있어야 한다.
 *
 * 결정론 유지 — 타임스탬프는 고정값(인터셉터는 timestamp 를 읽지 않는다).
 */
const FIXED_TIMESTAMP = '2026-01-01T00:00:00Z';

export function ok<T>(request: Request, data: T, init?: ResponseInit) {
  return HttpResponse.json(
    {
      timestamp: FIXED_TIMESTAMP,
      path: new URL(request.url).pathname,
      status: 'SUCCESS',
      data,
    },
    init,
  );
}

/** 실패 봉투 — 실서버(hvy-common handleException)는 path 를 넣지 않는다. */
export function fail(message: string, httpStatus = 400, errors: unknown[] = []) {
  return HttpResponse.json(
    {
      timestamp: FIXED_TIMESTAMP,
      status: 'FAIL',
      message,
      data: errors,
    },
    { status: httpStatus },
  );
}

/**
 * PageResponse 직렬화 형태 재현 — 실물 키: {page, pageSize, totalCount, list, end, totalPage, begin}.
 * hasPrevios/hasNext 는 Jackson 이 `has` prefix 를 인식하지 않아 직렬화되지 않는다.
 */
export function pageOf<T>(list: T[], page: number, pageSize: number, totalCount: number) {
  const totalPage = Math.ceil(totalCount / pageSize);
  return {
    page,
    pageSize,
    totalCount,
    list,
    totalPage,
    begin: Math.max(0, page - 4),
    end: Math.min(page + 5, Math.max(totalPage - 1, 0)),
  };
}
