'use client';

import { type DateRange, DateRangePicker, type DateRangePreset, presetRange } from '@hvy/ui';
import { useState } from 'react';

/**
 * 기간 프리셋 — 산식은 `presetRange`(ui, 정책 중앙화), 라벨은 앱이 붙인다
 * (ui 는 사전을 모른다 — PagerLabels 와 같은 규약).
 * range 를 함수로 주면 클릭 시점의 오늘로 계산한다 — 화면을 밤새 열어둬도 맞다.
 */
const PRESETS: readonly DateRangePreset[] = [
  { label: '오늘', range: (today) => presetRange('today', today) },
  { label: '최근 7일', range: (today) => presetRange('last7', today) },
  { label: '최근 30일', range: (today) => presetRange('last30', today) },
  { label: '이번 달', range: (today) => presetRange('thisMonth', today) },
  { label: '지난달', range: (today) => presetRange('lastMonth', today) },
];

export function DateRangePickerPresetsDemo() {
  const [range, setRange] = useState<DateRange>({ start: '', end: '' });
  return (
    <div className="flex max-w-xl flex-col gap-2">
      <DateRangePicker
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
