import Header from './Header'
import {useEffect, useState} from "react"
import {useRouter} from "next/router"
import Link from 'next/link'
import {X} from 'lucide-react'
import styles from './AdminLayout.module.css'
import {adminNavigationSections, getAdminRouteMeta, isActiveAdminItem} from './adminNavigation'

export default function AdminLayout({children}) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const meta = getAdminRouteMeta(router.pathname)

  useEffect(() => {
    document.title = `${meta.title} | Blog Admin`
  }, [meta.title])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [router.pathname])

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }

  return (
    <div className={`admin-shell ${styles.layoutWrapper}`}>
      <Header toggleMenu={toggleMenu} meta={meta}/>

      {isMenuOpen ? (
        <button
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
              className={styles.closeButton}
              onClick={() => setIsMenuOpen(false)}
              aria-label="관리자 메뉴 닫기"
            >
              <X className="h-4 w-4"/>
            </button>
          </div>

          <div className={styles.menuInner}>
            {adminNavigationSections.map((section) => (
              <div className={styles.menuSection} key={section.title}>
                <p className={styles.menuSectionTitle}>{section.title}</p>
                <ul className={styles.menuList}>
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = isActiveAdminItem(item, router.pathname)

                    return (
                      <li className={styles.menuItem} key={item.href}>
                        <Link
                          href={item.href}
                          className={`${styles.menuLink} ${isActive ? styles.active : ''}`}
                        >
                          <span className={styles.menuIconWrap}>
                            <Icon className="h-4 w-4"/>
                          </span>
                          <span className={styles.menuLabel}>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.layoutPage}>
          <main className={styles.contentWrapper}>
            <div className={styles.containerFluid}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
