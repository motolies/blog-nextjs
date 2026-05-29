import type { IncomingMessage } from 'http'

const FORWARD_HEADER_NAMES = ['x-real-ip', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host'] as const

// 들어온 요청에서 프록시가 붙인 IP 관련 헤더를 추출한다 (값이 없으면 빈 객체 반환)
export function buildForwardedHeaders(req: IncomingMessage | undefined | null): Record<string, string> {
  const headers: Record<string, string> = {}
  const incoming = req?.headers
  if (!incoming) return headers
  for (const name of FORWARD_HEADER_NAMES) {
    const value = incoming[name]
    if (typeof value === 'string' && value.length > 0) headers[name] = value
  }
  return headers
}
