import '../styles/global.css';
import '../styles/fonts.css';
import '../styles/rainbow.css';
import '../styles/ckeditor.css';
import '../styles/ckeditor-theme.css';
import { ConfirmProvider, ToastViewport } from '@hvy/ui';
import * as Sentry from '@sentry/nextjs';
import { HydrationBoundary, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import Loading from '@/components/Loading';
import AdminLayout from '@/components/layout/admin/AdminLayout';
import CommonLayout from '@/components/layout/common/CommonLayout';
import UtilityLayout from '@/components/layout/common/UtilityLayout';
import { makeQueryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useLoadingStore } from '@/store/useLoadingStore';

function Skyscape({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => makeQueryClient());
  const router = useRouter();
  const { isAuthenticated, loadProfile } = useAuthStore();
  const { isLoading } = useLoadingStore();
  const hasBootstrappedProfileRef = useRef(false);
  const isAdminRoute = router.pathname.startsWith('/admin');
  const isUtilRoute = router.pathname.startsWith('/util');
  const isLoginRoute = router.pathname === '/login';
  const shouldCheckClientAuth = isAdminRoute || isLoginRoute;

  useEffect(() => {
    if (typeof window === 'undefined' || hasBootstrappedProfileRef.current) {
      return;
    }

    hasBootstrappedProfileRef.current = true;
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!shouldCheckClientAuth || isAuthenticated === null) {
      return;
    }

    if (isAdminRoute) {
      if (isAuthenticated === false) {
        router.replace('/login');
      }
      return;
    }

    if (isLoginRoute && isAuthenticated === true) {
      router.replace('/admin');
    }
  }, [isAdminRoute, isAuthenticated, isLoginRoute, router, shouldCheckClientAuth]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const { body, documentElement } = document;

    if (isAdminRoute) {
      body.dataset.adminUi = 'admin';
      body.classList.add('admin-route');
      documentElement.dataset.adminUi = 'admin';
      return;
    }

    delete body.dataset.adminUi;
    body.classList.remove('admin-route');
    delete documentElement.dataset.adminUi;
  }, [isAdminRoute]);

  // React 19 는 boundary 가 잡은 에러를 window 로 재전파하지 않아 ErrorBoundary 단계의
  // 명시 캡처가 필요하다 — Sentry.ErrorBoundary 가 componentStack 첨부까지 담당한다.
  return (
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ padding: '5rem 1rem', textAlign: 'center' }}>
          <p>일시적인 오류가 발생했습니다.</p>
          <button type="button" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="data-theme"
          value={{ light: 'blog', dark: 'blog-dark' }}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConfirmProvider labels={{ cancel: '취소' }}>
            <HydrationBoundary state={pageProps.dehydratedState}>
              <ToastViewport />
              {isLoading && <Loading />}
              {isAdminRoute ? (
                <AdminLayout>
                  <Component {...pageProps} />
                </AdminLayout>
              ) : (
                <CommonLayout>
                  {isUtilRoute ? (
                    <UtilityLayout>
                      <Component {...pageProps} />
                    </UtilityLayout>
                  ) : (
                    <Component {...pageProps} />
                  )}
                </CommonLayout>
              )}
            </HydrationBoundary>
          </ConfirmProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Skyscape;
