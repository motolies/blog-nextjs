'use client';

import { type DateRange, DateTimeRangePicker } from '@hvy/ui';
import { useState } from 'react';

/**
 * 좁은 컨테이너(325px — iPhone SE 관리자 검색 패널의 가용 폭)에서도 **한 줄**.
 * 셸이 약 316px 라 들어가고, 폭 분기 없이 더 좁아지면 줄바꿈 대신 입력 안에서 글자가 밀린다.
 * 검색 필드와 같은 조합(size sm · precision minute)으로 둔다 — 회귀 실측의 기준 화면이다.
 */
export function DateTimeRangePickerNarrowDemo() {
  const [range, setRange] = useState<DateRange>({
    start: '2026-09-02 00:00',
    end: '2026-09-02 23:59',
  });

  return (
    <div className="flex w-[325px] flex-col gap-2 rounded-dl-container border border-dl-border border-dashed p-2">
      <DateTimeRangePicker
        size="sm"
        precision="minute"
        start={range.start}
        end={range.end}
        onRangeChange={setRange}
      />
      <p className="text-dl-fg-muted text-dl-xs">325px 상자 · size sm · precision minute</p>
    </div>
  );
}
