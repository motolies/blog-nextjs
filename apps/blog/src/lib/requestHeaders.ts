/** 요청 헤더 소스 — App Router 의 headers()(ReadonlyHeaders)·Request.headers 공용. 둘 다 get() 인터페이스다 */
export type HeaderSource = Pick<Headers, 'get'> | undefined | null;

// 헤더 한 개를 읽는다 (소스가 없거나 헤더가 없으면 null). 이름 대소문자 무시는 Headers 가 보장한다.
export function readHeader(source: HeaderSource, name: string): string | null {
  return source?.get(name) ?? null;
}
