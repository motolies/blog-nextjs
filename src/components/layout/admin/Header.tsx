import Link from 'next/link'
import {ArrowUpRight, Menu, Sun, Moon} from 'lucide-react'
import {useTheme} from 'next-themes'
import {useEffect, useState} from 'react'
import styles from './Header.module.css'

interface AdminRouteMeta {
    title: string
    icon?: React.ComponentType<{ className?: string }>
}

interface HeaderProps {
    toggleMenu: () => void
    meta: AdminRouteMeta
}

export default function Header({toggleMenu, meta}: HeaderProps) {
    const {resolvedTheme, setTheme} = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

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
                    {mounted && (
                        <button
                            className={styles.themeToggleBtn}
                            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                            aria-label={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
                        >
                            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                        </button>
                    )}
                    <Link href="/" className={styles.siteLink}>
                        블로그 보기
                        <ArrowUpRight className="h-4 w-4"/>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
