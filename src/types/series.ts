export interface SeriesPost {
  postId: number
  subject: string
  seq: number
}

export interface Series {
  id: number
  title: string
  description: string | null
  posts: SeriesPost[]
  created: { at: string }
  updated: { at: string }
}

export interface SeriesSummary {
  id: number
  title: string
  description: string | null
  postCount: number
}
