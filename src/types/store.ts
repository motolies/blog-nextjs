import type { Post, PostSearchResult } from './post'
import type { Category, CategoryTreeNode } from './category'
import type { Tag } from './tag'
import type { User } from './user'

export interface PostState {
  isLoading: boolean
  searchedPost: PostSearchResult | Record<string, never>
  modifyPost: Post
  error: string
}

export interface CategoryState {
  isFetching: boolean
  isLoading: boolean
  categoryFlat: Category[]
  categoryTree: CategoryTreeNode | CategoryTreeNode[] | Record<string, never>
}

export interface TagState {
  isFetching: boolean
  isLoading: boolean
  tags: Tag[]
}

export interface UserState {
  isAuthenticated: boolean | null
  isLoading: boolean
  user: User | Record<string, never>
  error: string
}

export interface CommonState {
  isLoading: boolean
}

export interface RootState {
  user: UserState
  category: CategoryState
  post: PostState
  tag: TagState
  common: CommonState
}
