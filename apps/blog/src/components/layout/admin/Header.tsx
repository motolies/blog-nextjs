import { Icon } from '@hvy/ui';
import { ArrowUpRight, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { getAdminBreadcrumb } from './adminNavigation';
import styles from './Header.module.css';

interface HeaderProps {
  /** lg 미만: 오프캔버스 토글 / lg 이상: 사이드바 collapse 토글 (AdminLayout 이 분기) */
  toggleMenu: () => void;
  isCollapsed: boolean;
}

/**
 * 관리자 fixed 헤더 — 토글 버튼(전 구간 노출) + 브랜드 + 브레드크럼 + 테마 토글 + 블로그 보기.
 * 브레드크럼의 현재 페이지(h1)가 admin 페이지 타이틀의 정본이다 —
 * 본문(AdminPageFrame)은 타이틀을 렌더하지 않는다. lg 미만에서는 섹션을 숨기고 현재 페이지만 보여준다.
 */
export default function Header({ toggleMenu, isCollapsed }: HeaderProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const crumb = getAdminBreadcrumb(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className={styles.layoutNavbar}>
      <div className={styles.navbarContent}>
        <div className={styles.navbarStart}>
          <button
            type="button"
            className={styles.menuToggleBtn}
            onClick={toggleMenu}
            aria-label="관리자 메뉴 토글"
          >
            <Icon icon={Menu} size="md" className="lg:hidden" />
            {isCollapsed ? (
              <Icon icon={PanelLeftOpen} size="md" className="hidden lg:block" />
            ) : (
              <Icon icon={PanelLeftClose} size="md" className="hidden lg:block" />
            )}
          </button>
          <Link href="/admin" className={styles.brandLink}>
            <span className={styles.brandText}>
              <strong>Admin</strong>
            </span>
          </Link>
          <nav aria-label="현재 위치" className={styles.breadcrumb}>
            {crumb.section && (
              <span className={styles.breadcrumbTrail}>
                <span>{crumb.section}</span>
                <span className={styles.breadcrumbSep} aria-hidden="true">
                  /
                </span>
              </span>
            )}
            <h1 className={styles.breadcrumbCurrent} aria-current="page">
              {crumb.title}
            </h1>
          </nav>
        </div>

        <div className={styles.navbarEnd}>
          {mounted && (
            <button
              type="button"
              className={styles.themeToggleBtn}
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {resolvedTheme === 'dark' ? (
                <Icon icon={Sun} size="md" />
              ) : (
                <Icon icon={Moon} size="md" />
              )}
            </button>
          )}
          <Link href="/" className={styles.siteLink}>
            블로그 보기
            <Icon icon={ArrowUpRight} />
          </Link>
        </div>
      </div>
    </header>
  );
}
