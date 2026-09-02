'use client';

import { type DateRange, DateTimeRangePicker } from '@hvy/ui';
import { useState } from 'react';

/**
 * 일시 기간 — 테두리 하나 안에 양끝 입력과 달력 버튼 하나. 팝오버 하나에서 시작/종료 탭으로 오간다.
 * 타이핑이든 팝오버 선택이든 순서가 뒤집히면(시작 > 종료) 두 값을 맞바꾼다 —
 * 판정은 DateRangePicker 와 같은 `orderRange` 를 쓰고, 그때 편집 중인 탭도 값을 따라 옮긴다.
 */
export function DateTimeRangePickerBasicDemo() {
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
