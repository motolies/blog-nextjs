'use client';

import { type DateRange, type DateRangePreset, DateTimeRangePicker, presetRange } from '@hvy/ui';
import { useState } from 'react';

/**
 * datetime 기간 프리셋 — 같은 `presetRange` 산식을 재사용한다.
 * 날짜만 있는 프리셋은 하루 전체(시작 00:00:00 · 종료 23:59:59)로 넓혀진다 —
 * 넓히는 규칙은 `toDateTimeRange`(ui) 가 갖고, 컴포넌트가 내부에서 적용한다.
 */
const PRESETS: readonly DateRangePreset[] = [
  { label: '오늘', range: (today) => presetRange('today', today) },
  { label: '최근 7일', range: (today) => presetRange('last7', today) },
  { label: '이번 달', range: (today) => presetRange('thisMonth', today) },
];

export function DateTimeRangePickerPresetsDemo() {
  const [range, setRange] = useState<DateRange>({ start: '', end: '' });
  return (
    <div className="flex flex-col gap-2">
      <DateTimeRangePicker
        start={range.start}
        end={range.end}
        onRangeChange={setRange}
        presets={PRESETS}
      />
      <p className="text-dl-fg-muted text-dl-xs">
        값: {range.start || '—'} ~ {range.end || '—'}
      </p>
    </div>
  );
}
