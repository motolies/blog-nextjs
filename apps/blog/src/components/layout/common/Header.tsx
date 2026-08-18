import { IconButton } from '@hvy/ui';
import { FilePlus, LogIn, Moon, Search, Shield, Sparkles, Sun } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getTsid } from 'tsid-ts';
import { useShallow } from 'zustand/react/shallow';
import MemoDialog from '@/components/memo/MemoDialog';
import { searchObjectInit } from '@/model/searchObject';
import { useAuthStore } from '@/store/useAuthStore';
import { base64Encode } from '@/util/base64Util';
import styles from './Header.module.css';
export default function Header() {
  const router = useRouter();
  const userState = useAuthStore(
    useShallow((s) => ({ isAuthenticated: s.isAuthenticated, user: s.user })),
  );
  const [searchText, setSearchText] = useState<string>('');
  const [memoDialogOpen, setMemoDialogOpen] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!router.pathname.startsWith('/search')) {
      setSearchText('');
    }
  }, [router.pathname]);

  const onSearchTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const keywords = searchText.trim() ? [{ id: getTsid().toString(), name: searchText }] : [];
      const condition = {
        ...searchObjectInit,
        ...{
          searchCondition: {
            keywords,
            logic: 'AND',
          },
        },
      };
      router.push({ pathname: '/search', query: { q: base64Encode(JSON.stringify(condition)) } });
    }
  };
  const onChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <header className={styles.top}>
      <nav aria-label="주요 탐색" className={styles.back}>
        <div className="public-container flex h-[4.5rem] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 shrink-0 items-center gap-4">
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

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="relative w-full max-w-lg">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 public-label-text sm:left-3" />
              <input
                type="search"
                placeholder="Search posts"
                value={searchText}
                onChange={onChangeText}
                onKeyDown={onSearchTextKeyDown}
                className="public-control-surface h-10 w-full rounded-full border pl-7 pr-3 text-sm placeholder:text-[color:var(--public-text-subtle)] backdrop-blur transition focus:border-dl-primary focus:outline-none focus:ring-4 focus:ring-dl-primary sm:h-11 sm:pl-9 sm:pr-4 sm:text-sm"
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

            {!userState.user.username ? null : (
              <IconButton
                icon={FilePlus}
                iconSize="sm"
                label="메모 작성"
                className="public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink"
                onClick={() => setMemoDialogOpen(true)}
              />
            )}

            {router.pathname === '/login' || userState.user.username ? null : (
              <Link
                href="/login"
                aria-label="로그인"
                className="inline-flex h-9 w-9 items-center justify-center public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            )}

            {!userState.user.username ? null : (
              <Link
                href="/admin"
                aria-label="관리자 페이지"
                className="inline-flex h-9 w-9 items-center justify-center public-control-surface rounded-full border text-[color:var(--public-text-muted)] hover:text-dl-primary-ink"
              >
                <Shield className="h-4 w-4" />
              </Link>
            )}

            <MemoDialog open={memoDialogOpen} onClose={() => setMemoDialogOpen(false)} />
          </div>
        </div>
      </nav>
    </header>
  );
}
