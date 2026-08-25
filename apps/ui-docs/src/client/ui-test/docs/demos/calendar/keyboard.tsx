'use client';

import { Calendar } from '@hvy/ui';
import { useState } from 'react';

/**
 * 로빙 포커스 — 그리드 안에서 Tab 이 **한 번만** 걸린다.
 *
 * 42칸이 전부 tabIndex=0 이면 Tab 으로 그리드를 지나가는 데만 42번이 걸린다.
 * 그래서 활성 칸 하나만 0 이고 나머지는 -1 이며, 방향키가 그 하나를 옮긴다.
 *
 * 검증 포인트:
 * · Tab 한 번으로 그리드에 들어오고 **한 번 더 누르면 나간다**(아래 입력칸으로 이동)
 * · ←→ 는 ±1일, ↑↓ 는 ±7일, PageUp/PageDown 은 ±1개월
 * · 달 경계를 넘으면 **표시 달이 따라 바뀐다** — 안 따라가면 포커스가 화면 밖 칸에 남는다
 * · 마우스만 쓰는 동안에는 포커스가 따라오지 않는다(그리드 안에 포커스가 있을 때만 옮긴다 —
 *   마우스 사용자를 방해하지 않는 조건이다)
 * · 월 표시가 `aria-live="polite"` 라 달을 넘기면 스크린리더가 읽는다
 */
export function CalendarKeyboardDemo() {
  const [value, setValue] = useState('2026-07-15');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-dl-xs text-dl-fg-muted">
        아래 입력칸을 클릭한 뒤 <b>Shift+Tab</b> 으로 그리드에 들어가 방향키를 눌러 보세요.
      </p>
      <Calendar value={value} onSelect={setValue} />
      <input
        type="text"
        readOnly
        value={`선택: ${value}`}
        aria-label="Tab 이동 확인용 입력칸"
        className="dl-field dl-size-sm w-48"
      />
    </div>
  );
}
