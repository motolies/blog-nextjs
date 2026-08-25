'use client';

import { Badge, cn, Icon, shiftFor, useListReorder } from '@hvy/ui';
import { GripVertical, Lock } from 'lucide-react';
import { useRef, useState } from 'react';

/**
 * groupOf — **그룹 경계에서 멈춘다.**
 *
 * 막는 게 아니라 **가두는** 이유: 드래그는 여러 칸을 한 번에 건너뛴다. "그룹이 다르면
 * 이동 무시" 로 처리하면 경계 위로 끌었을 때 **아무 일도 일어나지 않아 고장난 것처럼 보인다.**
 * 경계까지는 따라오고 거기서 멈춰야 한다.
 *
 * 검증 포인트:
 * · 고정(자물쇠) 항목은 앞쪽 구간, 일반 항목은 뒤쪽 구간 안에서만 움직인다
 * · 경계를 넘겨 끌어도 **경계까지 따라오다 멈춘다**
 * · 키보드(↑↓)도 같은 규칙이다 — clampToGroup 을 드래그와 공유한다
 * · 그룹 구분이 필요 없으면 `() => true` 를 넘긴다(기본 예제가 그 경우다)
 * · 실제 소비처 둘이 이 표식을 어떻게 쓰는지: 컬럼 설정은 `pinned`, 작업 탭 바는 `tab.pinned` 다
 */

type Row = { readonly id: string; readonly label: string; readonly pinned: boolean };

const INITIAL: readonly Row[] = [
  { id: 'no', label: 'No', pinned: true },
  { id: 'postId', label: '게시글 ID', pinned: true },
  { id: 'author', label: '작성자', pinned: false },
  { id: 'category', label: '카테고리', pinned: false },
  { id: 'status', label: '상태', pinned: false },
  { id: 'views', label: '조회수', pinned: false },
];

export function ListReorderGroupsDemo() {
  const [items, setItems] = useState(INITIAL);
  const listRef = useRef<HTMLUListElement>(null);

  const reorder = useListReorder({
    items,
    onReorder: (next) => setItems([...next]),
    // 이 표식 하나가 경계를 정한다 — 컬럼 설정의 pinned, 작업 탭 바의 tab.pinned 와 같은 자리.
    groupOf: (item) => item.pinned,
    listRef,
  });

  const pinnedIsPrefix =
    items.findIndex((item) => !item.pinned) === items.filter((i) => i.pinned).length;

  return (
    <div className="w-full max-w-sm">
      <ul ref={listRef} className="rounded-dl-container border border-dl-border bg-dl-surface">
        {items.map((item, index) => {
          const dragging = reorder.draggingIndex === index;
          const shift =
            reorder.draggingIndex === null || reorder.dropIndex === null
              ? 0
              : shiftFor(index, reorder.draggingIndex, reorder.dropIndex, reorder.rowHeight);
          return (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-2 border-dl-divider border-b px-3 py-2 last:border-b-0',
                dragging
                  ? 'relative z-10 bg-dl-option-hover'
                  : 'bg-dl-surface transition-transform',
              )}
              style={{ transform: `translateY(${dragging ? reorder.offsetY : shift}px)` }}
            >
              <button
                type="button"
                aria-label={`${item.label} 순서 변경`}
                title={item.pinned ? '고정 구간 안에서만 옮길 수 있습니다' : undefined}
                className="shrink-0 cursor-grab text-dl-icon"
                onPointerDown={(event) => reorder.handlePointerDown(event, index)}
                onPointerMove={reorder.handlePointerMove}
                onPointerUp={reorder.handlePointerUp}
              >
                <Icon icon={GripVertical} size="sm" />
              </button>
              <span className="truncate text-dl-sm text-dl-fg">{item.label}</span>
              {item.pinned ? (
                <Icon icon={Lock} size="sm" className="ml-auto shrink-0 text-dl-icon" />
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-dl-xs">
        고정 구간이 앞쪽 연속:{' '}
        {pinnedIsPrefix ? (
          <Badge tone="success" size="xs">
            유지
          </Badge>
        ) : (
          <Badge tone="danger" size="xs">
            깨짐
          </Badge>
        )}
      </p>
    </div>
  );
}
