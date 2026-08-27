import type { ReactNode } from 'react';
import CommonLayout from '@/components/layout/common/CommonLayout';
import GtmScript from '@/components/layout/common/GtmScript';

/**
 * 공개 영역 세그먼트 레이아웃 — 서버 컴포넌트.
 * CommonLayout 은 훅이 없어 서버에서 렌더되고, 내부 Header 만 클라이언트다.
 * GTM 은 기존과 동일하게 공개 영역에만 — admin 세그먼트에는 넣지 않는다.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CommonLayout>{children}</CommonLayout>
      <GtmScript />
    </>
  );
}
