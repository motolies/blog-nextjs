export interface FavoriteLink {
  name: string
  url: string
}

export interface FavoriteCategory {
  name: string
  links: FavoriteLink[]
}
