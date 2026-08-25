'use client';

import { Calendar } from '@hvy/ui';

/**
 * min / max — 경계 밖은 눌리지 않는다.
 *
 * 판정은 문자열 비교 하나로 끝난다(`iso < min`) — ISO 형식을 값의 계약으로 고른 이유이자
 * 이 컴포넌트에 날짜 라이브러리가 없는 이유이고, 타임존 문제가 없는 이유이기도 하다.
 *
 * 검증 포인트:
 * · 경계 밖 날짜는 label-disabled 배색이고 **hover 배경도 뜨지 않는다** —
 *   눌리지 않는 것에 어포던스를 주지 않는다
 * · 경계는 **포함**이다: min 당일(7/10)과 max 당일(7/20)은 눌린다
 * · 세 칸을 나란히 두고 min 만 · max 만 · 양쪽 다인 경우를 비교한다
 */
export function CalendarBoundsDemo() {
  return (
    <div className="flex flex-wrap gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-dl-xs font-semibold text-dl-fg-strong">min="2026-07-10" 만</span>
        <Calendar min="2026-07-10" initialFocus="2026-07-15" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-dl-xs font-semibold text-dl-fg-strong">max="2026-07-20" 만</span>
        <Calendar max="2026-07-20" initialFocus="2026-07-15" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-dl-xs font-semibold text-dl-fg-strong">양쪽 — 10일 ~ 20일</span>
        <Calendar min="2026-07-10" max="2026-07-20" initialFocus="2026-07-15" />
      </div>
    </div>
  );
}
