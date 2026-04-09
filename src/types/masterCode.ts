export interface MasterCodeNode {
  id: number
  code: string
  name: string
  sort?: number
  children?: MasterCodeNode[]
  attributes?: Record<string, string>
}

export interface MasterCodeCreateRequest {
  code: string
  name: string
  parentId?: number
  sort?: number
  attributes?: Record<string, string>
}

export interface MasterCodeUpdateRequest {
  name?: string
  code?: string
  sort?: number
  attributes?: Record<string, string>
}

export interface MasterCodeMoveRequest {
  newParentId: number
}

export interface MasterCodeReorderRequest {
  sort: number
}
