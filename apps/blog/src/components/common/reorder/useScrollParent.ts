'use client';

import { type RefObject, useEffect, useRef } from 'react';

/**
 * `ref` 요소를 실제로 스크롤하는 **조상**을 찾아 ref 로 돌려준다.
 *
 * `useListReorder` 는 목록 컨테이너 자신이 스크롤러라고 보고 `scrollRef ?? listRef` 로 폴백한다.
 * 즐겨찾기 관리는 그 가정이 맞지 않는다 — `<ul>` 은 스크롤하지 않고 어드민 본문
 * (`.contentWrapper`, overflow-y:auto)이 스크롤한다. 그대로 두면 `scrollTop` 이 늘 0 이라
 * 자동 스크롤이 아무 일도 하지 않고(모바일에서 항목을 화면 밖으로 옮길 수 없다),
 * 스크롤 보정항도 죽어 **스크롤한 뒤 놓으면 그만큼 엉뚱한 자리에 떨어진다.**
 *
 * `@hvy/ui` 에 같은 훅이 있으나 배럴로 내보내지 않는다 — 그 파일 주석이 밝히듯
 * "컴포넌트 레지스트리 검사가 export 는 전부 등록을 요구하는데 이건 화면에 그려지는 것이
 * 아니라 내부 배선 도구"이기 때문이다. 그래서 앱이 동등 구현을 갖는다
 * (packages/ui 의 Primitive/Composite 경계에서 Composite 쪽 처리와 같은 결정).
 *
 * 못 찾으면 `null` 을 담아 둔다 — 훅이 `listRef` 로 폴백하므로 기존 동작 그대로다.
 * 탐색은 마운트 시 한 번만 한다 — 스크롤 컨테이너가 도중에 바뀌는 배치가 없고,
 * 매 렌더 `getComputedStyle` 로 조상을 훑는 비용이 크다.
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
