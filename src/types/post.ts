import type { Category } from './category'
import type { Tag } from './tag'
import type { FileItem } from './file'

export type PostStatus = 'TEMP' | 'PUBLISH'

export interface Post {
  id: string | null
  subject: string
  body: string
  category: Pick<Category, 'id'>
  categoryId: string
  public: boolean
  status: PostStatus
  tags: Tag[]
  files: FileItem[]
  hasDraft?: boolean
  draftSubject?: string | null
  draftBody?: string | null
}

export interface SearchCondition {
  keywords: string[]
  logic: 'AND' | 'OR'
}

export type SearchType = 'TITLE' | 'BODY' | 'TAG'

export interface SearchObject {
  searchType: SearchType
  searchCondition: SearchCondition
  categories: string[]
  tags: string[]
  page: number
  pageSize: number
}

export interface SearchAllParam {
  [key: string]: unknown
}

export interface PostSearchResult {
  content: Post[]
  totalElements: number
  totalPages: number
  page: number
  pageSize: number
}

export interface PrevNextPost {
  prev: Post | null
  next: Post | null
}
