import { Icon } from '@hvy/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';

/**
 * 관리자 대시보드.
 *
 * 이 파일은 껍데기만 담당하고 데이터는 DashboardClient 가 가진다(타임존·폴링·위젯별 재시도 때문).
 *
 * ⚠️ admin-page-frame--fixed 를 쓰지 않는다. 이 화면은 세로로 흐르는 6개 구역이라
 *    고정 높이 + overflow:hidden 을 걸면 아래쪽 구역이 스크롤바 없이 잘린다.
 */
export default function AdminPage() {
  return (
    <AdminPageFrame
      actions={
        <Link
          href="/admin/write"
          className="inline-flex items-center gap-2 rounded-dl-container border border-dl-tonal-border bg-dl-tonal px-4 py-2 text-dl-sm font-semibold text-dl-primary-ink transition hover:bg-dl-tonal-hover"
        >
          새 글 작성
          <Icon icon={ArrowRight} />
        </Link>
      }
    >
      <DashboardClient />
    </AdminPageFrame>
  );
}
