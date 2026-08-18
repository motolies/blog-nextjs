export interface Tag {
  id: string
  name: string
}

export interface TagMergeRequest {
  sourceTagId: string
  targetTagId: string
}
