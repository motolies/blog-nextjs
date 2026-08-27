import * as Sentry from '@sentry/nextjs';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { currentTraceparent } from '@/lib/sentryTrace';

const CLIENT_TIMEZONE_HEADER = 'X-Client-Timezone';
const CLIENT_UTC_OFFSET_HEADER = 'X-Client-Utc-Offset-Minutes';

const axiosClient = axios.create({
  withCredentials: true,
});

axiosClient.defaults.headers.post['Content-Type'] = 'application/json';

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = typeof window === 'undefined' ? getBackendBaseUrl() : '';

  if (typeof window !== 'undefined') {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = -new Date().getTimezoneOffset();

    config.headers = config.headers ?? ({} as any);
    config.headers[CLIENT_TIMEZONE_HEADER] = timeZone;
    config.headers[CLIENT_UTC_OFFSET_HEADER] = String(offsetMinutes);
  }

  // 트레이스 전파는 W3C traceparent 단일 헤더로 통일한다 — Sentry 이벤트의 trace_id 와
  // 백엔드(Micrometer OTel/W3C 수신) 로그 MDC·tb_system_log.trace_id 가 같은 값이 되어 검색이 이어진다.
  const traceparent = currentTraceparent();
  if (traceparent) {
    config.headers.traceparent = traceparent;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data && 'status' in response.data && 'path' in response.data) {
      response.data = response.data.data ?? null;
    }
    return response;
  },
  (error) => {
    // 브라우저에서만 캡처한다 — 서버 측 실패는 onRequestError/error.tsx 가 담당해 중복을 막는다.
    // react-query 가 에러를 상태로 삼키므로 이 인터셉터가 클라이언트 API 실패의 유일한 캡처 지점이다.
    if (typeof window !== 'undefined' && isReportableAxiosError(error)) {
      Sentry.captureException(error, {
        tags: { source: 'axios' },
        extra: {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
        },
      });
    }
    return Promise.reject(error);
  },
);

// 4xx 는 기대된 사용자 오류(검증 실패·권한 등)라 제외하고, 서버 장애 신호만 보고한다
function isReportableAxiosError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return true; // 예기치 못한 비-axios 오류
  if (error.code === 'ERR_CANCELED') return false; // 요청 취소는 정상 흐름
  if (!error.response) return true; // 네트워크 단절/타임아웃
  return error.response.status >= 500;
}

export default axiosClient;
