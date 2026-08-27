import { Suspense } from 'react';
import SearchPageClient from '@/components/search/SearchPageClient';

/**
 * /search — 서버 컴포넌트 셸(정적 프리렌더).
 * useSearchParams 를 쓰는 클라이언트 트리는 Suspense 경계가 있어야 정적 프리렌더가 통과한다 — 경계는 여기 한 곳뿐이다.
 */
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}
