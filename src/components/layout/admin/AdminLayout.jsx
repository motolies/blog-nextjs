import Footer from '../admin/Footer'
import {createTheme, ThemeProvider} from "@mui/material"
import {useEffect, useState} from "react"
import {useRouter} from "next/router"
import Link from "next/link"
import CategoryIcon from '@mui/icons-material/Category'
import MenuIcon from '@mui/icons-material/Menu'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import LabelIcon from '@mui/icons-material/Label'
import EditIcon from '@mui/icons-material/Edit'
import CodeIcon from '@mui/icons-material/Code'
import BugReportIcon from '@mui/icons-material/BugReport'
import styles from './AdminLayout.module.css'

const theme = createTheme({
  components: {
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px !important', // basicTheme.spacing(2.5)도 가능
        },
      },
    },
  },
  palette: {
    primary: {
      main: '#1565c0'
    },
    secondary: {
      main: '#7b1fa2',
    },
    error: {
      main: '#c62828',
    },
    warning: {
      main: '#e65100',
    },
    info: {
      main: '#01579b',
    },
    success: {
      main: '#1b5e20',
    },
  },
})

export default function AdminLayout({children}) {
  const router = useRouter()
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})

  useEffect(() => {
    document.title = "Admin"
  }, [])

  // 현재 경로에 따라 서브메뉴 자동 열기
  useEffect(() => {
    const path = router.pathname
    const newExpandedMenus = {}

    if (path === '/admin/write' || path.startsWith('/admin/write/')) {
      newExpandedMenus.posts = true
    } else if (path === '/admin/categories') {
      newExpandedMenus.category = true
    } else if (path === '/admin/tags') {
      newExpandedMenus.tags = true
    } else if (path === '/admin/common-code') {
      newExpandedMenus.commonCode = true
    } else if (path === '/admin/system-log' || path === '/admin/api-log') {
      newExpandedMenus.systemLog = true
    } else if (path === '/admin/sprint' ) {
      newExpandedMenus.sprint = true
    }

    setExpandedMenus(newExpandedMenus)
  }, [router.pathname])

  const toggleMenu = () => {
    setIsMenuCollapsed(!isMenuCollapsed)
  }

  const toggleSubMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  return (
      <>
        <ThemeProvider theme={theme}>
          <div className={styles.layoutWrapper}>
            <div className={styles.layoutContainer}>
              {/* Navigation Bar */}
              <nav className={styles.layoutNavbar}>
                <div className={styles.navbarContent}>
                  <button className={styles.menuToggleBtn} onClick={toggleMenu}>
                    <MenuIcon/>
                  </button>
                  <Link href="/admin" className={styles.brandLink}>
                    Admin
                  </Link>
                </div>
              </nav>

              {/* Sidebar */}
              <aside className={`${styles.layoutMenu} ${isMenuCollapsed ? styles.collapsed : ''}`}>


                <div className={styles.menuInner}>
                  <ul className={styles.menuList}>
                    {/* 관리자 섹션 */}
                    <li className={styles.menuHeader}>
                      <span className={styles.menuHeaderText}>관리자</span>
                    </li>
                    <li className={`${styles.menuItem} ${expandedMenus.commonCode ? 'open' : ''}`}>
                      <button
                          className={`${styles.menuLink} menu-toggle`}
                          onClick={() => toggleSubMenu('commonCode')}
                      >
                        <CodeIcon className={styles.menuIcon}/>
                        <span className={styles.menuText}>공통코드</span>
                        {expandedMenus.commonCode ?
                            <ExpandLessIcon className={styles.menuArrow}/> :
                            <ExpandMoreIcon className={styles.menuArrow}/>
                        }
                      </button>
                      {expandedMenus.commonCode && (
                          <ul className={styles.menuSub}>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/common-code' ? styles.active : ''}`}>
                              <Link href="/admin/common-code" className={styles.menuLink}>
                                <span className={styles.menuText}>공통코드 관리</span>
                              </Link>
                            </li>
                          </ul>
                      )}
                    </li>

                    <li className={`${styles.menuItem} ${expandedMenus.systemLog ? 'open' : ''}`}>
                      <button
                          className={`${styles.menuLink} menu-toggle`}
                          onClick={() => toggleSubMenu('systemLog')}
                      >
                        <BugReportIcon className={styles.menuIcon}/>
                        <span className={styles.menuText}>시스템 로그</span>
                        {expandedMenus.systemLog ?
                            <ExpandLessIcon className={styles.menuArrow}/> :
                            <ExpandMoreIcon className={styles.menuArrow}/>
                        }
                      </button>
                      {expandedMenus.systemLog && (
                          <ul className={styles.menuSub}>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/system-log' ? styles.active : ''}`}>
                              <Link href="/admin/system-log" className={styles.menuLink}>
                                <span className={styles.menuText}>System</span>
                              </Link>
                            </li>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/api-log' ? styles.active : ''}`}>
                              <Link href="/admin/api-log" className={styles.menuLink}>
                                <span className={styles.menuText}>Api</span>
                              </Link>
                            </li>
                          </ul>
                      )}
                    </li>

                    {/* 포스트 관리 섹션 */}
                    <li className={styles.menuHeader}>
                      <span className={styles.menuHeaderText}>포스트 관리</span>
                    </li>
                    <li className={`${styles.menuItem} ${expandedMenus.posts ? 'open' : ''}`}>
                      <button
                          className={`${styles.menuLink} menu-toggle`}
                          onClick={() => toggleSubMenu('posts')}
                      >
                        <EditIcon className={styles.menuIcon}/>
                        <span className={styles.menuText}>포스트</span>
                        {expandedMenus.posts ?
                            <ExpandLessIcon className={styles.menuArrow}/> :
                            <ExpandMoreIcon className={styles.menuArrow}/>
                        }
                      </button>
                      {expandedMenus.posts && (
                          <ul className={styles.menuSub}>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/write' || router.pathname.startsWith('/admin/write/') ? styles.active : ''}`}>
                              <Link href="/admin/write" className={styles.menuLink}>
                                <span className={styles.menuText}>글 작성</span>
                              </Link>
                            </li>
                          </ul>
                      )}
                    </li>

                    <li className={`${styles.menuItem} ${expandedMenus.category ? 'open' : ''}`}>
                      <button
                          className={`${styles.menuLink} menu-toggle`}
                          onClick={() => toggleSubMenu('category')}
                      >
                        <CategoryIcon className={styles.menuIcon}/>
                        <span className={styles.menuText}>카테고리</span>
                        {expandedMenus.category ?
                            <ExpandLessIcon className={styles.menuArrow}/> :
                            <ExpandMoreIcon className={styles.menuArrow}/>
                        }
                      </button>
                      {expandedMenus.category && (
                          <ul className={styles.menuSub}>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/categories' ? styles.active : ''}`}>
                              <Link href="/admin/categories" className={styles.menuLink}>
                                <span className={styles.menuText}>카테고리 관리</span>
                              </Link>
                            </li>
                          </ul>
                      )}
                    </li>

                    <li className={`${styles.menuItem} ${expandedMenus.tags ? 'open' : ''}`}>
                      <button
                          className={`${styles.menuLink} menu-toggle`}
                          onClick={() => toggleSubMenu('tags')}
                      >
                        <LabelIcon className={styles.menuIcon}/>
                        <span className={styles.menuText}>태그</span>
                        {expandedMenus.tags ?
                            <ExpandLessIcon className={styles.menuArrow}/> :
                            <ExpandMoreIcon className={styles.menuArrow}/>
                        }
                      </button>
                      {expandedMenus.tags && (
                          <ul className={styles.menuSub}>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/tags' ? styles.active : ''}`}>
                              <Link href="/admin/tags" className={styles.menuLink}>
                                <span className={styles.menuText}>태그 관리</span>
                              </Link>
                            </li>
                          </ul>
                      )}
                    </li>

                    {/* 스프린트 관리 섹션 */}
                    <li className={styles.menuHeader}>
                      <span className={styles.menuHeaderText}>업무 관리</span>
                    </li>
                    <li className={`${styles.menuItem} ${expandedMenus.sprint ? 'open' : ''}`}>
                      <button
                          className={`${styles.menuLink} menu-toggle`}
                          onClick={() => toggleSubMenu('sprint')}
                      >
                        <CodeIcon className={styles.menuIcon}/>
                        <span className={styles.menuText}>스프린트</span>
                        {expandedMenus.sprint ?
                            <ExpandLessIcon className={styles.menuArrow}/> :
                            <ExpandMoreIcon className={styles.menuArrow}/>
                        }
                      </button>
                      {expandedMenus.sprint && (
                          <ul className={styles.menuSub}>
                            <li className={`${styles.menuItem} ${router.pathname === '/admin/sprint' ? styles.active : ''}`}>
                              <Link href="/admin/sprint" className={styles.menuLink}>
                                <span className={styles.menuText}>스프린트 관리</span>
                              </Link>
                            </li>
                          </ul>
                      )}
                    </li>

                  </ul>
                </div>
              </aside>

              {/* Main Content */}
              <div className={`${styles.layoutPage} ${isMenuCollapsed ? styles.menuCollapsed : ''}`}>
                <div className={styles.contentWrapper}>
                  <div className={styles.containerFluid}>
                    {children}
                  </div>
                </div>
                <Footer/>
              </div>
            </div>
          </div>

        </ThemeProvider>
      </>
  )
}
