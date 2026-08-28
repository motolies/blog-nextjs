import CommonLayout from '@/components/layout/common/CommonLayout';
import GtmScript from '@/components/layout/common/GtmScript';
import NotFoundContent from '@/components/NotFoundContent';

/**
 * 루트 404 — 라우트에 매칭되지 않는 URL(/_not-found) 전용이다.
 * 이 경로는 루트 layout(html/body/Providers)만 거치고 크롬이 없으므로 CommonLayout·GTM 을 직접 붙인다.
 * 하위 세그먼트의 notFound() 는 각 세그먼트의 경계((public)/not-found.tsx)가 받는다 —
 * not-found 는 위쪽 layout 안에서 page 자리에 대체 렌더되므로, 여기로 오면 헤더가 중복된다.
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
