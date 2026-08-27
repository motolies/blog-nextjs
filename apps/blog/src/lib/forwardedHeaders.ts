import { type HeaderSource, readHeader } from './requestHeaders';

const FORWARD_HEADER_NAMES = [
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
] as const;

// 들어온 요청에서 프록시가 붙인 IP 관련 헤더를 추출한다 (값이 없으면 빈 객체 반환).
// 소스는 headers() 든 Request.headers 든 readHeader 가 흡수한다
export function buildForwardedHeaders(source: HeaderSource): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of FORWARD_HEADER_NAMES) {
    const value = readHeader(source, name);
    if (value) headers[name] = value;
  }
  return headers;
}
