'use client';

import {
  type DateRange,
  type DateRangePreset,
  DateTimeRangePicker,
  presetDateTimeRange,
  presetRange,
} from '@hvy/ui';
import { useState } from 'react';

/**
 * datetime 기간 프리셋 — 두 갈래를 섞어 쓴다.
 *
 * "24시간"만 `presetDateTimeRange` 산출물이라 **시각을 직접 담고**, 나머지는
 * `presetRange`(날짜)를 그대로 써서 하루 전체(시작 00:00:00 · 종료 23:59:59)로 넓혀진다.
 * 넓히는 규칙은 `toDateTimeRange`(ui) 가 갖고 컴포넌트가 내부에서 적용하는데,
 * 이미 시각이 있는 값은 손대지 않으므로 두 갈래가 한 배열에 공존한다.
 */
const PRESETS: readonly DateRangePreset[] = [
  { label: '24시간', range: (now) => presetDateTimeRange('last24h', now) },
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
