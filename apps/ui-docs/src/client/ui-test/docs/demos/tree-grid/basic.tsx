'use client';

import { Badge, TreeGrid } from '@hvy/ui';
import { useState } from 'react';

/**
 * TreeGrid — 계층 자료의 렌더 구조를 정적 노드로 재현한다(블로그의 카테고리 트리와 같은 모양:
 * `apps/blog/src/components/.../CategoryTreeView.tsx`).
 * 가상 스크롤도 컬럼도 없는 재귀 렌더러라 DataGrid 와 완전히 다른 컴포넌트다.
 * expanded 가 controlled Set 이라 "모두 펼치기/접기"가 상태 교체 한 번이다.
 */
type DemoNode = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** 하위를 합친 게시글 수 — 우측 정렬 메타 자리다. */
  readonly postCount: number;
  readonly children?: readonly DemoNode[];
};

const NODES: readonly DemoNode[] = [
  {
    id: 'n1',
    name: '개발',
    description: '코드와 도구에 대한 글',
    postCount: 128,
    children: [
      { id: 'n1-1', name: '프론트엔드', description: 'React · Next.js · CSS', postCount: 74 },
      {
        id: 'n1-2',
        name: '백엔드',
        description: 'Spring · 데이터베이스',
        postCount: 41,
        children: [
          {
            id: 'n1-2-1',
            name: '데이터베이스',
            description: '쿼리 튜닝 · 마이그레이션',
            postCount: 17,
          },
        ],
      },
    ],
  },
  {
    id: 'n2',
    name: '에세이',
    description: '기술 밖의 글',
    postCount: 36,
    children: [
      { id: 'n2-1', name: '회고', description: '분기·연간 돌아보기', postCount: 12 },
      { id: 'n2-2', name: '번역', description: '원문 링크와 함께', postCount: 9 },
    ],
  },
  { id: 'n3', name: '리뷰', description: '읽은 것과 써 본 것', postCount: 22 },
];

function collectIds(nodes: readonly DemoNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectIds(node.children ?? [])]);
}

export function TreeGridBasicDemo() {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(['n1']));
  /** 노드가 0개일 때 — DataGrid 와 **같은 계약**(GridEmpty)으로 문구가 나온다. */
  const [showEmpty, setShowEmpty] = useState(false);

  const toggle = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          className="text-dl-xs text-dl-primary-ink underline underline-offset-2"
          onClick={() => setExpanded(new Set(collectIds(NODES)))}
        >
          모두 펼치기
        </button>
        <button
          type="button"
          className="text-dl-xs text-dl-primary-ink underline underline-offset-2"
          onClick={() => setExpanded(new Set())}
        >
          모두 접기
        </button>
        <button
          type="button"
          className="text-dl-xs text-dl-primary-ink underline underline-offset-2"
          onClick={() => setShowEmpty((previous) => !previous)}
        >
          {showEmpty ? '노드 되돌리기' : '노드 비우기'}
        </button>
      </div>

      <TreeGrid
        nodes={showEmpty ? [] : NODES}
        empty={{ title: '카테고리가 없습니다', hint: '아직 만들어 둔 카테고리가 없습니다' }}
        getRowId={(node) => node.id}
        expanded={expanded}
        onToggle={toggle}
        collapseLabel="접기"
        expandLabel="펼치기"
        renderRow={(node) => (
          <div className="flex items-center gap-2">
            <Badge tone="primary">{node.name}</Badge>
            <span className="truncate text-dl-fg">{node.description}</span>
            <span className="ml-auto shrink-0 text-dl-xs text-dl-fg-muted">{node.postCount}건</span>
          </div>
        )}
      />
    </div>
  );
}
