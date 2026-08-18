'use client';

import { DateTimePicker } from '@hvy/ui';
import { useState } from 'react';

/** 단일 일시 — 달력에서 날짜, 오른쪽 리스트에서 시·분. 팝업은 [확인]·외부 클릭으로 닫는다. */
export function DateTimeBasicDemo() {
  const [value, setValue] = useState('');

  return (
    <div className="flex max-w-96 flex-col gap-3">
      <DateTimePicker value={value} onValueChange={setValue} name="collectedAt" />
      <p className="text-dl-sm text-dl-fg-muted">
        값: <code className="font-dl-mono">{value === '' ? '(비어 있음)' : value}</code>
      </p>
      <p className="text-dl-xs text-dl-fg-subtle">
        타이핑 규칙: <code className="font-dl-mono">2026-12-31 14:30</code> → 초 00 부착,{' '}
        <code className="font-dl-mono">20261231 1430</code> 압축형 허용, 날짜만 치면{' '}
        <code className="font-dl-mono">00:00:00</code>. 무효 입력은 이전 값으로 되돌아간다.
      </p>
    </div>
  );
}

/**
 * 분 정밀도 — 값이 `YYYY-MM-DD HH:mm` 이 된다. 타이핑된 초는 절삭.
 * ⚠️ 이 꼴은 백엔드 역직렬화기가 직접 받지 못하므로(HH:mm 수용 패턴 없음)
 * zod/contracts 에서 `:00` 을 붙이는 자리에서만 쓴다.
 */
export function DateTimeMinuteDemo() {
  const [value, setValue] = useState('2026-08-13 09:30');

  return (
    <div className="flex max-w-96 flex-col gap-3">
      <DateTimePicker precision="minute" value={value} onValueChange={setValue} />
      <p className="text-dl-sm text-dl-fg-muted">
        값: <code className="font-dl-mono">{value === '' ? '(비어 있음)' : value}</code>
      </p>
      <p className="text-dl-xs text-dl-fg-subtle">
        <code className="font-dl-mono">12:30:45</code> 를 타이핑해도 초는 절삭되어{' '}
        <code className="font-dl-mono">12:30</code> 이 된다.
      </p>
    </div>
  );
}

/** 잠금 — Input 의 FieldLock 규칙 그대로, 팝업 버튼도 함께 잠긴다. */
export function DateTimeLockDemo() {
  return (
    <div className="flex max-w-96 flex-col gap-3">
      <DateTimePicker defaultValue="2026-08-12 09:00:00" lock="readonly" />
      <DateTimePicker defaultValue="2026-08-12 09:00:00" lock="disabled" />
    </div>
  );
}
