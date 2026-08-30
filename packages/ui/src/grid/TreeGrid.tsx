'use client';

import { ChevronRight, GripVertical } from 'lucide-react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { shiftFor } from '../dnd/listReorder';
import { useListReorder } from '../dnd/useListReorder';
import { useScrollParent } from '../dnd/useScrollParent';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import { type GridEmpty, GridEmptyContent } from './GridEmptyOverlay';

/**
 * 트리 그리드 — 계층 데이터 렌더러.
 *
 * `DataGrid` 에서 분리한 이유: 완전히 다른 렌더러다(가상 스크롤 없음 · 컬럼 없음 · 재귀 구조).
 * 한 파일에 두면 DataGrid 가 커질수록 읽기 어려워진다.
 *
 * 빈 상태만은 `DataGrid` 와 **같은 계약**(`GridEmpty`)을 쓴다 — 두 그리드의 "없음" 이
 * 화면마다 달라 보이면 안 된다. 오버레이가 아니라 흐름 배치인 이유는 헤더도 고정 높이도
 * 없어서고, 로딩 상태를 받지 않는 이유는 `isFetching` 이 없어서다(호출부가 자체 Spinner 로 처리한다).
 *
 * **형제 순서 변경(선택 기능).** `onReorder` 를 주면 루트를 제외한 모든 행에 드래그 손잡이가 붙는다.
 * 재귀를 함수가 아니라 컴포넌트(`TreeGridNode`/`TreeGridBranch`)로 쓴 이유가 이것이다 — 형제 집합마다
 * 훅 인스턴스가 하나씩 필요한데 재귀 함수 안에서는 훅을 부를 수 없다.
 *
 * `onReorder` 를 주지 않으면 **가지 래퍼조차 만들지 않아 DOM 이 이전과 완전히 같다.**
 * 재정렬이 필요 없는 소비처(카테고리 트리 등)는 아무 영향도 받지 않는다.
 */

/** `empty` 를 생략했을 때의 문구 — `DataGrid.DEFAULT_EMPTY` 와 같은 규약이다. */
const DEFAULT_TREE_EMPTY: GridEmpty = { state: 'empty', title: '데이터가 없습니다' };

/**
 * 재귀 내내 그대로 흘러가는 값 묶음.
 *
 * 레벨마다 props 를 하나씩 늘어놓으면 노드가 깊어질수록 전달 코드가 불어난다 — 한 덩어리로 묶어
 * 그대로 내려보낸다.
 */
type TreeGridContext<T> = {
  readonly getRowId: (node: T) => string;
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly renderRow: (node: T, depth: number) => ReactNode;
  readonly collapseLabel: string;
  readonly expandLabel: string;
  readonly reorderHint: string;
  /** 재정렬이 꺼져 있으면 undefined — 이때는 훅이 있는 코드 경로를 **아예 지나지 않는다.** */
  readonly reorder?: {
    readonly onReorder: (parentId: string, next: readonly T[]) => void;
    readonly label: (node: T) => string;
    readonly announcement: (node: T, position: number, total: number) => string;
    readonly announce: (text: string) => void;
  };
};

/** 부모 가지가 자식 행에 내려주는 드래그 상태. 재정렬이 꺼져 있거나 루트면 null. */
type RowDrag = {
  readonly shift: number;
  readonly dragging: boolean;
  readonly handle: {
    readonly label: string;
    readonly ref: (element: HTMLButtonElement | null) => void;
    readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    readonly onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  };
};

/** 노드 하나 — 행과 (펼쳐져 있다면) 자식들. 래퍼 div 가 부모 가지의 측정 대상이다. */
function TreeGridNode<T extends { children?: readonly T[] }>({
  node,
  depth,
  ctx,
  row,
}: {
  readonly node: T;
  readonly depth: number;
  readonly ctx: TreeGridContext<T>;
  readonly row: RowDrag | null;
}) {
  const id = ctx.getRowId(node);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOpen = ctx.expanded.has(id);

  return (
    <div
      /* 드래그 중에는 배열을 바꾸지 않는다. 잡은 노드는 손을 따라가고(offsetY),
         나머지는 비켜날 만큼만(shiftFor). 배열은 놓을 때 한 번 바뀐다. */
      style={row && row.shift !== 0 ? { transform: `translateY(${row.shift}px)` } : undefined}
      className={
        row?.dragging
          ? // z 가 없으면 다음 행 배경에 덮여 떠 보이지 않는다. 배경을 칠하는 이유는 이 래퍼가
            // 자손 서브트리까지 통째로 들고 움직이기 때문이다(투명하면 아래가 비쳐 보인다).
            // transition 을 주지 않는다 — 손보다 늦게 따라와 고무줄처럼 늘어진다.
            'relative z-10 bg-dl-surface shadow-dl-menu'
          : row
            ? // 비켜나는 노드만 부드럽게 움직인다.
              'transition-transform duration-150'
            : undefined
      }
    >
      <div className="flex items-center gap-1 border-b border-dl-divider py-1.5">
        <span style={{ paddingLeft: depth * 16 }} className="flex items-center">
          {/*
            손잡이는 renderRow **밖**이다. 행 내용이 이미 <button> 인 소비처가 있어
            안에 넣으면 <button> 안 <button> 이 된다.
            거터에 두면 renderRow 의 버튼과 형제가 되고, paddingLeft 를 그대로 타므로
            같은 형제끼리 손잡이가 세로로 한 줄을 이룬다 — "여기를 잡으면 순서가 바뀐다"는 유일한 단서다.

            ⚠️ disabled 로 잠그지 않는다 — 드래그 도중 disabled 되면 포인터 캡처가 끊겨
               rAF 루프가 남고 자동 스크롤이 멈추지 않는다.
          */}
          {row?.handle && (
            <button
              type="button"
              ref={row.handle.ref}
              aria-label={row.handle.label}
              title={ctx.reorderHint}
              onPointerDown={row.handle.onPointerDown}
              onPointerMove={row.handle.onPointerMove}
              onPointerUp={row.handle.onPointerUp}
              onPointerCancel={row.handle.onPointerUp}
              onKeyDown={row.handle.onKeyDown}
              className={cn(
                // 셰브론 버튼과 **같은 구조**여야 한다: p-0.5(2px) + size-dl-ic-sm(16px) + p-0.5 = 20px.
                // 잎 노드 자리맞춤 span 이 그 20px 을 미러링하고 있어, 폭이 다르면 같은 depth 에서
                // 행마다 텍스트 시작점이 어긋난다.
                // touch-none 이 없으면 터치 기기에서 드래그가 스크롤로 가로채인다.
                'cursor-grab touch-none rounded-dl-badge p-0.5 text-dl-fg-muted hover:bg-dl-icon-hover',
                row.dragging && 'cursor-grabbing text-dl-tonal-fg',
              )}
            >
              <Icon icon={GripVertical} size="sm" />
            </button>
          )}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => ctx.onToggle(id)}
              aria-label={isOpen ? ctx.collapseLabel : ctx.expandLabel}
              aria-expanded={isOpen}
              className="rounded-dl-badge p-0.5 text-dl-fg-muted hover:bg-dl-icon-hover"
            >
              <Icon icon={ChevronRight} size="sm" className={isOpen ? 'rotate-90' : undefined} />
            </button>
          ) : (
            /* 토글 버튼과 같은 구조를 그대로 미러링한다 — p-0.5 + 아이콘 토큰.
               임의값(size-[22px])으로 두면 버튼 실측(2+16+2=20)과 2px 어긋나
               같은 depth 에서 잎 노드 텍스트가 부모보다 오른쪽으로 밀린다. */
            <span className="inline-block p-0.5">
              <span className="block size-dl-ic-sm" />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">{ctx.renderRow(node, depth)}</div>
      </div>

      {hasChildren && isOpen ? (
        ctx.reorder ? (
          <TreeGridBranch parentId={id} nodes={node.children ?? []} depth={depth + 1} ctx={ctx} />
        ) : (
          /* ★ 재정렬이 꺼져 있으면 가지 래퍼조차 만들지 않는다 —
             기존 소비처의 DOM 이 이전과 완전히 같아진다. */
          (node.children ?? []).map((child) => (
            <TreeGridNode
              key={ctx.getRowId(child)}
              node={child}
              depth={depth + 1}
              ctx={ctx}
              row={null}
            />
          ))
        )
      ) : null}
    </div>
  );
}

/**
 * 한 부모의 자식 목록 = 한 형제 집합.
 *
 * 재귀 함수 안에서는 훅을 부를 수 없어 컴포넌트로 쪼갰다. 그 대신 형제 경계가 DOM 컨테이너로
 * **물리적으로** 보장되므로 그룹 가두기가 필요 없다 — `groupOf: () => true` 다.
 * (평면 목록이었다면 불가능했다: 펼쳐진 자손이 형제 사이에 끼어들어 그룹 구간을 조각낸다.)
 *
 * 이 컴포넌트는 `ctx.reorder` 가 있을 때만 렌더된다. 조건부 렌더는 합법이고(조건부 훅과 다르다),
 * 덕분에 재정렬을 안 쓰는 소비처는 훅이 있는 경로를 아예 지나지 않는다.
 */
function TreeGridBranch<T extends { children?: readonly T[] }>({
  parentId,
  nodes,
  depth,
  ctx,
}: {
  readonly parentId: string;
  readonly nodes: readonly T[];
  readonly depth: number;
  readonly ctx: TreeGridContext<T>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // 트리는 스스로 스크롤하지 않는다 — 감싼 패널이 스크롤한다. 이걸 안 넘기면 휠로 스크롤한 뒤
  // 놓았을 때 스크롤한 만큼 엉뚱한 자리에 떨어진다.
  const scrollRef = useScrollParent(listRef);
  const handleRefs = useRef(new Map<string, HTMLButtonElement>());
  /** 키보드로 옮긴 직후 포커스를 되돌려 줄 노드. 재배열되면 DOM 이 새로 만들어진다. */
  const focusAfterMove = useRef<string | null>(null);
  const reorder = ctx.reorder;

  const drag = useListReorder<T>({
    items: nodes,
    onReorder: (next) => reorder?.onReorder(parentId, next),
    groupOf: () => true,
    listRef,
    scrollRef,
    onAnnounce: (from, to) => {
      const moved = nodes[from];
      if (!moved || !reorder) return;
      reorder.announce(reorder.announcement(moved, to + 1, nodes.length));
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
  }, [nodes]);

  const onHandleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : null;
    if (direction === null) return;

    event.preventDefault();
    const node = nodes[index];
    const moved = drag.moveByKeyboard(index, direction);
    if (moved !== index && node) focusAfterMove.current = ctx.getRowId(node);
  };

  return (
    /* ⚠️ 평범한 <div> 다. `display: contents` 는 박스를 만들지 않아
       getBoundingClientRect() 가 0 을 돌려주고 scrollTop 도 없다 — 훅이 좌표를 못 잰다. */
    <div ref={listRef}>
      {nodes.map((child, index) => {
        const dragging = drag.draggingIndex === index;
        const id = ctx.getRowId(child);

        return (
          <TreeGridNode
            key={id}
            node={child}
            depth={depth}
            ctx={ctx}
            row={{
              shift:
                drag.draggingIndex === null || drag.dropIndex === null
                  ? 0
                  : dragging
                    ? drag.offsetY
                    : shiftFor(index, drag.draggingIndex, drag.dropIndex, drag.rowHeight),
              dragging,
              handle: {
                label: reorder ? reorder.label(child) : '',
                ref: (element) => {
                  if (element) handleRefs.current.set(id, element);
                  else handleRefs.current.delete(id);
                },
                onPointerDown: (event) => drag.handlePointerDown(event, index),
                onPointerMove: drag.handlePointerMove,
                onPointerUp: drag.handlePointerUp,
                onKeyDown: (event) => onHandleKeyDown(event, index),
              },
            }}
          />
        );
      })}
    </div>
  );
}

export function TreeGrid<T extends { children?: readonly T[] }>({
  nodes,
  getRowId,
  expanded,
  onToggle,
  renderRow,
  empty,
  collapseLabel = '접기',
  expandLabel = '펼치기',
  onReorder,
  reorderLabel,
  reorderAnnouncement,
  reorderHint = '드래그 또는 ↑↓ 키로 이동',
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
  /**
   * 형제 순서 변경. 지정하면 **루트를 제외한** 모든 행에 드래그 손잡이가 붙는다.
   * 생략하면 손잡이도 가지 래퍼도 생기지 않아 DOM 이 이전과 완전히 같다.
   *
   * ⚠️ 루트(depth 0)는 대상이 아니다 — 재정렬 단위가 "부모의 자식 목록" 인데 루트에는 부모가 없다.
   *
   * 셋(`onReorder`·`reorderLabel`·`reorderAnnouncement`)을 **모두** 주어야 켜진다. 손잡이는
   * 아이콘 단독이라 이름이 없으면 빈 버튼이 되고, 이동 결과를 읽어 주지 않으면 화면을 못 보는
   * 사용자에게는 아무 일도 일어나지 않은 것과 같다.
   */
  readonly onReorder?: (parentId: string, next: readonly T[]) => void;
  /**
   * 손잡이 버튼의 **완성된 접근성 이름**. 아이콘 단독이라 없으면 빈 버튼이 된다.
   * 무엇을 하는 버튼인지까지 담아야 한다 — 노드 이름만 주면 "DEVTOOLS, 버튼" 으로만 읽힌다.
   */
  readonly reorderLabel?: (node: T) => string;
  /**
   * 이동 결과를 읽어 줄 문장. 여기는 사전을 모르므로 문구를 함수로 주입받는다.
   *
   * `reorderLabel` 이 아니라 **노드를 받는 이유**: 버튼 이름과 안내문은 필요한 문구가 다르다.
   * 버튼은 "DEVTOOLS 순서 변경" 이어야 하고 안내문은 "DEVTOOLS, 2번째로 이동" 이어야 하는데,
   * 하나를 돌려쓰면 "DEVTOOLS 순서 변경, 2번째로 이동" 처럼 역할이 중복돼 읽힌다.
   */
  readonly reorderAnnouncement?: (node: T, position: number, total: number) => string;
  /** 손잡이 툴팁. 화살표 키는 **알려주지 않으면 아무도 모른다.** */
  readonly reorderHint?: string;
}) {
  // 훅은 빈 상태 early return 보다 **먼저** 둔다 — 그래야 훅 순서가 고정된다.
  const [announcement, setAnnouncement] = useState('');
  const announce = (text: string) =>
    // 같은 문장이 연속으로 들어가면 aria-live 가 다시 읽지 않는다 — 끝에 공백을 번갈아 붙인다.
    setAnnouncement((previous) => (previous === text ? `${text} ` : text));

  if (nodes.length === 0) {
    return <GridEmptyContent empty={empty ?? DEFAULT_TREE_EMPTY} className="py-10" />;
  }

  const ctx: TreeGridContext<T> = {
    getRowId,
    expanded,
    onToggle,
    renderRow,
    collapseLabel,
    expandLabel,
    reorderHint,
    reorder:
      onReorder && reorderLabel && reorderAnnouncement
        ? {
            onReorder,
            label: reorderLabel,
            announcement: reorderAnnouncement,
            announce,
          }
        : undefined,
  };

  return (
    <div className="text-dl-sm">
      {/* 가지마다 두면 위젯 하나에 live region 이 N 개 생긴다. 그리고 **가지 래퍼 안에는
          절대 넣으면 안 된다** — 훅이 컨테이너의 직접 자식을 items 와 1:1 로 세기 때문이다. */}
      {ctx.reorder && (
        <output aria-live="polite" className="sr-only">
          {announcement}
        </output>
      )}
      {/* 루트 레벨에는 훅을 붙이지 않는다 — 부모가 없어 재정렬 단위가 성립하지 않는다. */}
      {nodes.map((node) => (
        <TreeGridNode key={getRowId(node)} node={node} depth={0} ctx={ctx} row={null} />
      ))}
    </div>
  );
}
