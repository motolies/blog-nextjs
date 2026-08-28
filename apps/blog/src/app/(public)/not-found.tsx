import NotFoundContent from '@/components/NotFoundContent';

/**
 * 공개 영역 404 경계 — 하위 세그먼트의 notFound() 는 여기서 받는다.
 * not-found 는 자기 위쪽 layout 체인 안에서 page 자리에 대체 렌더되므로,
 * 크롬(CommonLayout·GtmScript)은 이미 (public)/layout 이 제공한다 — 다시 붙이면 헤더가 중복된다.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
