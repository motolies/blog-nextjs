/**
 * 즐겨찾기/플랫폼 링크 트리의 순수 계층 — 마스터코드 트리 ↔ UI 형태 변환, 접힘 상태,
 * 코드 생성, 정렬 재계산. React·lucide 무의존이라 node 환경 vitest 로 단위 테스트가 된다
 * (`treeSearch.ts`·`gridSearch.ts` 와 같은 규약).
 */

import type {
  AdminLinkGroup,
  AdminLinkItem,
  AdminLinkTree,
  LinkGroup,
  LinkItem,
  PlatformCollapseState,
} from '@/types/linkTree';
import type { MasterCodeNode } from '@/types/masterCode';

/** 접힘 상태의 기본값 — 전부 펼침. SSR 첫 렌더가 반드시 이 값이어야 hydration 이 어긋나지 않는다. */
export const DEFAULT_COLLAPSE_STATE: PlatformCollapseState = { section: false, groups: [] };

// ---------------------------------------------------------------------------
// 트리 → UI 변환
// ---------------------------------------------------------------------------

/**
 * 백엔드 서브트리 응답(`[루트]`)에서 홈 표시용 그룹 목록을 뽑는다.
 *
 * 3-depth(루트 → 그룹 → 링크)를 UI 의 2-depth 로 접는다. 응답은 항상 루트 하나짜리 배열이고,
 * 루트 자신은 화면에 나오지 않는다(그룹 카드가 최상위다).
 * URL 이 없는 링크는 **버린다** — 홈은 클릭 가능한 링크만 보여주면 되고, '#' 로 남기면
 * 눌러도 아무 일이 없는 죽은 카드가 된다. 관리 화면에서는 그대로 보이므로 고칠 수 있다.
 */
export function toLinkGroups(treeData: readonly MasterCodeNode[] | null | undefined): LinkGroup[] {
  // ⚠️ Array.isArray 로 좁히지 않는다 — 그 타입 가드는 `x is any[]` 라서 readonly 배열 유니온에
  //    쓰면 결과가 any[] 가 되어 타입이 통째로 날아간다(.map 이 untyped 호출이 된다).
  const root = treeData?.[0];
  if (!root?.children?.length) return [];

  return root.children.map((group) => ({
    code: group.code,
    name: group.name,
    icon: group.attributes?.icon || undefined,
    links: (group.children ?? []).reduce<LinkItem[]>((acc, site) => {
      const url = site.attributes?.url;
      if (url) acc.push({ name: site.name, url, icon: site.attributes?.icon || undefined });
      return acc;
    }, []),
  }));
}

/**
 * 같은 응답에서 관리 화면용 형태를 뽑는다. 표시용과 달리 URL 이 없는 링크도 남긴다 —
 * 관리 화면은 "URL 이 비어 있다"는 사실 자체를 보여주고 고치게 하는 곳이다.
 *
 * ⚠️ `MasterCodeTreeResponse` 에는 parentId 가 없다(children 중첩만 온다). 깊이가 2로 고정이라
 *    부모 id 는 이 변환에서 바깥 루프 변수로 자연히 알 수 있고, 그래서 따로 담지 않는다.
 */
export function toAdminLinkTree(
  treeData: readonly MasterCodeNode[] | null | undefined,
): AdminLinkTree | null {
  const root = treeData?.[0];
  if (!root) return null;

  const groups: AdminLinkGroup[] = (root.children ?? []).map((group) => ({
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description ?? '',
    icon: group.attributes?.icon ?? '',
    sort: group.sort ?? 0,
    isActive: group.isActive ?? true,
    links: (group.children ?? []).map(
      (site): AdminLinkItem => ({
        id: site.id,
        code: site.code,
        name: site.name,
        url: site.attributes?.url ?? '',
        icon: site.attributes?.icon ?? '',
        sort: site.sort ?? 0,
        isActive: site.isActive ?? true,
      }),
    ),
  }));

  return { rootId: root.id, groups };
}

// ---------------------------------------------------------------------------
// 접힘 상태 직렬화
// ---------------------------------------------------------------------------

/**
 * localStorage 문자열을 접힘 상태로 파싱한다. **어떤 입력이 와도 던지지 않는다** —
 * 저장된 값은 이전 버전이 남긴 것일 수도, 사용자가 devtools 로 건드린 것일 수도 있다.
 * 형태가 조금이라도 어긋나면 통째로 기본값(전부 펼침)으로 돌아간다.
 */
export function parseCollapseState(raw: string | null | undefined): PlatformCollapseState {
  if (!raw) return DEFAULT_COLLAPSE_STATE;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_COLLAPSE_STATE;
  }

  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_COLLAPSE_STATE;

  const { section, groups } = parsed as { section?: unknown; groups?: unknown };
  return {
    section: section === true,
    // 문자열이 아닌 원소는 걸러낸다 — 배열 전체를 버리면 멀쩡한 나머지 항목까지 잃는다.
    groups: Array.isArray(groups) ? groups.filter((g): g is string => typeof g === 'string') : [],
  };
}

export function serializeCollapseState(state: PlatformCollapseState): string {
  return JSON.stringify({ section: state.section, groups: state.groups });
}

/** 그룹 하나의 접힘을 뒤집는다. */
export function toggleGroupCollapse(
  state: PlatformCollapseState,
  groupCode: string,
): PlatformCollapseState {
  const collapsed = state.groups.includes(groupCode);
  return {
    section: state.section,
    groups: collapsed
      ? state.groups.filter((code) => code !== groupCode)
      : [...state.groups, groupCode],
  };
}

// ---------------------------------------------------------------------------
// 코드 생성
// ---------------------------------------------------------------------------

const MAX_CODE_LENGTH = 64; // tb_master_code.code VARCHAR(64)
const FALLBACK_CODE = 'LINK';

/**
 * 표시 이름에서 마스터코드 `code` 를 만든다. 사용자에게 code 를 묻지 않기 위한 것이다.
 *
 * ★ 형제 code 로 충돌을 미리 피하는 것이 이 함수의 핵심 목적이다. 백엔드의 중복 검사는
 *   IllegalArgumentException 을 던지는데, 그것이 ResponseWrapperConfigure 를 지나면
 *   500 + Slack(#hvy-error) 알림이 된다 — 이름이 겹치는 평범한 조작이 장애 알림이 되어서는 안 된다.
 *
 * 한글 이름은 영숫자가 하나도 남지 않아 전부 FALLBACK_CODE 로 수렴하는데, 그 경우에도
 * 접미사(_2, _3…)가 붙어 유일해지므로 문제되지 않는다. code 는 사람이 읽는 값이 아니다.
 */
export function buildNodeCode(name: string, siblingCodes: readonly string[]): string {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, MAX_CODE_LENGTH) || FALLBACK_CODE;

  const taken = new Set(siblingCodes);
  if (!taken.has(base)) return base;

  for (let n = 2; ; n += 1) {
    const suffix = `_${n}`;
    // 접미사를 붙여도 64자를 넘지 않도록 base 쪽을 깎는다.
    const candidate = base.slice(0, MAX_CODE_LENGTH - suffix.length) + suffix;
    if (!taken.has(candidate)) return candidate;
  }
}
