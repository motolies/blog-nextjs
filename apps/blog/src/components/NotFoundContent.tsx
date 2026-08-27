import Link from 'next/link';

/**
 * 404 본문 — 공개 크롬(CommonLayout) 안에서 렌더되는 정적 서버 컴포넌트.
 * 훅·이벤트 핸들러가 없어 /_not-found 정적 프리렌더에 그대로 실린다. 컨테이너 톤은 login/search 페이지와 동일.
 */
export default function NotFoundContent() {
  return (
    <div className="public-container flex min-h-[50dvh] flex-col items-center justify-center py-12 text-center">
      <span className="section-eyebrow">404</span>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-dl-fg sm:text-3xl">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-dl-fg-muted">
        요청하신 주소가 잘못되었거나 삭제된 페이지입니다. 주소를 다시 확인하거나 홈으로 이동해
        주세요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-dl-primary px-5 py-2.5 text-sm font-semibold text-dl-primary-fg shadow-dl-action transition hover:-translate-y-0.5"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
