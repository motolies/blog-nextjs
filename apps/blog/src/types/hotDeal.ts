export interface HotDealSite {
  id: string | number;
  [key: string]: unknown;
}

export interface HotDealItemSearchRequest {
  [key: string]: unknown;
}

export interface HotDealKeyword {
  id: number;
  keyword: string;
  /** 실제 매칭에 사용되는 정규화 값 (소문자 변환 + 공백 제거) */
  normalizedKeyword: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HotDealKeywordPayload {
  keyword: string;
  enabled: boolean;
  [key: string]: unknown;
}
