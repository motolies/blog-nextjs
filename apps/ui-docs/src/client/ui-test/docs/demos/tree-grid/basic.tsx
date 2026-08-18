'use client';

import { Badge, TreeGrid } from '@hvy/ui';
import { useState } from 'react';

/**
 * TreeGrid — 주문이력 트리 모달(trace-modal.tsx)의 렌더 구조를 정적 노드로 재현한다.
 * 가상 스크롤도 컬럼도 없는 재귀 렌더러라 DataGrid 와 완전히 다른 컴포넌트다.
 * expanded 가 controlled Set 이라 "모두 펼치기/접기"가 상태 교체 한 번이다.
 */
type DemoNode = {
  readonly id: string;
  readonly step: string;
  readonly description: string;
  readonly at: string;
  readonly children?: readonly DemoNode[];
};

const NODES: readonly DemoNode[] = [
  {
    id: 'n1',
    step: '주문접수',
    description: 'ORD-100001 접수 완료',
    at: '07-01 09:12',
    children: [
      { id: 'n1-1', step: '결제', description: '카드 결제 승인', at: '07-01 09:13' },
      {
        id: 'n1-2',
        step: '검수',
        description: '상품 검수 통과',
        at: '07-01 14:02',
        children: [{ id: 'n1-2-1', step: '재검수', description: '수량 재확인', at: '07-01 15:40' }],
      },
    ],
  },
  {
    id: 'n2',
    step: '출고',
    description: '센터 출고 처리',
    at: '07-02 08:30',
    children: [
      { id: 'n2-1', step: '송장발행', description: '운송장 CJ-5501 발행', at: '07-02 08:31' },
      { id: 'n2-2', step: '집화', description: '택배사 집화 완료', at: '07-02 11:05' },
    ],
  },
  { id: 'n3', step: '배송완료', description: '수취인 서명 확인', at: '07-04 16:22' },
];

function collectIds(nodes: readonly DemoNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectIds(node.children ?? [])]);
}

export function TreeGridBasicDemo() {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(['n1']));

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
          className="text-dl-xs text-dl-primary underline underline-offset-2"
          onClick={() => setExpanded(new Set(collectIds(NODES)))}
        >
          모두 펼치기
        </button>
        <button
          type="button"
          className="text-dl-xs text-dl-primary underline underline-offset-2"
          onClick={() => setExpanded(new Set())}
        >
          모두 접기
        </button>
      </div>

      <TreeGrid
        nodes={NODES}
        getRowId={(node) => node.id}
        expanded={expanded}
        onToggle={toggle}
        collapseLabel="접기"
        expandLabel="펼치기"
        renderRow={(node) => (
          <div className="flex items-center gap-2">
            <Badge tone="primary">{node.step}</Badge>
            <span className="truncate text-dl-fg">{node.description}</span>
            <span className="ml-auto shrink-0 text-dl-xs text-dl-fg-muted">{node.at}</span>
          </div>
        )}
      />
    </div>
  );
}
