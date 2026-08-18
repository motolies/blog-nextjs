export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  pageSize: number
}

export interface OrderBy {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface PageRequest {
  page: number
  pageSize: number
  orderBy?: OrderBy[]
}
