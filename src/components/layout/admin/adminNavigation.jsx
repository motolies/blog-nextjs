import {
  Activity,
  BookOpenText,
  Flame,
  FolderTree,
  LayoutDashboard,
  NotebookPen,
  PanelsTopLeft,
  PencilLine,
  ScrollText,
  Search,
  Tags,
  Workflow,
} from 'lucide-react'

export const adminNavigationSections = [
  {
    title: 'Overview',
    items: [
      {
        href: '/admin',
        label: '대시보드',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Content',
    items: [
      {
        href: '/admin/write',
        label: '글 작성',
        icon: PencilLine,
        match: (pathname) => pathname === '/admin/write' || pathname.startsWith('/admin/write/'),
      },
      {
        href: '/admin/categories',
        label: '카테고리',
        icon: FolderTree,
      },
      {
        href: '/admin/tags',
        label: '태그',
        icon: Tags,
      },
      {
        href: '/admin/master-code',
        label: '마스터코드',
        icon: PanelsTopLeft,
      },
      {
        href: '/admin/memo',
        label: '메모',
        icon: NotebookPen,
      },
    ],
  },
  {
    title: 'Hot Deal',
    items: [
      {
        href: '/admin/hot-deal-sites',
        label: '핫딜 사이트',
        icon: Flame,
      },
      {
        href: '/admin/hot-deal-items',
        label: '핫딜 검색',
        icon: Search,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        href: '/admin/system-log',
        label: '시스템 로그',
        icon: ScrollText,
      },
      {
        href: '/admin/api-log',
        label: 'API 로그',
        icon: Activity,
      },
      {
        href: '/admin/sprint',
        label: '스프린트',
        icon: Workflow,
      },
    ],
  },
]

export const adminRouteMeta = {
  '/admin': {
    title: '관리자 대시보드',
    icon: LayoutDashboard,
  },
  '/admin/write': {
    title: '글 작성',
    icon: PencilLine,
  },
  '/admin/write/[id]': {
    title: '글 수정',
    icon: PencilLine,
  },
  '/admin/categories': {
    title: '카테고리 관리',
    icon: FolderTree,
  },
  '/admin/tags': {
    title: '태그 관리',
    icon: Tags,
  },
  '/admin/master-code': {
    title: '마스터코드 관리',
    icon: PanelsTopLeft,
  },
  '/admin/memo': {
    title: '메모 관리',
    icon: NotebookPen,
  },
  '/admin/hot-deal-sites': {
    title: '핫딜 사이트 관리',
    icon: Flame,
  },
  '/admin/hot-deal-items': {
    title: '핫딜 아이템 검색',
    icon: Search,
  },
  '/admin/system-log': {
    title: '시스템 로그',
    icon: ScrollText,
  },
  '/admin/api-log': {
    title: 'API 로그',
    icon: Activity,
  },
  '/admin/sprint': {
    title: '스프린트 관리',
    icon: Workflow,
  },
}

export function getAdminRouteMeta(pathname) {
  return adminRouteMeta[pathname] || {
    title: '관리자',
    icon: LayoutDashboard,
  }
}

export function isActiveAdminItem(item, pathname) {
  if (typeof item.match === 'function') {
    return item.match(pathname)
  }

  return pathname === item.href
}

export const adminQuickLinks = [
  {
    href: '/admin/write',
    label: '새 글 작성',
    description: '본문과 메타데이터를 함께 편집',
    icon: PencilLine,
  },
  {
    href: '/admin/categories',
    label: '카테고리 정리',
    description: '콘텐츠 구조와 분류 체계 조정',
    icon: FolderTree,
  },
  {
    href: '/admin/memo',
    label: '메모 확인',
    description: '운영 메모와 카테고리 점검',
    icon: NotebookPen,
  },
  {
    href: '/admin/system-log',
    label: '시스템 모니터링',
    description: '오류와 이벤트 로그 추적',
    icon: Activity,
  },
  {
    href: '/admin/sprint',
    label: '스프린트 분석',
    description: '업무 진행과 작업 로그 검토',
    icon: Workflow,
  },
  {
    href: '/admin/master-code',
    label: '마스터코드 운영',
    description: '계층 코드와 캐시 상태 점검',
    icon: BookOpenText,
  },
]
