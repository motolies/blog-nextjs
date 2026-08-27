import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BellRing,
  BookOpen,
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
} from 'lucide-react';

export interface AdminNavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

export interface AdminNavigationSection {
  title: string;
  items: AdminNavigationItem[];
}

export interface AdminRouteMeta {
  title: string;
  icon: LucideIcon;
}

export const adminNavigationSections: AdminNavigationSection[] = [
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
        match: (pathname: string) =>
          pathname === '/admin/write' || pathname.startsWith('/admin/write/'),
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
        href: '/admin/series',
        label: '시리즈',
        icon: BookOpen,
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
      {
        href: '/admin/hot-deal-keywords',
        label: '알림 키워드',
        icon: BellRing,
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
    ],
  },
];

export const adminRouteMeta: Record<string, AdminRouteMeta> = {
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
  '/admin/series': {
    title: '시리즈 관리',
    icon: BookOpen,
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
  '/admin/hot-deal-keywords': {
    title: '핫딜 알림 키워드',
    icon: BellRing,
  },
  '/admin/system-log': {
    title: '시스템 로그',
    icon: ScrollText,
  },
  '/admin/api-log': {
    title: 'API 로그',
    icon: Activity,
  },
};

// usePathname() 은 '/admin/write/123' 같은 실제 경로를 준다 — adminRouteMeta 의 라우트 패턴 키로 정규화
function toRouteKey(pathname: string): string {
  return pathname.startsWith('/admin/write/') ? '/admin/write/[id]' : pathname;
}

export function getAdminRouteMeta(pathname: string): AdminRouteMeta {
  return (
    adminRouteMeta[toRouteKey(pathname)] || {
      title: '관리자',
      icon: LayoutDashboard,
    }
  );
}

export function isActiveAdminItem(item: AdminNavigationItem, pathname: string): boolean {
  if (typeof item.match === 'function') {
    return item.match(pathname);
  }

  return pathname === item.href;
}

export interface AdminBreadcrumb {
  section?: string;
  title: string;
}

/**
 * 경로에서 헤더 브레드크럼(섹션 / 페이지)을 역조회한다.
 * 섹션은 내비 항목의 match/href 매칭으로 찾고, 페이지 타이틀은 adminRouteMeta 를 정본으로 쓴다
 * (동적 라우트 '글 수정' 등 내비 라벨보다 구체적인 타이틀을 유지하기 위함).
 */
export function getAdminBreadcrumb(pathname: string): AdminBreadcrumb {
  const title = getAdminRouteMeta(pathname).title;
  for (const section of adminNavigationSections) {
    for (const item of section.items) {
      if (isActiveAdminItem(item, pathname)) {
        return { section: section.title, title };
      }
    }
  }
  return { title };
}

export interface AdminQuickLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const adminQuickLinks: AdminQuickLink[] = [
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
    href: '/admin/master-code',
    label: '마스터코드 운영',
    description: '계층 코드와 캐시 상태 점검',
    icon: BookOpenText,
  },
];
