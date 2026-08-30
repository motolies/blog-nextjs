/**
 * 마스터코드 트리 상태 조작 — 순수 함수.
 *
 * 이 앱의 vitest 는 node 환경이고 `apps/**` 는 `.ts` 만 수집한다. 즉 트리 화면에서 **여기 있는 것만
 * 자동 검증이 가능하다** — 그래서 낙관적 업데이트의 핵심 계산을 컴포넌트에 두지 않고 뽑아냈다.
 */

/** `replaceChildren` 이 다룰 수 있는 최소 형태. 실제로는 MasterCodeNode 가 들어온다. */
type TreeNode = { id: string; children?: TreeNode[] };

/**
 * 트리에서 `parentId` 노드의 자식 목록만 `next` 로 갈아끼운 **새 트리**를 돌려준다.
 *
 * 순서 변경을 낙관적으로 반영할 때 쓴다. 전체를 재조회하면 응답이 올 때까지 화면이 옛 순서를
 * 보여주는데, 드래그는 놓는 즉시 결과가 보여야 하는 조작이다.
 *
 * 바뀐 경로의 노드만 새로 만들고 **나머지는 참조를 그대로 유지**한다 — React 가 바뀌지 않은
 * 가지를 다시 그리지 않도록.
 */
export function replaceChildren<T extends TreeNode>(
  nodes: readonly T[],
  parentId: string,
  next: readonly T[],
): T[] {
  let changed = false;

  const result = nodes.map((node) => {
    if (node.id === parentId) {
      changed = true;
      return { ...node, children: [...next] } as T;
    }

    if (!node.children || node.children.length === 0) return node;

    const children = replaceChildren(node.children as T[], parentId, next);
    if (children === node.children) return node;

    changed = true;
    return { ...node, children } as T;
  });

  // 못 찾았으면 원본 배열을 그대로 돌려준다 — 호출부가 참조 비교로 "변화 없음" 을 알 수 있다.
  return changed ? result : (nodes as T[]);
}
