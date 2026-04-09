import {getAuthTokenFromRequest} from './authCookie'
import type { IncomingMessage } from 'http'
import type { AxiosRequestConfig } from 'axios'

export function buildBackendAuthConfig(req: IncomingMessage | undefined | null): AxiosRequestConfig | undefined {
  const authToken = getAuthTokenFromRequest(req)

  if (!authToken) {
    return undefined
  }

  return {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }
}

export const buildSsrAuthConfig = buildBackendAuthConfig
