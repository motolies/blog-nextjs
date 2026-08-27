import type { AxiosRequestConfig } from 'axios';
import { getAuthTokenFromRequest } from './authCookie';
import { buildForwardedHeaders } from './forwardedHeaders';
import type { HeaderSource } from './requestHeaders';

// 서버에서 백엔드 호출 시 사용할 config (forwarded IP 헤더 + 인증 토큰)를 만든다 —
// 서버 컴포넌트의 headers() 와 Route Handler 의 Request.headers 를 모두 받는다
export function buildBackendAuthConfig(source: HeaderSource): AxiosRequestConfig {
  const headers: Record<string, string> = { ...buildForwardedHeaders(source) };
  const authToken = getAuthTokenFromRequest(source);
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return { headers };
}

export const buildSsrAuthConfig = buildBackendAuthConfig;
