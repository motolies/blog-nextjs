'use client';

import { DatePicker } from '@hvy/ui';
import { useState } from 'react';

/** 단일 날짜 — controlled 로 값을 보여준다. clearable 이라 값이 있으면 달력 버튼 왼쪽에 × 가 뜬다. */
export function DatePickerBasicDemo() {
  const [value, setValue] = useState('');

  return (
    <div className="flex max-w-80 flex-col gap-3">
      <DatePicker value={value} onValueChange={setValue} name="orderDate" clearable />
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

/**
 * lock(boolean) — 시스템 채움 영구 불변. readOnly 로 잠기고 **달력 버튼 자리가
 * 자물쇠 표식으로 스왑**된다(눌리지 않는 버튼은 어포던스가 거짓이다). 값은 전송된다.
 * 전송까지 막아야 하면 lock 이 아니라 mode="disabled" 다 — 세 번째 칸이 그 대비다.
 */
export function DatePickerLockDemo() {
  return (
    <div className="flex max-w-80 flex-col gap-3">
      <DatePicker defaultValue="2026-08-12" lock placeholder="자동 / 저장 시 발급" />
      <DatePicker lock placeholder="자동 / 저장 시 발급" />
      <DatePicker defaultValue="2026-08-12" mode="disabled" />
    </div>
  );
}
