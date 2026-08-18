'use client';

import { NumberInput } from '@hvy/ui';
import { useState } from 'react';

/**
 * 스텝퍼 버튼(−/+) — 키보드 ↑/↓ 와 같은 nudge 경로를 지난다(min/max 클램프 동일).
 * tabIndex -1 이라 탭 순서를 더럽히지 않는다 — 키보드 사용자는 입력 안에서 ↑/↓ 를 쓴다.
 */
export function NumberInputStepperDemo() {
  const [qty, setQty] = useState<number | null>(1);
  return (
    <div className="flex max-w-xs flex-col gap-2">
      <NumberInput value={qty} onValueChange={setQty} stepper min={0} max={99} align="left" />
      <p className="text-dl-fg-muted text-dl-xs">min 0 · max 99 — 경계에서 클램프된다.</p>
    </div>
  );
}
