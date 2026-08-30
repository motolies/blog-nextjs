/**
 * 즐겨찾기/플랫폼 링크 트리의 타입 — 공개(FAVORITE)와 관리자 전용(PLATFORM)이 공유한다.
 *
 * 두 루트는 `tb_master_code` 에서 같은 모양(루트 → 그룹 → 링크)에 같은 속성 키(url/icon)를 쓴다.
 * 다른 것은 **공개 화이트리스트에 들어 있는지 하나뿐**이다(application.yml 의 public-roots).
 * 그래서 타입도 UI 도 하나로 공유하고, 루트 코드만 파라미터로 넘긴다.
 */

/** 관리 대상 루트 코드. 화면의 탭 하나가 이 값 하나에 대응한다. */
export type LinkRootKey = 'PLATFORM' | 'FAVORITE';

export const LINK_ROOT_PLATFORM = 'PLATFORM' satisfies LinkRootKey;
export const LINK_ROOT_FAVORITE = 'FAVORITE' satisfies LinkRootKey;

// ---------------------------------------------------------------------------
// 표시용 (홈)
// ---------------------------------------------------------------------------

/**
 * 홈 렌더용 최소 형태. 서버 컴포넌트가 클라이언트 컴포넌트로 넘기는 직렬화 payload 이므로
 * 편집에만 필요한 id/sort/isActive 는 담지 않는다 — 화면에 쓰지 않는 내부 식별자를
 * 브라우저까지 실어보낼 이유가 없다.
 */
export interface LinkItem {
  readonly name: string;
  readonly url: string;
  /** lucide 컴포넌트 이름. 값이 없으면 아이콘을 렌더하지 않는다(빈 자리로 두지 않는다). */
  readonly icon?: string;
}

export interface LinkGroup {
  /**
   * 접힘 상태의 저장 키로 쓴다. id 가 아니라 code 인 이유는 id 가 재시드 때 바뀌기 때문이다.
   * code 는 uk_master_code_parent_code 로 부모 안에서 유일하다.
   */
  readonly code: string;
  readonly name: string;
  readonly icon?: string;
  readonly links: readonly LinkItem[];
}

// ---------------------------------------------------------------------------
// 편집용 (관리 화면)
// ---------------------------------------------------------------------------

/** 편집에 필요한 필드까지 갖춘 링크. `isActive=false` 는 홈에서 숨겨지지만 관리 화면에는 남는다. */
export interface AdminLinkItem {
  /** TSID 문자열(13자). */
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly url: string;
  readonly icon: string;
  readonly sort: number;
  readonly isActive: boolean;
}

export interface AdminLinkGroup {
  /** TSID 문자열(13자). */
  readonly id: string;
  readonly code: string;
  readonly name: string;
  /** FAVORITE 그룹이 이미 쓰고 있어 편집 대상으로 남긴다(폼에서 빼면 유령 데이터가 된다). */
  readonly description: string;
  readonly icon: string;
  readonly sort: number;
  readonly isActive: boolean;
  readonly links: readonly AdminLinkItem[];
}

/** 관리 화면이 다루는 한 루트의 전체 상태. `rootId` 는 그룹 생성 시 parentId 로 쓴다. */
export interface AdminLinkTree {
  readonly rootId: string;
  readonly groups: readonly AdminLinkGroup[];
}

// ---------------------------------------------------------------------------
// 홈 접힘 상태
// ---------------------------------------------------------------------------

/**
 * 홈 플랫폼 섹션의 접힘 상태 (localStorage).
 *
 * **펼친 것이 아니라 접힌 것을 저장한다.** 펼친 목록을 저장하면 나중에 그룹을 추가했을 때
 * 그 그룹이 조용히 접힌 채로 나타난다 — 새 항목의 기본은 언제나 펼침이어야 한다.
 */
export interface PlatformCollapseState {
  /** 섹션 전체가 접혔는지. */
  readonly section: boolean;
  /** 접힌 그룹의 code 목록. 여기 없는 그룹은 펼쳐진 것이다. */
  readonly groups: readonly string[];
}
