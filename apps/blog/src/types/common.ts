export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

// direction 은 hvy-common Direction enum 의 **이름**(ASCENDING/DESCENDING)이다 — 코드값(ASC/DESC)이 아니다.
export interface OrderBy {
  column: string;
  direction: 'ASCENDING' | 'DESCENDING';
}

export interface PageRequest {
  page: number;
  pageSize: number;
  orderBy?: OrderBy[];
}
