export interface Memo {
  id: string | number
  [key: string]: unknown
}

export interface MemoCategory {
  id: string | number
  name: string
  [key: string]: unknown
}

export interface MemoSearchRequest {
  [key: string]: unknown
}
