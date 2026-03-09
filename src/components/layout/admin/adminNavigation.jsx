import {
  Activity,
  BookOpenText,
  FolderTree,
  LayoutDashboard,
  NotebookPen,
  PanelsTopLeft,
  PencilLine,
  ScrollText,
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
    eyebrow: 'Control Center',
    title: '관리자 대시보드',
    description: '콘텐츠, 운영 로그, 업무 화면으로 빠르게 이동할 수 있는 관리 허브입니다.',
  },
  '/admin/write': {
    eyebrow: 'Editor',
    title: '글 작성',
    description: '본문 편집과 메타 설정을 한 화면에서 처리하는 집중형 에디터입니다.',
  },
  '/admin/write/[id]': {
    eyebrow: 'Editor',
    title: '글 수정',
    description: '기존 게시글을 편집하고 파일, 태그, 공개 상태를 함께 관리합니다.',
  },
  '/admin/categories': {
    eyebrow: 'Taxonomy',
    title: '카테고리 관리',
    description: '트리 구조를 탐색하며 카테고리 생성, 수정, 삭제를 빠르게 처리합니다.',
  },
  '/admin/tags': {
    eyebrow: 'Taxonomy',
    title: '태그 관리',
    description: '태그 운영 영역을 같은 관리 톤으로 정리한 작업 공간입니다.',
  },
  '/admin/master-code': {
    eyebrow: 'Structure',
    title: '마스터코드 관리',
    description: '계층형 마스터코드를 트리 구조로 탐색하고 편집할 수 있는 운영 화면입니다.',
  },
  '/admin/memo': {
    eyebrow: 'Notes',
    title: '메모 관리',
    description: '메모 목록과 카테고리 관리를 한 작업 공간에서 처리합니다.',
  },
  '/admin/system-log': {
    eyebrow: 'Observability',
    title: '시스템 로그',
    description: '시스템 이벤트와 오류 추적 내역을 빠르게 검색하고 조회합니다.',
  },
  '/admin/api-log': {
    eyebrow: 'Observability',
    title: 'API 로그',
    description: '요청과 응답 로그를 필터링하며 상세 내용을 확인합니다.',
  },
  '/admin/sprint': {
    eyebrow: 'Delivery',
    title: '스프린트 관리',
    description: '스프린트 지표, 이슈, 작업 로그를 넓은 작업 공간에서 분석합니다.',
  },
}

export function getAdminRouteMeta(pathname) {
  return adminRouteMeta[pathname] || {
    eyebrow: 'Admin',
    title: '관리자',
    description: '관리자 작업 영역입니다.',
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
