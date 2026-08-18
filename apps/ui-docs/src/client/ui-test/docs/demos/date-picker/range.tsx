'use client';

import { type DateRange, DateRangePicker } from '@hvy/ui';
import { useState } from 'react';

/**
 * 기간 선택 — 달력에서 첫 클릭이 시작, 둘째 클릭이 종료다.
 * 시작보다 앞을 찍으면 그 날짜로 다시 시작하고, 타이핑으로 순서가 뒤집히면 맞바꾼다.
 */
export function DateRangeBasicDemo() {
  const [range, setRange] = useState<DateRange>({ start: '2026-08-01', end: '2026-08-12' });

  return (
    <div className="flex max-w-lg flex-col gap-3">
      <DateRangePicker
        start={range.start}
        end={range.end}
        onRangeChange={setRange}
        startName="orderDateFrom"
        endName="orderDateTo"
      />
      <p className="text-dl-sm text-dl-fg-muted">
        값:{' '}
        <code className="font-dl-mono">
          {range.start || '(없음)'} ~ {range.end || '(없음)'}
        </code>
      </p>
    </div>
  );
}
