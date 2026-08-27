import CommonLayout from '@/components/layout/common/CommonLayout';
import GtmScript from '@/components/layout/common/GtmScript';
import NotFoundContent from '@/components/NotFoundContent';

/**
 * 루트 404 — 미존재 URL 과 하위 세그먼트의 notFound() 가 모두 여기로 온다.
 * (public)/layout 은 이 경계를 감싸지 않으므로 공개 크롬(CommonLayout)과 GTM 을 직접 붙여 기존 Pages 404 와 같은 화면을 유지한다.
 * /_not-found 로 정적 프리렌더되므로 헤더 트리에 useSearchParams 가 있으면 안 된다.
 */
export default function NotFound() {
  return (
    <>
      <CommonLayout>
        <NotFoundContent />
      </CommonLayout>
      <GtmScript />
    </>
  );
}
