'use client';

import { ConfirmProvider, cn, ToastViewport } from '@hvy/ui';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { normalizeTheme, withTheme } from '../../shared/theme';
import { ThemeSelect } from './theme-select';

/**
 * 문서 사이트의 공용 셸 — 좌측 사이드바 + 테마 전환기 + 오버레이 기반시설.
 *
 * 사이드바 항목이 클라이언트 state 가 아니라 **URL(문서 페이지)** 인 이유: 특정 문서를
 * 링크로 공유하고 새로고침해도 유지되게 한다 — "URL 이 진실 소스"라는 레포 규칙과
 * 같은 방향이다. 테마도 같은 규칙(`?theme=`)이라 사이드바 링크가 전부 `withTheme` 를
 * 지나간다 — 빠뜨린 링크는 이동 시 테마가 리셋된다. `nav` 는 layout(RSC)이
 * 레지스트리에서 파생해 내리는 직렬화 가능한 배열이다 — 셸이 레지스트리를 직접
 * import 하면 모든 데모가 셸 번들에 딸려온다.
 *
 * useSearchParams 를 쓰므로 layout 이 Suspense 로 감싼다(정적 프리렌더 요건).
 * `ToastViewport` 는 `absolute` 로 뜨므로 콘텐츠 래퍼(`relative min-h-dvh`)가 기준면이
 * 된다. 사전(i18n)을 쓰지 않는 개발자용 화면이라 문구는 전부 한국어 리터럴이다.
 */
export type UiDocsNavGroup = {
  /** 카테고리 표시명 — 그룹 헤딩이자 카테고리 인덱스 링크. */
  readonly label: string;
  readonly href: string;
  readonly items: readonly { readonly href: string; readonly title: string }[];
};

/** 사이드바 항목의 활성/비활성 클래스 — 개요·문서 링크가 같은 규칙을 쓴다. */
function itemClass(active: boolean): string {
  return cn(
    'block rounded-dl-control px-2.5 py-1.5 text-dl-sm',
    active
      ? 'bg-dl-tonal font-semibold text-dl-tonal-fg'
      : 'text-dl-nav-fg hover:bg-dl-tonal hover:text-dl-tonal-fg',
  );
}

export function UiTestShell({
  nav,
  children,
}: {
  readonly nav: readonly UiDocsNavGroup[];
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  const theme = normalizeTheme(useSearchParams().get('theme'));
  const hubActive = pathname === '/';

  return (
    <ConfirmProvider labels={{ cancel: '취소' }}>
      <div className="relative min-h-dvh bg-dl-canvas md:grid md:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-dl-border-soft bg-dl-surface p-dl-gutter md:sticky md:top-0 md:max-h-dvh md:overflow-y-auto md:border-r md:border-b-0">
          <Link href={withTheme('/', theme)} className="block">
            <span className="text-dl-xl font-bold text-dl-fg-strong">@hvy/ui</span>
            <span className="mt-0.5 block text-dl-xs text-dl-fg-muted">
              컴포넌트 문서 — 로컬 전용
            </span>
          </Link>

          <div className="mt-3">
            <ThemeSelect />
          </div>

          <nav className="mt-4 flex flex-col gap-4">
            <Link
              href={withTheme('/', theme)}
              aria-current={hubActive ? 'page' : undefined}
              className={itemClass(hubActive)}
            >
              개요
            </Link>

            {nav.map((group) => (
              <div key={group.href}>
                <Link
                  href={withTheme(group.href, theme)}
                  className="block px-2.5 text-dl-xs font-semibold text-dl-fg-muted hover:text-dl-fg"
                >
                  {group.label}
                </Link>
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={withTheme(item.href, theme)}
                          aria-current={active ? 'page' : undefined}
                          className={itemClass(active)}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-col gap-6 p-dl-gutter">{children}</main>

        <ToastViewport />
      </div>
    </ConfirmProvider>
  );
}
