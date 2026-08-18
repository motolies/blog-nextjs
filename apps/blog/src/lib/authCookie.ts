import {parse, serialize} from 'cookie'
import type { IncomingMessage } from 'http'

export const FRONT_AUTH_COOKIE_NAME = 'hvy_access_token'
const BACKEND_AUTH_COOKIE_NAME = 'Authorization'

export function getAuthTokenFromRequest(req: IncomingMessage | undefined | null): string | null {
  const rawCookie = req?.headers?.cookie
  if (!rawCookie) {
    return null
  }

  const cookies = parse(rawCookie)
  return cookies[FRONT_AUTH_COOKIE_NAME] ?? null
}

export function buildAuthCookie(token: string, options: { maxAge?: number } = {}): string {
  const {maxAge} = options

  return serialize(FRONT_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(Number.isFinite(maxAge) && maxAge! > 0 ? {maxAge} : {})
  })
}

export function clearAuthCookie(): string {
  return serialize(FRONT_AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })
}

export function extractBackendAuthCookie(setCookieHeader: string | string[]): { value: string; maxAge?: number } | null {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  const authCookie = headers
      .filter(Boolean)
      .find((entry) => entry.startsWith(`${BACKEND_AUTH_COOKIE_NAME}=`))

  if (!authCookie) {
    return null
  }

  const cookieValue = authCookie
      .split(';', 1)[0]
      .slice(`${BACKEND_AUTH_COOKIE_NAME}=`.length)

  const maxAgeMatch = authCookie.match(/;\s*Max-Age=(\d+)/i)

  return {
    value: decodeCookieValue(cookieValue),
    maxAge: maxAgeMatch ? Number(maxAgeMatch[1]) : undefined
  }
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
