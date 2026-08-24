import axios from 'axios';
import { traceIdFromTraceparent } from './traceparent';

/**
 * axiosClient 가 요청에 실었던 traceparent 에서 traceId 를 복원한다 — 백엔드 SystemLog·GlitchTip 태그와 같은 값.
 * 실패 응답에는 traceId 가 실리지 않지만, 프론트가 보낸 값이 곧 백엔드가 저장한 값이므로 왕복이 필요 없다.
 * AxiosError 가 아니거나(로컬 예외) 헤더 형식이 어긋나면 undefined.
 */
export function getApiErrorTraceId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  return traceIdFromTraceparent(error.config?.headers?.traceparent);
}
