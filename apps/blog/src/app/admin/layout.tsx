import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import { fetchProfileOrNull } from '@/lib/serverProfile';

/**
 * 관리자 서버 가드 — 미인증이면 HTML 을 내리지 않고 /login 으로(옛 _app 의 클라이언트 replace 를 서버 가드로 대체).
 * 클라이언트 내비게이션(/admin/a → /admin/b)에서는 재실행되지 않는다 — 토큰 만료는 API 401 로 드러난다(옛 _app 의 프로세스당 1회 판정과 동일).
 * fetchProfileOrNull 은 401/403 만 null 로 매핑하고 그 외(네트워크·5xx)는 throw 해 error.tsx 로 간다 — 백엔드 장애를 "미인증" 으로 오판해 로그인 페이지로 튕기지 않는다.
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await fetchProfileOrNull(await headers());
  if (!user) redirect('/login'); // redirect 는 throw — try/catch 밖에서
  return <AdminLayout user={user}>{children}</AdminLayout>;
}
