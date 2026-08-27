'use client';

import { cn, IconButton } from '@hvy/ui';
import { FilePlus, LogIn, Menu, Moon, Search, Shield, Sparkles, Sun, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import MemoDialog from '@/components/memo/MemoDialog';
import { useQuickSearch } from '@/hooks/useQuickSearch';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './Header.module.css';
import MobileNav from './MobileNav';
import { isActiveNavLink, publicNavLinks } from './publicNavigation';

/**
 * 공개 영역 sticky 헤더.
 * 데스크톱(md+): 로고 + 내비 링크 + 검색 input + 액션 아이콘.
 * 모바일(<md): 로고 + 테마 토글 + 햄버거 — 검색·내비·액션은 MobileNav 드로어로 이동.
 */
export default function Header() {
  const pathname = usePathname();
  const userState = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user })),
  );
  const search = useQuickSearch();
  const [memoDialogOpen, setMemoDialogOpen] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 인증 상태별 액션 버튼 — 데스크톱 바에는 아이콘으로, 모바일 드로어에는 그대로 내려준다
  const renderActions = (forMobile: boolean) => {
    const visibility = forMobile ? '' : 'hidden md:inline-flex';
    return (
      <>
        {!userState.user.username ? null : (
          <IconButton
            icon={FilePlus}
            iconSize="sm"
            label="메모 작성"
            className={cn(
              'public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink',
              visibility,
            )}
            onClick={() => setMemoDialogOpen(true)}
          />
        )}

        {pathname === '/login' || userState.user.username ? null : (
          <Link
            href="/login"
            aria-label="로그인"
            className={cn(
              'public-control-surface h-9 w-9 items-center justify-center rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink',
              forMobile ? 'inline-flex' : 'hidden md:inline-flex',
            )}
          >
            <LogIn className="h-4 w-4" />
          </Link>
        )}

        {!userState.user.username ? null : (
          <Link
            href="/admin"
            aria-label="관리자 페이지"
            className={cn(
              'public-control-surface h-9 w-9 items-center justify-center rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink',
              forMobile ? 'inline-flex' : 'hidden md:inline-flex',
            )}
          >
            <Shield className="h-4 w-4" />
          </Link>
        )}
      </>
    );
  };

  return (
    <header className={styles.top}>
      <nav aria-label="주요 탐색" className={cn(styles.back, 'relative z-30')}>
        <div className="public-container flex h-(--header-h) items-center gap-3 md:gap-4">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <Link href="/" className="group inline-flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-dl-primary text-dl-primary-fg shadow-dl-action">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-semibold tracking-[-0.02em] text-dl-fg">
                  motolies
                </span>
              </span>
            </Link>
          </div>

          <ul className="hidden items-center gap-1 md:flex">
            {publicNavLinks.map((link) => {
              const active = isActiveNavLink(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center rounded-full px-3.5 py-2 text-sm font-semibold transition',
                      active
                        ? 'bg-dl-primary/10 text-dl-primary-ink'
                        : 'public-muted-text hover:text-dl-primary-ink',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="relative hidden w-full max-w-44 md:block lg:max-w-sm xl:max-w-lg">
              <Search className="public-label-text pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search posts"
                value={search.searchText}
                onChange={search.onChange}
                onKeyDown={search.onKeyDown}
                className="public-control-surface h-10 w-full rounded-full border pl-9 pr-4 text-sm placeholder:text-[color:var(--public-text-subtle)] backdrop-blur transition focus:border-dl-primary focus:outline-none focus:ring-4 focus:ring-dl-primary sm:h-11"
              />
            </div>

            {mounted && (
              <IconButton
                icon={resolvedTheme === 'dark' ? Sun : Moon}
                iconSize="sm"
                label={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              />
            )}

            {renderActions(false)}

            <IconButton
              icon={mobileNavOpen ? X : Menu}
              iconSize="sm"
              label={mobileNavOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink md:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
            />

            <MemoDialog open={memoDialogOpen} onClose={() => setMemoDialogOpen(false)} />
          </div>
        </div>
      </nav>

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        actions={renderActions(true)}
      />
    </header>
  );
}
