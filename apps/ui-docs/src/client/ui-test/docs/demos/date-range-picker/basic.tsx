'use client';

import { type DateRange, DateRangePicker } from '@hvy/ui';
import { useState } from 'react';

/**
 * 기간 선택 — **양끝 모두 달력 버튼**을 가지고 달력은 하나를 공유한다.
 * 누른 버튼이 곧 지금 정할 칸이고, 반대편이 비어 있을 때만 팝오버를 닫지 않고
 * 그쪽으로 넘어간다 — 빈 상태에서 두 번 클릭하면 기간이 완성되고, 이미 채워진
 * 기간에서는 누른 칸 하나만 바뀐다.
 *
 * 순서가 뒤집히면(시작 > 종료) **달력이든 타이핑이든** 두 값을 맞바꾼다.
 */
export function DateRangePickerBasicDemo() {
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

/**
 * 빈 기간에서 시작 — 어느 쪽 아이콘을 눌러도 그쪽부터 고른다.
 * 시작 쪽으로 열면 첫 클릭이 시작일, 종료 쪽으로 열면 첫 클릭이 종료일이고,
 * 두 경우 모두 반대편이 비어 있으므로 팝오버가 열린 채 이어진다.
 */
export function DateRangePickerEmptyDemo() {
  const [range, setRange] = useState<DateRange>({ start: '', end: '' });

  return (
    <div className="flex max-w-lg flex-col gap-3">
      <DateRangePicker start={range.start} end={range.end} onRangeChange={setRange} />
      <p className="text-dl-sm text-dl-fg-muted">
        값:{' '}
        <code className="font-dl-mono">
          {range.start || '(없음)'} ~ {range.end || '(없음)'}
        </code>
      </p>
    </div>
  );
}

/** 경계 — min/max 밖은 달력에서 비활성이다. 타이핑 값은 서버 검증이 막는다. */
export function DateRangePickerBoundsDemo() {
  return (
    <div className="max-w-lg">
      <DateRangePicker
        defaultStart="2026-08-10"
        defaultEnd="2026-08-20"
        min="2026-08-01"
        max="2026-08-31"
      />
    </div>
  );
}

/**
 * lock(boolean) — 양끝 입력이 readOnly 로 잠기고 **달력 버튼 두 개가 모두 자물쇠 표식**으로
 * 스왑된다(값은 두 이름 모두 전송된다). 전송까지 막는 쪽은 mode="disabled" — 아래 행이 그 대비다.
 */
export function DateRangePickerLockDemo() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-dl-xs font-semibold text-dl-fg-muted">lock</p>
        <DateRangePicker lock defaultStart="2026-08-01" defaultEnd="2026-08-18" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-dl-xs font-semibold text-dl-fg-muted">mode=&quot;disabled&quot;</p>
        <DateRangePicker mode="disabled" defaultStart="2026-08-01" defaultEnd="2026-08-18" />
      </div>
    </div>
  );
}
