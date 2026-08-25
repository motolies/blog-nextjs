'use client';

import { cn, Icon, shiftFor, useListReorder } from '@hvy/ui';
import { GripVertical } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * 드래그 재정렬 — **배열은 놓을 때 한 번만 바뀐다.**
 *
 * 드래그 중에는 잡은 항목이 `translateY` 로 손에 1:1 로 붙고 다른 항목만 비켜난다.
 * 처음에는 pointermove 마다 실제 배열을 바꿨는데 판정 기준이 포인터 y 라, 스왑되는 순간
 * 잡은 항목이 포인터 자리로 순간이동하고 포인터는 여전히 경계 근처여서 **떨렸다**.
 * 지금은 기준이 **잡은 항목의 중심**이라 다른 항목의 중심을 지나야 자리가 바뀐다 —
 * half-row 히스테리시스가 공짜로 생긴다.
 *
 * 검증 포인트:
 * · 끄는 동안 항목이 **떨리지 않는다**
 * · 잡은 항목은 손에 1:1 로 붙고 transition 이 없다 — 주면 손보다 늦게 따라와 늘어진다
 * · 비켜나는 항목만 부드럽게 움직인다
 * · 목록이 길어 스크롤이 생기면 위아래 가장자리에서 자동 스크롤이 걸리고
 *   **손을 떼면 반드시 멈춘다**
 * · 잡은 항목은 목록 첫/마지막 슬롯 밖으로 나가지 못한다 — 안 가두면 transform 이
 *   scrollHeight 를 늘려 자동 스크롤이 폭주한다(실제 사고)
 * · 놓는 순간 배열 변경과 transform 제거가 한 렌더에 반영되어 깜빡임이 없다
 * · 아주 빠르게 끌었다 놓아도(한 프레임 안에 down→move→up) 이동이 사라지지 않는다
 * · **컨테이너 자식 순서가 items 와 1:1이어야 한다** — 목록 안에 장식용 노드를 하나 끼우면
 *   좌표 배열이 통째로 어긋난다
 */

const INITIAL = [
  '개발일지',
  '알고리즘',
  '프론트엔드',
  '백엔드',
  '인프라',
  '데이터베이스',
  '디자인 시스템',
  '회고',
  '번역',
  '도서리뷰',
];

export function ListReorderBasicDemo() {
  const [items, setItems] = useState(INITIAL);
  const listRef = useRef<HTMLUListElement>(null);

  const reorder = useListReorder({
    items,
    onReorder: (next) => setItems([...next]),
    // 그룹 구분이 필요 없으면 항상 같은 값을 돌려준다.
    groupOf: () => true,
    listRef,
  });

  return (
    <div className="w-full max-w-sm">
      <ul
        ref={listRef}
        className="max-h-64 overflow-y-auto rounded-dl-container border border-dl-border bg-dl-surface"
      >
        {items.map((item, index) => {
          const dragging = reorder.draggingIndex === index;
          const shift =
            reorder.draggingIndex === null || reorder.dropIndex === null
              ? 0
              : shiftFor(index, reorder.draggingIndex, reorder.dropIndex, reorder.rowHeight);
          return (
            <li
              key={item}
              className={cn(
                'flex items-center gap-2 border-dl-divider border-b px-3 py-2 last:border-b-0',
                dragging ? 'relative z-10 bg-dl-option-hover shadow-dl-menu' : 'bg-dl-surface',
                // 잡은 항목에는 transition 이 없다 — 있으면 손보다 늦게 따라온다.
                dragging ? '' : 'transition-transform',
              )}
              style={{
                transform: `translateY(${dragging ? reorder.offsetY : shift}px)`,
              }}
            >
              <button
                type="button"
                aria-label={`${item} 순서 변경`}
                className="shrink-0 cursor-grab text-dl-icon"
                onPointerDown={(event) => reorder.handlePointerDown(event, index)}
                onPointerMove={reorder.handlePointerMove}
                onPointerUp={reorder.handlePointerUp}
              >
                <Icon icon={GripVertical} size="sm" />
              </button>
              <span className="truncate text-dl-sm text-dl-fg">{item}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-dl-xs text-dl-fg-muted">
        순서: <span className="font-dl-mono">{items.join(' · ')}</span>
      </p>
    </div>
  );
}
