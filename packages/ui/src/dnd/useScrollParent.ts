'use client';

import { type RefObject, useEffect, useRef } from 'react';

/**
 * `ref` 요소를 실제로 스크롤하는 **조상**을 찾아 ref 로 돌려준다.
 *
 * `useListReorder` 는 기본적으로 목록 컨테이너 자신이 스크롤러라고 본다. 그 가정이 맞지 않는
 * 배치가 있다 — 트리가 그렇다. 트리는 스스로 스크롤하지 않고 트리를 감싼 패널이 스크롤한다.
 * 그대로 두면 `scrollTop` 이 늘 0 이라 스크롤 보정항이 죽고, **휠로 스크롤한 뒤 놓으면
 * 스크롤한 만큼 엉뚱한 자리에 떨어진다.**
 *
 * 못 찾으면 `null` 을 담아 둔다 — 훅이 `listRef` 로 폴백하므로 기존 동작 그대로다.
 *
 * 탐색은 **마운트 시 한 번**만 한다. 스크롤 컨테이너가 도중에 바뀌는 배치는 없고,
 * 매 렌더 `getComputedStyle` 로 조상을 훑는 비용이 트리처럼 노드가 많은 화면에서 커진다.
 *
 * 배럴로 내보내지 않는다 — 컴포넌트 레지스트리 검사가 "export 는 전부 등록" 을 요구하는데
 * 이건 화면에 그려지는 것이 아니라 내부 배선 도구다.
 */
export function useScrollParent(
  ref: RefObject<HTMLElement | null>,
  axis: 'x' | 'y' = 'y',
): RefObject<HTMLElement | null> {
  const scroller = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let element = ref.current?.parentElement ?? null;

    while (element) {
      const style = getComputedStyle(element);
      const overflow = axis === 'x' ? style.overflowX : style.overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        scroller.current = element;
        return;
      }
      element = element.parentElement;
    }

    scroller.current = null;
  }, [ref, axis]);

  return scroller;
}
