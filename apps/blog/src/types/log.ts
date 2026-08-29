import type { LogStatusFilter } from '@/lib/logStatus';
import type { OrderBy } from './common';

export interface SystemLogSearchRequest {
  page: number;
  pageSize: number;
  orderBy?: OrderBy[];
  traceId?: string;
  spanId?: string;
  requestUri?: string;
  controllerName?: string;
  methodName?: string;
  httpMethodType?: string;
  remoteAddr?: string;
  /** 요청 값은 enum name 이다 — DB 원문 'SUCC' 가 아니다(lib/logStatus.ts 참조). */
  status?: LogStatusFilter;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface ApiLogSearchRequest {
  page: number;
  pageSize: number;
  orderBy?: OrderBy[];
  traceId?: string;
  spanId?: string;
  requestUri?: string;
  httpMethodType?: string;
  responseStatus?: string;
  /** 성공/실패 파생 필터. responseStatus(HTTP 코드 완전일치)와는 다른 축이다. */
  status?: LogStatusFilter;
  createdAtFrom?: string;
  createdAtTo?: string;
}
