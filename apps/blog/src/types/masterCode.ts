// id 는 TSID 문자열(13자)이다. 백엔드가 Long → String PK 로 바뀌었다 —
// TSID 는 2^60 이상이라 JS number 로는 무손실 표현이 안 된다(안전 범위 2^53).
export interface MasterCodeNode {
  id: string;
  code: string;
  name: string;
  sort?: number;
  children?: MasterCodeNode[];
  attributes?: Record<string, string>;
  // 아래 둘은 백엔드 MasterCodeTreeResponse 가 항상 내려주지만 공개 즐겨찾기 화면이 쓰지 않아
  // 그동안 타입에 없었다. 관리 화면(/admin/favorites)이 숨김 토글과 그룹 설명을 다루므로 추가한다.
  // optional 인 것은 기존 호출부를 깨지 않기 위해서다 — 응답에는 실제로 항상 들어 있다.
  description?: string;
  isActive?: boolean;
}

// description/isActive 는 백엔드 MasterCodeCreate·MasterCodeUpdate 가 원래 받는 필드다.
// MasterCodePage 가 파일 안의 자체 타입으로 이미 보내고 있었고, 공용 타입에만 빠져 있었다.
export interface MasterCodeCreateRequest {
  code: string;
  name: string;
  parentId?: string | null;
  description?: string | null;
  sort?: number;
  isActive?: boolean;
  attributes?: Record<string, string>;
}

// 백엔드 MasterCode.update() 는 null/undefined 필드를 무시하므로 부분 수정이 안전하다.
// ⚠️ 단 attributes 는 예외다 — non-null 이면 맵 전체를 갈아끼운다.
//    아이콘만 바꿀 때도 url 을 함께 보내지 않으면 url 이 사라진다.
export interface MasterCodeUpdateRequest {
  name?: string;
  code?: string;
  description?: string | null;
  sort?: number;
  isActive?: boolean;
  attributes?: Record<string, string>;
}

export interface MasterCodeMoveRequest {
  newParentId: string;
}

/**
 * 자식 노드 순서 일괄 변경.
 *
 * **배열 위치가 곧 sort(1..n)** 라 클라이언트는 sort 숫자를 계산하지 않는다. 예전에는 형제마다
 * sort 를 계산해 PUT 을 하나씩 날렸는데, 중간에 실패하면 순서가 반쯤 어긋난 채 남았다.
 */
export interface MasterCodeChildrenOrderRequest {
  orderedIds: string[];
}
