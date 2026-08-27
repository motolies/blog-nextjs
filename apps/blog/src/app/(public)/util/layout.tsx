import type { ReactNode } from 'react';
import UtilityLayout from '@/components/layout/common/UtilityLayout';

// /util 세그먼트 레이아웃 — 하위 페이지 전부를 CommonLayout 안쪽 UtilityLayout 으로 감싼다
export default function UtilLayout({ children }: { children: ReactNode }) {
  return <UtilityLayout>{children}</UtilityLayout>;
}
