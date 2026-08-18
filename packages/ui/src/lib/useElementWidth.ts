'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * 엘리먼트의 가시 폭(`clientWidth`)을 관측한다.
 *
 * **왜 필요한가**: 남는 폭을 컬럼에 분배하려면(`grow`) 지금 화면에 몇 px 이 남았는지를
 * **숫자로** 알아야 한다. CSS 만으로는 고정열의 `left` 오프셋을 함께 맞출 수 없다 —
 * 오프셋은 앞 컬럼 폭의 누적합이라 JS 가 같은 값을 알아야 한다.
 *
 * `offsetWidth` 가 아니라 `clientWidth` 를 쓴다: 세로 스크롤바 폭을 뺀 값이라야
 * 컬럼 합이 정확히 들어맞고, 가로 스크롤바가 생겼다 사라졌다 하지 않는다.
 *
 * SSR 에서는 0 이다. 호출부는 **0 을 "아직 측정 전"으로 다뤄야 한다** —
 * 0 을 폭으로 믿고 계산하면 하이드레이션 직전에 표가 한 번 찌그러진다.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const next = element.clientWidth;
      // 1px 이하 변화는 무시한다. 폭 변경이 스크롤바 유무를 바꾸고 그게 다시 폭을 바꾸는
      // 왕복이 생길 수 있는데, 이 문턱이 그 진동을 끊는다.
      setWidth((prev) => (Math.abs(prev - next) <= 1 ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
