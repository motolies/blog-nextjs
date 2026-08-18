export interface DailyViewCount {
  date: string
  count: number
}

export interface PopularPost {
  id: number
  subject: string
  categoryName: string
  viewCount: number
}

export interface CategoryDistribution {
  categoryName: string
  postCount: number
}

export interface TagDistribution {
  tagName: string
  postCount: number
}

export interface StatsOverview {
  totalPosts: number
  totalViews: number
  todayViews: number
  totalCategories: number
  totalTags: number
  viewTrend: DailyViewCount[]
  popularPosts: PopularPost[]
  categoryDistribution: CategoryDistribution[]
  tagDistribution: TagDistribution[]
}
