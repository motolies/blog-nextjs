'use client';

import { Badge, cn, Icon, shiftFor, useListReorder } from '@hvy/ui';
import { GripVertical } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';

/**
 * 키보드 이동 — **포커스 복원은 호출부 책임**이다.
 *
 * 훅은 옮겨진 인덱스를 돌려줄 뿐 포커스를 직접 옮기지 않는다. 배열이 바뀌면 DOM 이 새로
 * 그려져 포커스가 body 로 떨어지므로, 복원 배선이 없으면 **한 칸씩밖에 못 옮긴다.**
 * 왼쪽 목록은 그 배선을 **일부러 빼 두었다** — 두 목록을 나란히 두고 차이를 본다.
 *
 * 검증 포인트:
 * · 손잡이가 `<button>` 이라 Tab 으로 닿고 ↑↓ 로 한 칸씩 움직인다
 * · **왼쪽: ↑ 를 두 번 누르면 두 번째가 먹지 않는다**(포커스가 떨어졌다)
 * · **오른쪽: 복원이 있어 연타가 된다**
 * · 이동마다 onAnnounce 가 불려 아래 안내 줄이 갱신된다 — 드래그와 키보드가 공유하는 지점이다
 * · 키보드 이동도 그룹 경계를 지킨다(groups 예제 참조)
 */

const INITIAL = ['제목', '작성자', '카테고리', '상태', '조회수', '작성일'];

function ReorderList({
  restoreFocus,
  onAnnounce,
}: {
  readonly restoreFocus: boolean;
  readonly onAnnounce: (message: string) => void;
}) {
  const [items, setItems] = useState(INITIAL);
  const listRef = useRef<HTMLUListElement>(null);
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());

  const reorder = useListReorder({
    items,
    onReorder: (next) => setItems([...next]),
    groupOf: () => true,
    listRef,
    onAnnounce: (from, to) =>
      onAnnounce(`${items[from]}, ${to + 1}번째로 이동(전체 ${items.length}개)`),
  });

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number, item: string) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    reorder.moveByKeyboard(index, event.key === 'ArrowUp' ? -1 : 1);
    // 복원이 없으면 배열 변경으로 DOM 이 새로 그려지며 포커스가 body 로 떨어진다.
    if (restoreFocus) {
      requestAnimationFrame(() => handleRefs.current.get(item)?.focus());
    }
  };

  return (
    <ul ref={listRef} className="rounded-dl-container border border-dl-border bg-dl-surface">
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
              dragging ? 'relative z-10 bg-dl-option-hover' : 'bg-dl-surface transition-transform',
            )}
            style={{ transform: `translateY(${dragging ? reorder.offsetY : shift}px)` }}
          >
            <button
              type="button"
              ref={(node) => {
                if (node) handleRefs.current.set(item, node);
                else handleRefs.current.delete(item);
              }}
              aria-label={`${item} 순서 변경`}
              className="shrink-0 cursor-grab text-dl-icon"
              onPointerDown={(event) => reorder.handlePointerDown(event, index)}
              onPointerMove={reorder.handlePointerMove}
              onPointerUp={reorder.handlePointerUp}
              onKeyDown={(event) => onKeyDown(event, index, item)}
            >
              <Icon icon={GripVertical} size="sm" />
            </button>
            <span className="truncate text-dl-sm text-dl-fg">{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function ListReorderKeyboardDemo() {
  const [announcement, setAnnouncement] = useState('');

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-dl-xs font-semibold text-dl-fg-strong">
            포커스 복원 없음{' '}
            <Badge tone="danger" size="xs">
              연타 안 됨
            </Badge>
          </span>
          <ReorderList restoreFocus={false} onAnnounce={setAnnouncement} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-dl-xs font-semibold text-dl-fg-strong">
            포커스 복원 있음{' '}
            <Badge tone="success" size="xs">
              연타 됨
            </Badge>
          </span>
          <ReorderList restoreFocus onAnnounce={setAnnouncement} />
        </div>
      </div>
      <p className="text-dl-xs text-dl-fg-muted">
        onAnnounce: <span className="font-dl-mono">{announcement || '(아직 없음)'}</span> — 실제
        화면에서는 이 문장을 sr-only aria-live 로 내보낸다.
      </p>
    </div>
  );
}
