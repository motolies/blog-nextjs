'use client';

import { Badge, TreeGrid } from '@hvy/ui';
import { useState } from 'react';

/**
 * TreeGrid 형제 순서 변경 — 손잡이 드래그와 ↑↓ 키.
 *
 * 확인할 것이 셋이다.
 *  · **형제 밖으로 못 나간다.** 펼쳐진 자손이 사이에 끼어 있어도 같은 부모의 자식끼리만 움직인다
 *    (형제 경계가 DOM 컨테이너로 갈라져 있어서다).
 *  · **루트에는 손잡이가 없다.** 재정렬 단위가 "부모의 자식 목록" 인데 루트에는 부모가 없다.
 *  · **휠로 스크롤한 뒤 놓아도 자리가 맞는다.** 이 데모는 트리를 일부러 스크롤되는 상자에 넣었다 —
 *    트리 자신이 아니라 **조상**이 스크롤하는 실제 배치(관리 화면의 좌측 패널)를 재현한 것이다.
 */
type DemoNode = {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly children?: readonly DemoNode[];
};

const INITIAL: readonly DemoNode[] = [
  {
    id: 'favorite',
    name: 'FAVORITE',
    kind: '루트',
    children: [
      {
        id: 'devtools',
        name: 'DEVTOOLS',
        kind: '그룹',
        children: [
          { id: 'github', name: 'GITHUB', kind: '링크' },
          { id: 'figma', name: 'FIGMA', kind: '링크' },
          { id: 'linear', name: 'LINEAR', kind: '링크' },
        ],
      },
      {
        id: 'community',
        name: 'COMMUNITY',
        kind: '그룹',
        children: [
          { id: 'reddit', name: 'REDDIT', kind: '링크' },
          { id: 'hn', name: 'HACKERNEWS', kind: '링크' },
        ],
      },
      { id: 'webtools', name: 'WEBTOOLS', kind: '그룹' },
      { id: 'etc', name: 'ETC', kind: '그룹' },
    ],
  },
];

/** 트리에서 한 부모의 자식 목록만 갈아끼운 새 트리. 바뀌지 않은 가지는 참조를 유지한다. */
function replaceChildren(
  nodes: readonly DemoNode[],
  parentId: string,
  next: readonly DemoNode[],
): readonly DemoNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) return { ...node, children: [...next] };
    if (!node.children) return node;
    const children = replaceChildren(node.children, parentId, next);
    return children === node.children ? node : { ...node, children };
  });
}

export function TreeGridReorderDemo() {
  const [nodes, setNodes] = useState(INITIAL);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(['favorite', 'devtools', 'community']),
  );

  const toggle = (id: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-dl-xs text-dl-fg-muted">
        손잡이를 끌거나, 손잡이에 포커스를 두고 ↑↓ 를 누른다. 그룹을 접었다 펴도 형제 경계는
        그대로다.
      </p>

      {/* 트리 자신이 아니라 이 상자가 스크롤한다 — 관리 화면의 좌측 패널과 같은 배치다. */}
      <div className="max-h-56 overflow-y-auto rounded-dl-container border border-dl-border p-2">
        <TreeGrid<DemoNode>
          nodes={nodes}
          getRowId={(node) => node.id}
          expanded={expanded}
          onToggle={toggle}
          collapseLabel="접기"
          expandLabel="펼치기"
          onReorder={(parentId, next) =>
            setNodes((previous) => replaceChildren(previous, parentId, next))
          }
          reorderLabel={(node) => `${node.name} 순서 변경`}
          reorderAnnouncement={(node, position, total) =>
            `${node.name}, ${position}번째로 이동(전체 ${total}개)`
          }
          renderRow={(node) => (
            <div className="flex items-center gap-2">
              <span className="truncate text-dl-fg">{node.name}</span>
              <Badge tone="neutral" size="xs">
                {node.kind}
              </Badge>
            </div>
          )}
        />
      </div>
    </div>
  );
}
