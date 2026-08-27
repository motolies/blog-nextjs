'use client';

import { Icon } from '@hvy/ui';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import type { User } from '@/types/user';
import styles from './AdminLayout.module.css';
import { adminNavigationSections, getAdminRouteMeta, isActiveAdminItem } from './adminNavigation';
import Header from './Header';

interface AdminLayoutProps {
  /** app/admin/layout.tsx 의 서버 가드가 조회한 프로필 — 클라이언트 스토어 하이드레이션 원본 */
  user: User;
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'admin.sidebar.collapsed';

/**
 * 관리자 셸 — fixed 헤더 + 사이드바(lg 미만 오프캔버스 / lg 이상 expanded↔collapsed 아이콘 레일).
 * collapse 상태는 localStorage 로 영속한다(마운트 후 적용 — 관리자 전용 화면이라 첫 프레임 플리커 수용).
 */
export default function AdminLayout({ user, children }: AdminLayoutProps) {
  const pathname = usePathname();
  const setProfileFromServer = useAuthStore((s) => s.setProfileFromServer);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const meta = getAdminRouteMeta(pathname);

  // 서버 가드가 조회한 프로필로 클라이언트 스토어를 채운다(loadProfile 재조회 생략 — providers.tsx 의 AuthBootstrap 이 건너뛴다).
  // zustand 스토어는 서버에서 모듈 싱글턴이다 — 렌더 중 set 하면 동시 SSR 요청 간에 사용자가 새어 나간다. 반드시 effect 에서.
  // 첫 프레임의 username 공백은 useGridSettings.tsx 주석이 이미 수용한 동작이다
  useEffect(() => {
    setProfileFromServer(user);
  }, [setProfileFromServer, user]);

  useEffect(() => {
    document.title = `${meta.title} | Blog Admin`;
  }, [meta.title]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 저장된 데스크톱 collapse 상태 복원
  useEffect(() => {
    try {
      setIsCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
    } catch {
      // localStorage 접근 불가 환경은 기본값(펼침) 유지
    }
  }, []);

  // 오프캔버스 열림 중 Escape 로 닫기
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  // 데스크톱(Tailwind lg = 64rem 이상)은 collapse 토글, 미만은 오프캔버스 토글 —
  // CSS 미디어쿼리·Header 의 lg:* 유틸리티와 같은 경계값을 쓴다
  const toggleMenu = () => {
    if (window.matchMedia('(min-width: 64rem)').matches) {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
        } catch {
          // 저장 실패는 무시 — 세션 내 상태로만 동작
        }
        return next;
      });
    } else {
      setIsMenuOpen((prev) => !prev);
    }
  };

  return (
    <div
      className={`admin-shell ${styles.layoutWrapper}`}
      data-sidebar={isCollapsed ? 'collapsed' : 'expanded'}
    >
      <Header toggleMenu={toggleMenu} isCollapsed={isCollapsed} />

      {isMenuOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          onClick={() => setIsMenuOpen(false)}
          aria-label="관리자 메뉴 닫기"
        />
      ) : null}

      <div className={styles.layoutContainer}>
        <aside className={`${styles.layoutMenu} ${isMenuOpen ? styles.menuOpen : ''}`}>
          <div className={styles.menuTop}>
            <div>
              <p className={styles.menuCaption}>Admin Navigation</p>
              <h2 className={styles.menuTitle}>Workspace</h2>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsMenuOpen(false)}
              aria-label="관리자 메뉴 닫기"
            >
              <Icon icon={X} size="lg" />
            </button>
          </div>

          <nav aria-label="관리자 메뉴" className={styles.menuInner}>
            {adminNavigationSections.map((section) => {
              // 섹션 라벨을 목록의 접근 가능한 이름으로 연결한다 — title 은 이미 고유 키다
              const titleId = `admin-nav-${section.title.replace(/\s+/g, '-').toLowerCase()}`;

              return (
                <div className={styles.menuSection} key={section.title}>
                  <p className={styles.menuSectionTitle} id={titleId}>
                    {section.title}
                  </p>
                  <ul className={styles.menuList} aria-labelledby={titleId}>
                    {section.items.map((item) => {
                      const isActive = isActiveAdminItem(item, pathname);

                      return (
                        <li className={styles.menuItem} key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            title={isCollapsed ? item.label : undefined}
                            className={`${styles.menuLink} ${isActive ? styles.active : ''}`}
                          >
                            <Icon icon={item.icon} />
                            <span className={styles.menuLabel}>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className={styles.layoutPage}>
          <main className={`${styles.contentWrapper} ${isMenuOpen ? styles.scrollLocked : ''}`}>
            <div className={styles.containerFluid}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
