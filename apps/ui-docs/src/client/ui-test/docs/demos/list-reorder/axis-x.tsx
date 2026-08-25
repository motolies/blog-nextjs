'use client';

import { cn, shiftFor, useListReorder } from '@hvy/ui';
import { useRef, useState } from 'react';

/**
 * axis="x" — **가로 목록**. 작업 탭 바가 쓰는 축이다.
 *
 * 순수 계산(listReorder.ts)은 좌표 배열만 다뤄 축을 모른다 — 축을 타는 것은 **측정뿐**이다.
 * 그래서 반환 필드 이름은 그대로 `offsetY`·`rowHeight` 인데, x 축에서는 각각
 * **가로 이동량**과 **항목 폭**을 담는다(첫 소비자인 세로 목록 기준 이름이라 그대로 두었다).
 *
 * 검증 포인트:
 * · 좌우로 끌어 순서가 바뀐다
 * · 아래 표시로 offsetY 가 **가로** 이동량을, rowHeight 가 **항목 폭**을 담는 것을 확인한다
 * · 가로 자동 스크롤도 세로와 같은 코드다(scrollLeft 로 갈릴 뿐)
 * · **항목 사이에 gap 을 준 목록에서는 비켜나는 거리가 `rowHeight + gap` 이어야 한다** —
 *   값을 안 맞추면 화면은 멀쩡한 채 드래그할 때만 어긋난다.
 *   WorkTabsBar 의 CHIP_GAP_PX 가 이 짝이고, 지금 0 인 이유도 그 때문이다.
 *   아래 「gap 8px」 토글로 그 어긋남을 직접 만들어 볼 수 있다
 */

const INITIAL = ['목록', '접근성', '토큰 설계', '주간 회고', '번들 크기'];

/** 이 값을 shiftFor 에 더하지 않으면 gap 만큼 어긋난다 — 토글로 그 차이를 본다. */
const GAP_PX = 8;

export function ListReorderAxisXDemo() {
  const [items, setItems] = useState(INITIAL);
  const [withGap, setWithGap] = useState(false);
  const [compensate, setCompensate] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  const reorder = useListReorder({
    items,
    onReorder: (next) => setItems([...next]),
    groupOf: () => true,
    listRef,
    axis: 'x',
  });

  const gap = withGap ? GAP_PX : 0;
  const step = reorder.rowHeight + (compensate ? gap : 0);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3 text-dl-xs">
        <label className="flex items-center gap-1.5 text-dl-fg">
          <input type="checkbox" checked={withGap} onChange={(e) => setWithGap(e.target.checked)} />
          gap {GAP_PX}px 주기
        </label>
        <label className="flex items-center gap-1.5 text-dl-fg">
          <input
            type="checkbox"
            checked={compensate}
            onChange={(e) => setCompensate(e.target.checked)}
          />
          shiftFor 에 gap 보정
        </label>
        <span className="text-dl-fg-muted">
          offsetY(가로 이동량) = {Math.round(reorder.offsetY)} · rowHeight(항목 폭) ={' '}
          {Math.round(reorder.rowHeight)}
        </span>
      </div>

      <ul
        ref={listRef}
        className="flex overflow-x-auto rounded-dl-container border border-dl-border bg-dl-canvas p-2"
        style={{ gap: `${gap}px` }}
      >
        {items.map((item, index) => {
          const dragging = reorder.draggingIndex === index;
          const shift =
            reorder.draggingIndex === null || reorder.dropIndex === null
              ? 0
              : shiftFor(index, reorder.draggingIndex, reorder.dropIndex, step);
          return (
            <li
              key={item}
              className={cn(
                'shrink-0 cursor-grab rounded-dl-badge border border-dl-border px-3 py-1.5 text-dl-sm',
                dragging
                  ? 'relative z-10 bg-dl-option-hover text-dl-fg-strong shadow-dl-menu'
                  : 'bg-dl-surface text-dl-fg transition-transform',
              )}
              style={{ transform: `translateX(${dragging ? reorder.offsetY : shift}px)` }}
              onPointerDown={(event) => reorder.handlePointerDown(event, index)}
              onPointerMove={reorder.handlePointerMove}
              onPointerUp={reorder.handlePointerUp}
            >
              {item}
            </li>
          );
        })}
      </ul>
      <p className="text-dl-xs text-dl-fg-muted">
        순서: <span className="font-dl-mono">{items.join(' · ')}</span>
      </p>
    </div>
  );
}
