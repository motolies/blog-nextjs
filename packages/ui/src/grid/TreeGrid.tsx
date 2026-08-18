'use client';

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Icon } from '../icons';
import { type GridEmpty, GridEmptyContent } from './GridEmptyOverlay';

/**
 * 트리 그리드 — 주문이력(trace)용. 계층 데이터 렌더링이 POC 검증 범위다(설계서 §7.7).
 *
 * `DataGrid` 에서 분리한 이유: 완전히 다른 렌더러다(가상 스크롤 없음 · 컬럼 없음 ·
 * 재귀 구조). 한 파일에 두면 DataGrid 가 커질수록 읽기 어려워진다.
 *
 * 빈 상태만은 `DataGrid` 와 **같은 계약**(`GridEmpty`)을 쓴다 — 두 그리드의 "없음" 이
 * 화면마다 달라 보이면 안 된다. 오버레이가 아니라 흐름 배치인 이유는 헤더도 고정 높이도
 * 없어서고, 로딩 상태를 받지 않는 이유는 `isFetching` 이 없어서다(실사용처인
 * `trace-modal.tsx` 가 자체 Spinner 로 로딩을 처리한다).
 */

/** `empty` 를 생략했을 때의 문구 — `DataGrid.DEFAULT_EMPTY` 와 같은 규약이다. */
const DEFAULT_TREE_EMPTY: GridEmpty = { state: 'empty', title: '데이터가 없습니다' };
export function TreeGrid<T extends { children?: readonly T[] }>({
  nodes,
  getRowId,
  expanded,
  onToggle,
  renderRow,
  empty,
  collapseLabel = '접기',
  expandLabel = '펼치기',
}: {
  readonly nodes: readonly T[];
  readonly getRowId: (node: T) => string;
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly renderRow: (node: T, depth: number) => ReactNode;
  /**
   * 노드가 없을 때. `DataGrid` 와 같은 계약이고, **생략해도 기본 문구가 나온다** —
   * 예전에는 `nodes` 가 비면 아무것도 그리지 않았다.
   */
  readonly empty?: GridEmpty;
  /** 스크린리더용 문구. 화면에 안 보인다고 다국어에서 빠지면 접근성이 한국어에만 성립한다. */
  readonly collapseLabel?: string;
  readonly expandLabel?: string;
}) {
  const render = (items: readonly T[], depth: number): ReactNode =>
    items.map((node) => {
      const id = getRowId(node);
      const hasChildren = (node.children?.length ?? 0) > 0;
      const isOpen = expanded.has(id);

      return (
        <div key={id}>
          <div className="flex items-center gap-1 border-b border-dl-divider py-1.5">
            <span style={{ paddingLeft: depth * 16 }} className="flex items-center">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  aria-label={isOpen ? collapseLabel : expandLabel}
                  aria-expanded={isOpen}
                  className="rounded-dl-badge p-0.5 text-dl-fg-muted hover:bg-dl-icon-hover"
                >
                  <Icon
                    icon={ChevronRight}
                    size="sm"
                    className={isOpen ? 'rotate-90' : undefined}
                  />
                </button>
              ) : (
                <span className="inline-block size-[22px]" />
              )}
            </span>
            <div className="min-w-0 flex-1">{renderRow(node, depth)}</div>
          </div>
          {hasChildren && isOpen ? render(node.children ?? [], depth + 1) : null}
        </div>
      );
    });

  if (nodes.length === 0) {
    return <GridEmptyContent empty={empty ?? DEFAULT_TREE_EMPTY} className="py-10" />;
  }

  return <div className="text-dl-sm">{render(nodes, 0)}</div>;
}
