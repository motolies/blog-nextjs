import {getAuthTokenFromRequest} from './authCookie'
import {buildForwardedHeaders} from './forwardedHeaders'
import type { IncomingMessage } from 'http'
import type { AxiosRequestConfig } from 'axios'

// SSR에서 백엔드 호출 시 사용할 config (forwarded IP 헤더 + 인증 토큰)를 만든다
export function buildBackendAuthConfig(req: IncomingMessage | undefined | null): AxiosRequestConfig {
  const headers: Record<string, string> = { ...buildForwardedHeaders(req) }
  const authToken = getAuthTokenFromRequest(req)
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  return { headers }
}

export const buildSsrAuthConfig = buildBackendAuthConfig
