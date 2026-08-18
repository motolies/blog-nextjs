/**
 * 트리 검색의 순수 계층 — 노드 필터링과 매칭 구간 분할.
 * React 무의존이라 node 환경 vitest 로 단위 테스트가 가능하다(`gridSearch.ts` 와 같은 규약).
 */

export interface TreeFilterResult<T> {
  /** 필터된 트리. 검색어가 비면 원본 배열을 그대로 돌려준다. */
  nodes: readonly T[];
  /**
   * 검색어와 직접 일치한 노드 id. 경로로만 남은 조상은 들어가지 않는다.
   * 하이라이트는 이 집합이 아니라 `splitByMatch` 가 렌더 시점에 판정한다 — 필터링(무엇을
   * 남길까)과 강조(어느 글자를 칠할까)는 다른 질문이고, 후자는 id 집합이 필요 없다.
   */
  matchedIds: ReadonlySet<string>;
  /** 필터 후 남은 전체 노드 id — 검색 중 자동 펼침에 쓴다. */
  visibleIds: ReadonlySet<string>;
  /** 직접 일치한 노드 수. 화면에 보이는 행 수가 아니다(조상 경로는 결과가 아니다). */
  matchCount: number;
}

const EMPTY_IDS: ReadonlySet<string> = new Set<string>();

/** 검색어 정규화 — 앞뒤 공백 제거 + 소문자. 빈 문자열은 "검색하지 않음" 을 뜻한다. */
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * 트리를 검색어로 필터링한다 — **후위 순회 1패스**라 각 노드를 정확히 한 번만 본다.
 * (원본 `tree-view.tsx` 의 `shouldShowNode` 는 노드마다 자손을 다시 훑어 최악 O(n²) 였다.)
 *
 * 남기는 규칙은 하나다: **자기가 일치하거나, 살아남은 자손이 있으면 남는다.**
 * 일치한 노드의 비매칭 자손은 버린다 — 보이는 행이 전부 "결과이거나 결과로 가는 경로" 여야
 * 결과 건수와 화면이 어긋나지 않는다. 자식까지 훑고 싶으면 검색어를 지우면 된다.
 *
 * 자식이 하나도 걸러지지 않은 노드는 원본 참조를 그대로 쓴다 — 참조가 안정적이어야
 * 리렌더가 줄고, 화면 코드가 노드를 동일성으로 비교해도 어긋나지 않는다.
 */
export function filterTree<T extends { children?: readonly T[] }>(
  nodes: readonly T[],
  query: string,
  getId: (node: T) => string,
  getFields: (node: T) => readonly (string | null | undefined)[],
): TreeFilterResult<T> {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return { nodes, matchedIds: EMPTY_IDS, visibleIds: EMPTY_IDS, matchCount: 0 };
  }

  const matchedIds = new Set<string>();
  const visibleIds = new Set<string>();

  const isMatch = (node: T): boolean =>
    getFields(node).some((field) => field?.toLowerCase().includes(normalized));

  const walk = (list: readonly T[]): T[] => {
    const kept: T[] = [];

    for (const node of list) {
      const children = node.children ?? [];
      const keptChildren = children.length > 0 ? walk(children) : [];
      const selfMatch = isMatch(node);

      if (!selfMatch && keptChildren.length === 0) continue;

      const id = getId(node);
      visibleIds.add(id);
      if (selfMatch) matchedIds.add(id);

      const unchanged =
        keptChildren.length === children.length &&
        keptChildren.every((child, index) => child === children[index]);

      kept.push(unchanged ? node : ({ ...node, children: keptChildren } as T));
    }

    return kept;
  };

  const filtered = walk(nodes);
  return { nodes: filtered, matchedIds, visibleIds, matchCount: matchedIds.size };
}

export interface MatchSegment {
  text: string;
  matched: boolean;
}

/**
 * 텍스트를 검색어 일치 구간으로 쪼갠다 — 대소문자는 무시하고 원문 표기는 보존한다.
 * 정규식을 쓰지 않으므로 검색어에 든 특수문자를 이스케이프할 필요가 없다(`(` 하나로
 * 화면이 죽는 사고가 구조적으로 불가능하다).
 */
export function splitByMatch(text: string, query: string): readonly MatchSegment[] {
  const normalized = normalizeQuery(query);
  if (!normalized || !text) return [{ text, matched: false }];

  const haystack = text.toLowerCase();

  // 소문자화로 길이가 변하는 문자가 있다('İ'.toLowerCase().length === 2). 그런 문자가 섞이면
  // 소문자 사본에서 구한 오프셋이 원문과 어긋나 엉뚱한 구간이 칠해진다 — 강조만 포기한다.
  // 필터 쪽은 `includes` 라 오프셋을 쓰지 않으므로 검색 자체는 정상 동작한다.
  if (haystack.length !== text.length) return [{ text, matched: false }];

  const segments: MatchSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = haystack.indexOf(normalized, cursor);
    if (found === -1) break;
    if (found > cursor) segments.push({ text: text.slice(cursor, found), matched: false });
    segments.push({ text: text.slice(found, found + normalized.length), matched: true });
    cursor = found + normalized.length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), matched: false });
  return segments.length > 0 ? segments : [{ text, matched: false }];
}

/**
 * 트리 전체 노드 id 수집 — 초기 전체 펼침용.
 * `CategoryTreeView` 와 `MasterCodePage` 에 같은 코드로 두 벌 있던 `collectAllIds` 를 대체한다.
 */
export function collectTreeIds<T extends { children?: readonly T[] }>(
  nodes: readonly T[],
  getId: (node: T) => string,
  into: Set<string> = new Set(),
): Set<string> {
  for (const node of nodes) {
    into.add(getId(node));
    if (node.children?.length) collectTreeIds(node.children, getId, into);
  }
  return into;
}
