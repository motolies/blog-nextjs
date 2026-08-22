export interface PublicNavLink {
  href: string;
  label: string;
}

/** 공개 영역 내비게이션 정의 — 헤더·모바일 드로어·푸터가 공유한다.
 *  홈은 로고가, 검색(/search)은 헤더 검색창이 진입점이라 메뉴에 두지 않는다(중복). */
export const publicNavLinks: PublicNavLink[] = [{ href: '/util', label: 'Util' }];

/** 현재 경로의 활성 링크 판정 — '/' 는 정확 일치, 그 외는 프리픽스 매치 */
export function isActiveNavLink(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
