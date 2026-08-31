'use client';

import { cn, Icon, shiftFor, useListReorder } from '@hvy/ui';
import { GripVertical } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useScrollParent } from './useScrollParent';

/**
 * 손잡이로 끌어 순서를 바꾸는 목록.
 *
 * `@hvy/ui` 의 `useListReorder`(Primitive)를 **소비만** 하는 Composite 이다
 * (packages/ui README 의 Primitive/Composite 경계 — 접근성·키보드 조작처럼 틀리면 조용히 위험한
 * 코드는 패키지가 갖고, 화면 조합물은 앱이 갖는다). 배선 레퍼런스는 `ColumnSettingsDialog` 다.
 *
 * ⚠️ 훅 계약: `listRef` 컨테이너의 **직접 자식이 items 와 1:1** 이어야 한다
 *    (훅이 `list.children` 을 그대로 순회해 좌표를 잰다). 그래서 빈 상태 문구를 `<ul>` 안에 넣지 않고
 *    컴포넌트가 통째로 대체한다 — 넣으면 인덱스가 한 칸씩 밀린다.
 */
export default function SortableRowList<T extends { readonly id: string }>({
  items,
  onReorder,
  renderRow,
  getLabel,
  emptyText,
  rowClassName,
}: {
  readonly items: readonly T[];
  /**
   * 놓았을 때(또는 ↑↓ 키 이동 시) **한 번만** 호출된다. 새 순서 전체를 넘긴다 —
   * 백엔드 reorder API 가 받는 모양(id 배열)과 같아 변환이 필요 없다.
   */
  readonly onReorder: (next: readonly T[]) => void;
  readonly renderRow: (item: T, index: number) => ReactNode;
  /** 손잡이 aria-label 과 이동 안내 문구에 쓸, 사람이 읽는 이름. */
  readonly getLabel: (item: T) => string;
  readonly emptyText: string;
  readonly rowClassName?: string;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  /**
   * 실제 스크롤러는 <ul> 이 아니라 어드민 본문(.contentWrapper)이다. 이걸 넘기지 않으면
   * 훅이 <ul> 을 스크롤러로 보아 자동 스크롤이 no-op 이 되고(터치에서는 손잡이가
   * touch-none 이라 그 손가락으로 스크롤도 못 해 화면 밖으로 옮길 방법이 사라진다),
   * scrollTop 이 늘 0 이라 스크롤 보정항도 죽는다. TreeGrid 가 같은 배선을 쓴다.
   */
  const scrollRef = useScrollParent(listRef);
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  /** 키보드로 옮긴 직후 포커스를 되돌려 줄 항목. 재배열되면 DOM 이 새로 만들어진다. */
  const focusAfterMove = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const reorder = useListReorder<T>({
    items,
    onReorder,
    // 이 목록 하나가 곧 한 형제 집합이다 — 안에 하위 구간이 없으므로 전부 같은 그룹.
    groupOf: () => true,
    listRef,
    scrollRef,
    onAnnounce: (from, to) => {
      const moved = items[from];
      if (!moved) return;
      setAnnouncement((previous) => {
        const next = `${getLabel(moved)}, ${to + 1}번째로 이동(전체 ${items.length}개)`;
        // 같은 문장이 연속으로 들어가면 aria-live 가 다시 읽지 않는다 — 끝에 공백을 번갈아 붙인다.
        return previous === next ? `${next} ` : next;
      });
    },
  });

  /**
   * 키보드 이동 후 포커스 복원.
   *
   * 배열이 바뀌면 React 가 행을 새로 그려 포커스가 `<body>` 로 떨어진다 —
   * 그러면 ↑ 를 두 번 연속 누를 수 없어 키보드로는 한 칸씩밖에 못 옮긴다.
   */
  useEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    focusAfterMove.current = null;
    handleRefs.current.get(id)?.focus();
  }, [items]);

  const onHandleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : null;
    if (direction === null) return;

    event.preventDefault();
    const moved = reorder.moveByKeyboard(index, direction);
    if (moved !== index) focusAfterMove.current = items[index]?.id ?? null;
  };

  // ⚠️ 훅 호출 뒤에 분기한다 — 훅을 조건부로 부르면 순서가 깨진다.
  if (items.length === 0) {
    return <p className="py-3 text-center text-dl-sm text-dl-fg-muted">{emptyText}</p>;
  }

  return (
    <>
      {/* 드래그는 순전히 시각적 조작이라, 이 영역이 없으면 화면을 못 보는 사용자에게는
          아무 일도 일어나지 않은 것과 같다. */}
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>

      <ul ref={listRef} className="flex flex-col gap-2">
        {items.map((item, index) => {
          const dragging = reorder.draggingIndex === index;

          /**
           * 드래그 중에는 **배열을 바꾸지 않는다.** 잡은 행은 손을 그대로 따라가고(`offsetY`),
           * 나머지는 비켜날 만큼만 움직인다(`shiftFor`). 배열은 놓을 때 한 번 바뀐다.
           */
          const shift =
            reorder.draggingIndex === null || reorder.dropIndex === null
              ? 0
              : dragging
                ? reorder.offsetY
                : shiftFor(index, reorder.draggingIndex, reorder.dropIndex, reorder.rowHeight);

          return (
            <li
              key={item.id}
              style={shift === 0 ? undefined : { transform: `translateY(${shift}px)` }}
              className={cn(
                'flex items-center gap-2',
                rowClassName,
                // 잡은 행: 떠 있는 카드. z 가 없으면 다음 행 배경에 덮여 떠 보이지 않는다.
                // **transition 을 주지 않는다** — 손보다 늦게 따라와 고무줄처럼 늘어진다.
                dragging
                  ? 'relative z-10 shadow-dl-menu'
                  : // 비켜나는 행만 부드럽게 움직인다.
                    'transition-transform duration-150',
              )}
            >
              {/*
                @hvy/ui 의 Button 이 아니라 raw <button> 인 이유:
                포인터 이벤트 5종과 ref 를 직접 붙여야 하고, 훅이 handlePointerDown 안에서
                currentTarget.focus() 를 부르므로 포커스 가능한 요소여야 한다.

                ⚠️ disabled 로 잠그지 않는다 — 드래그 도중 disabled 되면 포인터 캡처가 끊겨
                   rAF 루프가 남고 자동 스크롤이 멈추지 않는다.
              */}
              <button
                type="button"
                ref={(element) => {
                  if (element) handleRefs.current.set(item.id, element);
                  else handleRefs.current.delete(item.id);
                }}
                aria-label={`${getLabel(item)} 순서 변경`}
                title="드래그 또는 ↑↓ 키로 이동"
                onPointerDown={(event) => reorder.handlePointerDown(event, index)}
                onPointerMove={reorder.handlePointerMove}
                onPointerUp={reorder.handlePointerUp}
                onPointerCancel={reorder.handlePointerUp}
                onKeyDown={(event) => onHandleKeyDown(event, index)}
                className={cn(
                  // touch-none 이 없으면 터치 기기에서 드래그가 스크롤로 가로채인다
                  'flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-dl-badge text-dl-fg-muted hover:bg-dl-icon-hover',
                  dragging && 'cursor-grabbing text-dl-tonal-fg',
                )}
              >
                <Icon icon={GripVertical} size="sm" />
              </button>

              {renderRow(item, index)}
            </li>
          );
        })}
      </ul>
    </>
  );
}
