'use client';

import { type DateRange, DateTimeRangePicker } from '@hvy/ui';
import { useState } from 'react';

/**
 * 일시 기간 — 날짜 기간(공유 달력 1개)과 달리 **끝마다 자기 팝오버**다.
 * datetime 은 끝마다 날짜+시간 2차원이라 공유 팝업이 과밀해서다.
 * 타이핑·선택으로 순서가 뒤집히면(시작 > 종료) 두 값을 맞바꾼다.
 */
export function DateTimeRangeDemo() {
  const [range, setRange] = useState<DateRange>({
    start: '2026-08-01 00:00:00',
    end: '2026-08-12 23:59:00',
  });

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <DateTimeRangePicker
        start={range.start}
        end={range.end}
        onRangeChange={setRange}
        startName="collectedFrom"
        endName="collectedTo"
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
