'use client';

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { clampOffset, clampToGroup, findDropIndex, moveItem } from './listReorder';

/**
 * 포인터로 목록 항목을 끌어 순서를 바꾼다.
 *
 * **드래그 중에는 배열을 건드리지 않는다.** 잡은 항목은 `translateY` 로 손에 1:1로 붙어 움직이고,
 * 다른 항목만 비켜나며, 배열은 **놓을 때 한 번만** 바뀐다. dnd-kit 계열이 공통으로 쓰는 모델이다.
 *
 * 처음에는 `pointermove` 마다 실제 배열을 바꿨는데 두 가지가 동시에 망가졌다.
 *   · 판정 기준이 포인터 y 라, 스왑되는 순간 잡은 항목이 포인터 자리로 순간이동하고
 *     포인터는 여전히 경계 근처여서 **미세한 움직임에 다시 스왑돼 떨렸다.**
 *   · 잡은 항목이 손과 별개로 점프해 **무엇을 쥐고 있는지 눈으로 따라갈 수 없었다.**
 * 지금은 판정 기준이 **잡은 항목의 중심**이라, 다른 항목의 중심을 지나야 자리가 바뀐다 —
 * half-row 히스테리시스가 공짜로 생긴다.
 *
 * 라이브러리를 쓰지 않는 근거는 `claudedocs/기술스택-결정.md` 부록에 있다. 요지는
 * 여러 컨테이너 간 이동·중첩 트리처럼 **라이브러리가 강한 지점이 우리에게 없고**,
 * 반대로 우리 요구(그룹 경계 가두기)는 `clampToGroup` 한 줄로 끝난다는 것이다.
 *
 * `axis` 로 주축을 고른다(기본 `'y'` — 세로 목록). 가로 목록(작업 탭 바)은 `'x'` 를 넘긴다.
 * 순수 계산(listReorder.ts)은 좌표 배열만 다뤄 축을 모르고, 여기서 **측정만** 축을 탄다.
 * 반환 필드 이름(`offsetY`·`rowHeight`)은 첫 소비자(세로 컬럼 목록) 기준이라 그대로 두었다 —
 * `'x'` 에서는 각각 주축(x) 이동량과 항목 폭을 담는다.
 */

/** 가장자리 이 거리 안에서 자동 스크롤이 걸린다. */
const EDGE_ZONE_PX = 24;
/** 자동 스크롤 속도(프레임당 px). 손이 가장자리에 머무는 동안 계속 흐른다. */
const EDGE_SPEED_PX = 8;

type DragState = {
  readonly from: number;
  readonly startY: number;
  readonly startScrollTop: number;
  /** `pointerdown` 시점의 항목 중앙 y. **드래그 중 배열이 안 바뀌므로 끝까지 유효하다.** */
  readonly centers: readonly number[];
  readonly groups: readonly boolean[];
  readonly rowHeight: number;
  pointerY: number;
  frame: number;
  scrollFrame: number;
};

/** 지금 어떻게 그릴지. 이 훅이 배열 대신 내놓는 것이다. */
type DragView = {
  readonly from: number;
  readonly to: number;
  readonly offsetY: number;
  readonly rowHeight: number;
};

export function useListReorder<T>({
  items,
  onReorder,
  groupOf,
  listRef,
  onAnnounce,
  axis = 'y',
}: {
  readonly items: readonly T[];
  readonly onReorder: (next: readonly T[]) => void;
  /**
   * 항목이 속한 그룹. 같은 그룹 안에서만 움직인다.
   * 컬럼 설정에서는 `pinned` 여부다 — 고정열이 일반열 사이로 섞이면 표가 좌우로 갈라진다.
   * 그룹 구분이 필요 없으면 `() => true` 를 넘긴다.
   */
  readonly groupOf: (item: T) => boolean;
  /** 스크롤되는 목록 컨테이너. **자식 순서가 `items` 와 1:1이어야 한다.** */
  readonly listRef: RefObject<HTMLElement | null>;
  /** 이동이 확정될 때 호출된다(드래그·키보드 공통). 스크린리더 안내를 붙이는 자리다. */
  readonly onAnnounce?: (from: number, to: number) => void;
  /** 주축 — 세로 목록 `'y'`(기본) / 가로 목록(작업 탭 바 등) `'x'`. */
  readonly axis?: 'x' | 'y';
}): {
  /** 지금 끌고 있는 항목의 인덱스. 없으면 null. */
  readonly draggingIndex: number | null;
  /** 지금 놓으면 갈 자리. 드래그 중이 아니면 null. */
  readonly dropIndex: number | null;
  /** 잡은 항목의 `translateY` 값(px). */
  readonly offsetY: number;
  /** 비켜나는 항목이 움직일 거리 계산에 쓴다(`shiftFor`). */
  readonly rowHeight: number;
  readonly handlePointerDown: (event: ReactPointerEvent<HTMLElement>, index: number) => void;
  readonly handlePointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly handlePointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  /** 키보드 한 칸 이동. 옮겨진 인덱스를 돌려준다(포커스를 따라 보내기 위해). */
  readonly moveByKeyboard: (index: number, direction: -1 | 1) => number;
} {
  const [view, setView] = useState<DragView | null>(null);
  const drag = useRef<DragState | null>(null);

  // 축에 따라 갈리는 것은 **측정뿐**이다 — 상태 필드 이름(startY 등)은 주축 좌표를 담는다.
  const isX = axis === 'x';

  // 최신 값을 rAF 콜백에서 읽는다 — 클로저로 잡으면 한 프레임 늦은 값을 본다.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onAnnounceRef = useRef(onAnnounce);
  onAnnounceRef.current = onAnnounce;

  /** 드래그 중 커서. 포인터 캡처 중에는 아래 요소의 커서가 이겨서 신호가 사라진다. */
  useEffect(() => {
    if (!view) return;
    const previous = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    return () => {
      document.body.style.cursor = previous;
    };
  }, [view]);

  /**
   * 손의 위치에서 "잡은 항목의 이동량"과 "지금 놓으면 갈 자리"를 구한다.
   *
   * `centers` 는 `pointerdown` 시점의 **뷰포트** 좌표다. 자동 스크롤이 돌면 항목이 전부 밀리므로
   * 스크롤 변화량을 더해 보정한다 — 시각(`translateY`)과 판정이 같은 값을 쓰므로 한 줄로 끝난다.
   */
  const resolve = useCallback(
    (state: DragState): { offsetY: number; to: number } => {
      const list = listRef.current;
      const scrollDelta = list
        ? (isX ? list.scrollLeft : list.scrollTop) - state.startScrollTop
        : 0;

      /**
       * ⚠️ **가두지 않으면 자동 스크롤이 폭주한다.**
       * transform 으로 내려간 항목이 컨테이너의 `scrollHeight` 를 늘리기 때문에
       * (스크롤 영역은 transform 적용 후 계산된다),
       * 스크롤 → `offsetY` 증가 → 더 내려감 → 스크롤 여지 증가 → … 의 고리가 닫힌다.
       */
      const offsetY = clampOffset(
        state.centers,
        state.groups,
        state.from,
        state.pointerY - state.startY + scrollDelta,
      );

      // ⚠️ 포인터 y 가 아니라 **잡은 항목의 중심**으로 판정한다. 이게 떨림을 막는 핵심이다.
      const center = (state.centers[state.from] ?? 0) + offsetY;
      const to = clampToGroup(state.groups, state.from, findDropIndex(state.centers, center));
      return { offsetY, to };
    },
    [listRef, isX],
  );

  const redraw = useCallback(() => {
    const state = drag.current;
    if (!state) return;
    const { offsetY, to } = resolve(state);

    setView((previous) =>
      previous && previous.to === to && previous.offsetY === offsetY
        ? previous
        : { from: state.from, to, offsetY, rowHeight: state.rowHeight },
    );
  }, [resolve]);

  /**
   * 가장자리 자동 스크롤. 없으면 스크롤되는 목록에서 먼 거리 이동이 아예 불가능해진다
   * (손이 목록 밖으로 나가면 더 갈 곳이 없다).
   */
  const stepScroll = useCallback(() => {
    const state = drag.current;
    const list = listRef.current;
    if (!state || !list) return;

    const rect = list.getBoundingClientRect();
    const overStart = state.pointerY - ((isX ? rect.left : rect.top) + EDGE_ZONE_PX);
    const overEnd = state.pointerY - ((isX ? rect.right : rect.bottom) - EDGE_ZONE_PX);

    let delta = 0;
    if (overStart < 0) delta = -EDGE_SPEED_PX;
    else if (overEnd > 0) delta = EDGE_SPEED_PX;

    if (delta !== 0) {
      const before = isX ? list.scrollLeft : list.scrollTop;
      if (isX) list.scrollLeft += delta;
      else list.scrollTop += delta;
      // 손이 멈춰 있어도 스크롤이 움직이면 잡은 항목은 계속 손을 따라가야 한다.
      if ((isX ? list.scrollLeft : list.scrollTop) !== before) redraw();
    }

    state.scrollFrame = requestAnimationFrame(stepScroll);
  }, [redraw, listRef, isX]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, index: number) => {
      // 보조 버튼(우클릭 등)만 차단한다. `!== 0` 이면 안 되는 이유: 임계 거리 방식
      // (WorkTabsBar)은 **pointermove 이벤트**로 이 함수를 부르는데 move 의 button 은 -1 이다.
      if (event.button > 0) return;
      const list = listRef.current;
      if (!list) return;

      // 텍스트 선택·드래그 고스트를 막는다. 다만 이러면 브라우저 기본 포커스도 막히므로
      // 아래에서 직접 포커스를 준다 — 안 하면 놓자마자 키보드 조작이 죽는다.
      event.preventDefault();
      event.currentTarget.focus();

      /**
       * 포인터 캡처는 **부가 기능**이다 — 손이 목록 밖으로 나가도 이벤트를 계속 받기 위한 것이지
       * 드래그의 전제가 아니다. 그런데 포인터가 이미 사라졌거나 다른 요소에 잡혀 있으면
       * `NotFoundError` 를 던지고, 그러면 아래 상태 설정이 통째로 건너뛰어져
       * **드래그가 시작조차 안 된다.** 실패해도 드래그는 살려 둔다.
       */
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // 캡처 없이 진행한다. 손이 목록 밖으로 나가면 그때 이벤트가 끊길 뿐이다.
      }

      const rows = Array.from(list.children);
      const centers = rows.map((row) => {
        const rect = row.getBoundingClientRect();
        return isX ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      });
      const grabbedRect = rows[index]?.getBoundingClientRect();
      const rowHeight = (isX ? grabbedRect?.width : grabbedRect?.height) ?? 0;
      const pointer = isX ? event.clientX : event.clientY;

      drag.current = {
        from: index,
        startY: pointer,
        startScrollTop: isX ? list.scrollLeft : list.scrollTop,
        centers,
        groups: itemsRef.current.map(groupOf),
        rowHeight,
        pointerY: pointer,
        frame: 0,
        scrollFrame: 0,
      };
      setView({ from: index, to: index, offsetY: 0, rowHeight });
      drag.current.scrollFrame = requestAnimationFrame(stepScroll);
    },
    [groupOf, listRef, stepScroll, isX],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = drag.current;
      if (!state) return;
      state.pointerY = isX ? event.clientX : event.clientY;

      // `pointermove` 는 한 프레임에 여러 번 온다 — 프레임당 한 번만 다시 그린다.
      if (state.frame !== 0) return;
      state.frame = requestAnimationFrame(() => {
        const current = drag.current;
        if (!current) return;
        current.frame = 0;
        redraw();
      });
    },
    [redraw, isX],
  );

  /**
   * 드래그를 끝낸다. **멱등이다** — 손잡이와 `window` 두 경로가 함께 들어올 수 있다.
   */
  const finishDrag = useCallback(() => {
    const state = drag.current;
    if (!state) return;

    if (state.frame !== 0) cancelAnimationFrame(state.frame);
    if (state.scrollFrame !== 0) cancelAnimationFrame(state.scrollFrame);

    /**
     * 놓은 자리는 **대기 중인 프레임이 아니라 지금 좌표에서** 다시 구한다.
     * 빠르게 끌었다 놓으면(한 프레임 안에 down→move→up) 아직 실행되지 않은 프레임이 있는데,
     * 그걸 그냥 취소하면 이동이 통째로 사라진다.
     */
    const { to } = resolve(state);
    const from = state.from;

    drag.current = null;
    // 배열 변경과 transform 제거가 **한 렌더에** 반영된다(React 자동 배칭) — 깜빡임이 없다.
    setView(null);
    if (to !== from) {
      onReorderRef.current(moveItem(itemsRef.current, from, to));
      onAnnounceRef.current?.(from, to);
    }
  }, [resolve]);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      finishDrag();
    },
    [finishDrag],
  );

  /**
   * **종료 경로를 하나 더 둔다.**
   *
   * 손잡이의 React 이벤트만으로 끝내면, 그게 도달하지 않는 순간 rAF 루프를 끊을 사람이
   * 아무도 없다 — 손을 뗐는데도 자동 스크롤이 계속되는 사고가 실제로 났다.
   * 포인터 캡처 실패 · 모달 밖 릴리즈 · 이벤트 유실이 전부 여기로 수렴하므로,
   * 드래그 중에는 `window` 도 함께 듣는다.
   */
  useEffect(() => {
    if (!view) return;
    const end = () => finishDrag();
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [view, finishDrag]);

  // 드래그 도중 모달이 닫히면 rAF 루프가 살아남는다 — 반드시 끊는다.
  useEffect(
    () => () => {
      const state = drag.current;
      if (!state) return;
      if (state.frame !== 0) cancelAnimationFrame(state.frame);
      if (state.scrollFrame !== 0) cancelAnimationFrame(state.scrollFrame);
      drag.current = null;
    },
    [],
  );

  const moveByKeyboard = useCallback(
    (index: number, direction: -1 | 1) => {
      const list = itemsRef.current;
      const groups = list.map(groupOf);
      const target = clampToGroup(groups, index, index + direction);
      if (target === index) return index;

      onReorderRef.current(moveItem(list, index, target));
      onAnnounceRef.current?.(index, target);
      return target;
    },
    [groupOf],
  );

  return {
    draggingIndex: view?.from ?? null,
    dropIndex: view?.to ?? null,
    offsetY: view?.offsetY ?? 0,
    rowHeight: view?.rowHeight ?? 0,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    moveByKeyboard,
  };
}
