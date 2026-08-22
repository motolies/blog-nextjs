import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from './AdminLayout.module.css';
import { adminNavigationSections, getAdminRouteMeta, isActiveAdminItem } from './adminNavigation';
import Header from './Header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'admin.sidebar.collapsed';

/**
 * 관리자 셸 — fixed 헤더 + 사이드바(lg 미만 오프캔버스 / lg 이상 expanded↔collapsed 아이콘 레일).
 * collapse 상태는 localStorage 로 영속한다(마운트 후 적용 — 관리자 전용 화면이라 첫 프레임 플리커 수용).
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const meta = getAdminRouteMeta(router.pathname);

  useEffect(() => {
    document.title = `${meta.title} | Blog Admin`;
  }, [meta.title]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

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

  // 데스크톱(오프캔버스 경계 1024px 초과)은 collapse 토글, 이하는 오프캔버스 토글
  const toggleMenu = () => {
    if (window.matchMedia('(min-width: 1025px)').matches) {
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
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={styles.menuInner}>
            {adminNavigationSections.map((section) => (
              <div className={styles.menuSection} key={section.title}>
                <p className={styles.menuSectionTitle}>{section.title}</p>
                <ul className={styles.menuList}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveAdminItem(item, router.pathname);

                    return (
                      <li className={styles.menuItem} key={item.href}>
                        <Link
                          href={item.href}
                          title={isCollapsed ? item.label : undefined}
                          className={`${styles.menuLink} ${isActive ? styles.active : ''}`}
                        >
                          <span className={styles.menuIconWrap}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className={styles.menuLabel}>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
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
