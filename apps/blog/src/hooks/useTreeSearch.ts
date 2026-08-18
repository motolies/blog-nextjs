import { useCallback, useEffect, useMemo, useState } from 'react';
import { collectTreeIds, filterTree, normalizeQuery } from '@/lib/treeSearch';

/**
 * 트리 검색 배선 — 검색어·펼침 상태를 함께 소유한다.
 *
 * 펼침까지 여기서 갖는 이유: 검색이 펼침을 덮어써야 하는 이상 두 상태를 한곳에서 조정해야
 * 하고, 두 화면에 중복돼 있던 전체 펼침 로직도 이 참에 하나로 합쳐진다.
 *
 * `getId`/`getFields` 는 **모듈 스코프 상수로 넘겨야 한다.** 호출부에서 인라인 화살표로 만들면
 * 매 렌더 새 함수가 되어 아래 메모가 매번 무효화된다(`api-log.tsx` 의 searchFields 와 같은 함정).
 */
export function useTreeSearch<T extends { children?: readonly T[] }>(
  nodes: readonly T[],
  getId: (node: T) => string,
  getFields: (node: T) => readonly (string | null | undefined)[],
) {
  const [query, setQuery] = useState('');
  /** 사용자가 조작한 영구 펼침 상태. 검색은 여기에 절대 쓰지 않는다. */
  const [userExpanded, setUserExpanded] = useState<ReadonlySet<string>>(new Set());
  /** 검색 중에만 유효한 접기 버퍼. 검색어가 바뀌면 버린다. */
  const [searchCollapsed, setSearchCollapsed] = useState<ReadonlySet<string>>(new Set());

  const isSearching = normalizeQuery(query) !== '';

  const result = useMemo(
    () => filterTree(nodes, query, getId, getFields),
    [nodes, query, getId, getFields],
  );

  // 최초 데이터 도착 시 전체 펼침. size 가 0 일 때만 쓰므로 사용자가 접어 둔 뒤의 재조회는
  // 상태를 덮어쓰지 않는다(기존 MasterCodePage 규칙을 그대로 옮겼다).
  useEffect(() => {
    if (nodes.length === 0) return;
    setUserExpanded((prev) => (prev.size === 0 ? collectTreeIds(nodes, getId) : prev));
  }, [nodes, getId]);

  // 검색어가 바뀌면 접기 버퍼를 비운다 — 새 결과 집합은 전부 보여야 한다.
  useEffect(() => {
    setSearchCollapsed((prev) => (prev.size === 0 ? prev : new Set()));
  }, [query]);

  /**
   * 검색 중에는 남은 노드를 전부 펼친다(필터를 통과한 노드는 매칭이거나 매칭으로 가는
   * 경로뿐이다). 사용자 조작은 `userExpanded` 에 그대로 남아 있어, 검색어를 지우면 별도
   * 복원 로직 없이 원래 상태로 돌아간다.
   */
  const expanded = useMemo(() => {
    if (!isSearching) return userExpanded;
    if (searchCollapsed.size === 0) return result.visibleIds;
    const next = new Set(result.visibleIds);
    for (const id of searchCollapsed) next.delete(id);
    return next;
  }, [isSearching, userExpanded, searchCollapsed, result.visibleIds]);

  // 검색 중 토글은 전용 버퍼에만 쓴다 — 그래야 화살표가 반응하면서 영구 상태가 안 더럽혀진다.
  const toggle = useCallback(
    (id: string) => {
      const flip = (prev: ReadonlySet<string>) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      };
      if (isSearching) setSearchCollapsed(flip);
      else setUserExpanded(flip);
    },
    [isSearching],
  );

  /** 검색과 무관하게 영구 펼침 — 하위 노드를 저장한 직후 부모를 펼치는 용도다. */
  const expandNode = useCallback((id: string) => {
    setUserExpanded((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const clearQuery = useCallback(() => setQuery(''), []);

  return {
    query,
    setQuery,
    clearQuery,
    isSearching,
    nodes: result.nodes,
    matchCount: result.matchCount,
    expanded,
    toggle,
    expandNode,
  };
}
