/**
 * 관리 API 오류 응답 해석 — 409(중복 실행)·404(advisor 비활성) 판정. axios 의존만 있어 node 환경에서 테스트된다.
 *
 * `axiosClient` 응답 인터셉터는 **성공 응답만** `ApiResponse.data` 로 언래핑하고 에러는 그대로 reject 한다.
 * 그래서 `error.response.data` 는 `ApiResponse{status:'FAIL', message, data}` 원형이고, 409 의 `runningRunId` 는
 * `error.response.data.data.runningRunId` 에 **문자열**로 있다(백엔드 `Map.of(..., String.valueOf(id))`).
 */
import axios from 'axios';

export type ConflictInfo = { jobType: string | null; runningRunId: string };

/** 409 이면 실행 중 run 정보, 아니면 null. */
export function conflictOf(error: unknown): ConflictInfo | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const payload = error.response.data as { data?: unknown } | undefined;
  const data = payload?.data;
  if (typeof data !== 'object' || data === null) return null;
  const record = data as { jobType?: unknown; runningRunId?: unknown };
  if (record.runningRunId === undefined || record.runningRunId === null) return null;
  return {
    jobType: typeof record.jobType === 'string' ? record.jobType : null,
    runningRunId: String(record.runningRunId),
  };
}

/**
 * 404 — advisor.enabled=false 환경은 `/api/advisor/admin/**` 전체가 404 다(컨트롤러 자체가 없다).
 * 목록·게이트 조회에서의 404 는 "없는 id" 가 아니라 "모듈 비활성" 으로 읽는다.
 */
export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/** 실패 봉투의 message — 400(요청 거부) 문구를 토스트에 그대로 싣는다. 없으면 null. */
export function failMessageOf(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const payload = error.response?.data as { message?: unknown } | undefined;
  return typeof payload?.message === 'string' && payload.message.length > 0
    ? payload.message
    : null;
}
