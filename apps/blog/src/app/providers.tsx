'use client';

import { ConfirmProvider, ToastViewport } from '@hvy/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { type ReactNode, useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { makeQueryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useLoadingStore } from '@/store/useLoadingStore';

// 전역 로딩 오버레이 — useLoadingStore.isLoading 일 때만 렌더
function LoadingOverlay() {
  const isLoading = useLoadingStore((s) => s.isLoading);
  return isLoading ? <Loading /> : null;
}

// 공개 헤더의 사용자 표시용 프로필 1회 부트스트랩.
// effect 시점에 getState() 로 읽는다 — 관리자 영역은 AdminLayout 의 effect 가 먼저 setProfileFromServer 로 채우므로 이중 조회를 건너뛴다
function AuthBootstrap() {
  const loadProfile = useAuthStore((s) => s.loadProfile);
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated === null) loadProfile();
  }, [loadProfile]);
  return null;
}

/**
 * 클라이언트 Provider 체인 — QueryClient → Theme → Confirm 순서.
 * HydrationBoundary 는 SSR 프리페치를 하는 페이지가 직접 소유하고, 에러 경계는 app/error.tsx 가 담당한다.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="data-theme"
        value={{ light: 'blog', dark: 'blog-dark' }}
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ConfirmProvider labels={{ cancel: '취소' }}>
          <ToastViewport />
          <LoadingOverlay />
          {children}
          {/* children 뒤 — 자식(AdminLayout) effect 가 먼저 실행된다 */}
          <AuthBootstrap />
        </ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
