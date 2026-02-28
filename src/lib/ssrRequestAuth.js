import {getAuthTokenFromRequest} from './authCookie'

export function buildBackendAuthConfig(req) {
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
