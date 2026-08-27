import { base64Encode } from '@/util/base64Util';

// 검색 조건 → /search?q=… 링크. base64 의 '+', '/', '=' 가 쿼리에서 깨지지 않도록 반드시 인코딩한다
// (next/navigation 의 router.push 는 문자열만 받으므로 객체형 push 5곳을 이 헬퍼로 통일한다)
export function buildSearchHref(condition: unknown): string {
  return `/search?q=${encodeURIComponent(base64Encode(JSON.stringify(condition)))}`;
}
