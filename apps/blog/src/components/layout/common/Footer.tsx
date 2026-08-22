import Link from 'next/link';
import styles from './Footer.module.css';
import { publicNavLinks } from './publicNavigation';

/** 공개 영역 푸터 — 내비 링크 + 저작권 한 줄의 최소 구조 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="border-t border-[color:var(--public-header-border)]">
        <div className="public-container flex flex-col gap-3 pb-[calc(2rem+var(--safe-bottom))] pt-6 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
          <nav aria-label="푸터 탐색">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {publicNavLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="public-muted-text text-xs font-semibold uppercase tracking-[0.14em] transition hover:text-dl-primary-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="public-label-text text-[11px] uppercase tracking-[0.18em]">
            © {new Date().getFullYear()} motolies
          </p>
        </div>
      </div>
    </footer>
  );
}
