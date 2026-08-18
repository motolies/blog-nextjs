'use client';

import { DatePicker } from '@hvy/ui';
import { useState } from 'react';

/** 단일 날짜 — controlled 로 값을 보여주고, min/max 로 달력의 선택 가능 범위를 좁힌다. */
export function DatePickerBasicDemo() {
  const [value, setValue] = useState('');

  return (
    <div className="flex max-w-80 flex-col gap-3">
      <DatePicker value={value} onValueChange={setValue} name="orderDate" />
      <p className="text-dl-sm text-dl-fg-muted">
        값: <code className="font-dl-mono">{value === '' ? '(비어 있음)' : value}</code>
      </p>
      <p className="text-dl-xs text-dl-fg-subtle">
        타이핑도 된다 — <code className="font-dl-mono">20261231</code>·
        <code className="font-dl-mono">2026.12.31</code> 처럼 쳐도 blur/Enter 에서{' '}
        <code className="font-dl-mono">YYYY-MM-DD</code> 로 정규화된다.
      </p>
    </div>
  );
}

/** min/max — 이번 달 1일부터 오늘까지만 고를 수 있는 달력. */
export function DatePickerBoundsDemo() {
  const now = new Date();
  const pad = (n: number) => `${n}`.padStart(2, '0');
  const monthFirst = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const [value, setValue] = useState(today);

  return (
    <div className="flex max-w-80 flex-col gap-3">
      <DatePicker value={value} onValueChange={setValue} min={monthFirst} max={today} />
      <p className="text-dl-sm text-dl-fg-muted">
        {monthFirst} ~ {today} 만 선택 가능 — 밖의 날짜는 달력에서 비활성이다.
      </p>
    </div>
  );
}

/** 잠금 3종 — 배색은 Input 과 같은 dl-field-locked, 달력 버튼도 함께 잠긴다. */
export function DatePickerLockDemo() {
  return (
    <div className="flex max-w-80 flex-col gap-3">
      <DatePicker defaultValue="2026-08-12" lock="auto" placeholder="자동 / 저장 시 발급" />
      <DatePicker defaultValue="2026-08-12" lock="readonly" />
      <DatePicker defaultValue="2026-08-12" lock="disabled" />
    </div>
  );
}
