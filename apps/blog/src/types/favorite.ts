export interface FavoriteLink {
  name: string;
  url: string;
  /** lucide 컴포넌트 이름. 관리 화면에서 채우기 전까지는 비어 있다 — 없으면 아이콘을 그리지 않는다. */
  icon?: string;
}

export interface FavoriteCategory {
  name: string;
  links: FavoriteLink[];
}
