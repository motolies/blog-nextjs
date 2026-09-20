import Link from 'next/link';
import AdminPageFrame from '@/components/layout/admin/AdminPageFrame';
import { QuantOverviewClient } from '@/components/quant/overview/QuantOverviewClient';
import { QUANT_ROUTES } from '@/lib/quant/routes';

/**
 * Quant 운영 현황(/admin/quant).
 *
 * 껍데기만 담당하고 데이터는 QuantOverviewClient 가 가진다(타임존·폴링·위젯별 재시도 — 대시보드와 같은 이유).
 * ⚠️ admin-page-frame--fixed 를 쓰지 않는다 — 세로로 흐르는 위젯 화면이라 고정 높이 + overflow:hidden 은 아래 위젯을 잘라낸다.
 */
export default function QuantOverviewPage() {
  return (
    <AdminPageFrame
      actions={
        <>
          <Link
            href={QUANT_ROUTES.collect}
            className="inline-flex items-center rounded-dl-container border border-dl-tonal-border bg-dl-tonal px-3 py-1.5 text-dl-sm font-semibold text-dl-primary-ink transition hover:bg-dl-tonal-hover"
          >
            수집 관리
          </Link>
          <Link
            href={QUANT_ROUTES.advisor}
            className="inline-flex items-center rounded-dl-container border border-dl-tonal-border bg-dl-tonal px-3 py-1.5 text-dl-sm font-semibold text-dl-primary-ink transition hover:bg-dl-tonal-hover"
          >
            AI 판단 관리
          </Link>
        </>
      }
    >
      <QuantOverviewClient />
    </AdminPageFrame>
  );
}
