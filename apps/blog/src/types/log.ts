import type { OrderBy } from './common'

export interface SystemLogSearchRequest {
  page: number
  pageSize: number
  orderBy?: OrderBy[]
  traceId?: string
  spanId?: string
  requestUri?: string
  controllerName?: string
  methodName?: string
  httpMethodType?: string
  remoteAddr?: string
  status?: string
  createdAtFrom?: string
  createdAtTo?: string
}

export interface ApiLogSearchRequest {
  page: number
  pageSize: number
  orderBy?: OrderBy[]
  traceId?: string
  spanId?: string
  requestUri?: string
  httpMethodType?: string
  responseStatus?: string
  createdAtFrom?: string
  createdAtTo?: string
}
