'use client';

import { cn } from '@hvy/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useQuickSearch } from '@/hooks/useQuickSearch';
import { isActiveNavLink, publicNavLinks } from './publicNavigation';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  /** 인증 상태별 액션(메모·관리자·로그인) — Header 가 조립해 내려준다 */
  actions?: React.ReactNode;
}

/**
 * 모바일 내비게이션 disclosure 패널.
 * 헤더(z-60 스태킹 컨텍스트) 내부에서 렌더되므로 z 값은 헤더 기준 상대 서열이다
 * (스크림 z-10 < 패널 z-20 < 헤더 바 z-30). disclosure 패턴이라 포커스 트랩은 두지 않는다.
 */
export default function MobileNav({ open, onClose, actions }: MobileNavProps) {
  const pathname = usePathname();
  const search = useQuickSearch();

  // Escape 키로 닫기
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // 경로가 바뀌면 닫는다. 같은 /search 안에서 쿼리만 바뀌는 빠른검색은 Enter 핸들러가 직접 닫는다 —
  // 헤더에 useSearchParams 를 두면 정적 페이지 전체가 Suspense/CSR 로 밀리므로 쓰지 않는다
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) {
    return null;
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="메뉴 닫기"
        onClick={onClose}
        className="public-scrim fixed inset-0 z-10 cursor-default"
      />
      <nav
        id="mobile-nav"
        aria-label="모바일 탐색"
        className="surface-panel-strong fixed inset-x-0 top-(--header-h) z-20 max-h-[calc(100dvh-var(--header-h))] overflow-y-auto rounded-b-(--radius-card) px-(--public-gutter) py-(--public-pad-card)"
      >
        <div className="relative">
          <Search className="public-label-text pointer-events-none absolute left-3 top-1/2 size-(--public-icon) -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search posts"
            value={search.searchText}
            onChange={search.onChange}
            onKeyDown={(e) => {
              search.onKeyDown(e);
              // 같은 /search 안에서 쿼리만 바뀌면 pathname effect 가 안 돌므로 여기서 닫는다
              if (e.key === 'Enter') onClose();
            }}
            className="public-control-surface public-text-body h-10 w-full rounded-full border pl-9 pr-4 placeholder:text-[color:var(--public-text-subtle)] transition focus:border-dl-primary focus:outline-none focus:ring-4 focus:ring-dl-primary lg:h-11"
          />
        </div>

        <ul className="mt-3 grid gap-1">
          {publicNavLinks.map((link) => {
            const active = isActiveNavLink(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'public-text-body block rounded-(--radius-card) px-3 py-2.5 font-semibold transition',
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

        {actions && (
          <div className="mt-3 flex items-center gap-2 border-t border-[color:var(--public-header-border)] pt-3">
            {actions}
          </div>
        )}
      </nav>
    </div>
  );
}
