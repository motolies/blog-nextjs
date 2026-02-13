import Footer from './Footer'
import Header from './Header'
import MenuHeader from './menu/MenuHeader'
import MenuGroup from './menu/MenuGroup'
import MenuItem from './menu/MenuItem'
import {createTheme, ThemeProvider} from "@mui/material"
import {useEffect, useState} from "react"
import {useRouter} from "next/router"
import CategoryIcon from '@mui/icons-material/Category'
import LabelIcon from '@mui/icons-material/Label'
import EditIcon from '@mui/icons-material/Edit'
import CodeIcon from '@mui/icons-material/Code'
import BugReportIcon from '@mui/icons-material/BugReport'
import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import styles from './AdminLayout.module.css'

const theme = createTheme({
  components: {
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px !important',
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
    } else if (path === '/admin/memo') {
      newExpandedMenus.memo = true
    } else if (path === '/admin/sprint') {
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
      <ThemeProvider theme={theme}>
        <div className={styles.layoutWrapper}>
          <div className={styles.layoutContainer}>
            {/* Navigation Bar */}
            <Header toggleMenu={toggleMenu}/>

            {/* Sidebar */}
            <aside className={`${styles.layoutMenu} ${isMenuCollapsed
                ? styles.collapsed : ''}`}>
              <div className={styles.menuInner}>
                <ul className={styles.menuList}>
                  {/* 관리자 섹션 */}
                  <MenuHeader title="관리자"/>

                  <MenuGroup
                      title="공통코드"
                      icon={<CodeIcon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.commonCode}
                      onToggle={() => toggleSubMenu('commonCode')}
                  >
                    <MenuItem
                        href="/admin/common-code"
                        label="공통코드 관리"
                        isActive={router.pathname === '/admin/common-code'}
                        isSubItem
                    />
                  </MenuGroup>

                  <MenuGroup
                      title="시스템 로그"
                      icon={<BugReportIcon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.systemLog}
                      onToggle={() => toggleSubMenu('systemLog')}
                  >
                    <MenuItem
                        href="/admin/system-log"
                        label="System"
                        isActive={router.pathname === '/admin/system-log'}
                        isSubItem
                    />
                    <MenuItem
                        href="/admin/api-log"
                        label="Api"
                        isActive={router.pathname === '/admin/api-log'}
                        isSubItem
                    />
                  </MenuGroup>

                  <MenuGroup
                      title="메모"
                      icon={<StickyNote2Icon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.memo}
                      onToggle={() => toggleSubMenu('memo')}
                  >
                    <MenuItem
                        href="/admin/memo"
                        label="메모 관리"
                        isActive={router.pathname === '/admin/memo'}
                        isSubItem
                    />
                  </MenuGroup>

                  {/* 포스트 관리 섹션 */}
                  <MenuHeader title="포스트 관리"/>

                  <MenuGroup
                      title="포스트"
                      icon={<EditIcon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.posts}
                      onToggle={() => toggleSubMenu('posts')}
                  >
                    <MenuItem
                        href="/admin/write"
                        label="글 작성"
                        isActive={router.pathname === '/admin/write'
                            || router.pathname.startsWith('/admin/write/')}
                        isSubItem
                    />
                  </MenuGroup>

                  <MenuGroup
                      title="카테고리"
                      icon={<CategoryIcon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.category}
                      onToggle={() => toggleSubMenu('category')}
                  >
                    <MenuItem
                        href="/admin/categories"
                        label="카테고리 관리"
                        isActive={router.pathname === '/admin/categories'}
                        isSubItem
                    />
                  </MenuGroup>

                  <MenuGroup
                      title="태그"
                      icon={<LabelIcon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.tags}
                      onToggle={() => toggleSubMenu('tags')}
                  >
                    <MenuItem
                        href="/admin/tags"
                        label="태그 관리"
                        isActive={router.pathname === '/admin/tags'}
                        isSubItem
                    />
                  </MenuGroup>

                  {/* 스프린트 관리 섹션 */}
                  <MenuHeader title="업무 관리"/>

                  <MenuGroup
                      title="스프린트"
                      icon={<CodeIcon className={styles.menuIcon}/>}
                      isExpanded={expandedMenus.sprint}
                      onToggle={() => toggleSubMenu('sprint')}
                  >
                    <MenuItem
                        href="/admin/sprint"
                        label="스프린트 관리"
                        isActive={router.pathname === '/admin/sprint'}
                        isSubItem
                    />
                  </MenuGroup>

                </ul>
              </div>
            </aside>

            {/* Main Content */}
            <div className={`${styles.layoutPage} ${isMenuCollapsed
                ? styles.menuCollapsed : ''}`}>
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
  )
}
