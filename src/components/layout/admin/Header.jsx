import Link from 'next/link'
import {ArrowUpRight, Menu} from 'lucide-react'
import styles from './Header.module.css'

export default function Header({toggleMenu, meta}) {
    return (
        <nav className={styles.layoutNavbar}>
            <div className={styles.navbarContent}>
                <div className={styles.navbarStart}>
                    <button className={styles.menuToggleBtn} onClick={toggleMenu} aria-label="관리자 메뉴 열기">
                        <Menu className="h-5 w-5"/>
                    </button>
                    <Link href="/admin" className={styles.brandLink}>
                        <span className={styles.brandMark}>B</span>
                        <span className={styles.brandText}>
                            <strong>Blog Admin</strong>
                            <span>{meta?.title || '관리자'}</span>
                        </span>
                    </Link>
                </div>

                <div className={styles.navbarEnd}>
                    <Link href="/" className={styles.siteLink}>
                        블로그 보기
                        <ArrowUpRight className="h-4 w-4"/>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
