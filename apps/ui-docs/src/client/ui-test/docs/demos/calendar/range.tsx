'use client';

import { Button, Calendar } from '@hvy/ui';
import { useState } from 'react';

/**
 * 범위 강조 — 양끝과 사이가 다르게 그려진다.
 *
 * 범위 강조는 **표시일 뿐**이고, 클릭을 어떻게 start/end 로 해석할지는 호출부가 정한다
 * (DateRangePicker 가 그 해석을 갖는다). 여기서는 아래 버튼으로 상태를 만들어 본다.
 *
 * 검증 포인트:
 * · 양끝은 primary 채움, 사이는 tonal 이다
 * · 사이 칸만 라운드가 없어 **띠가 끊기지 않고 이어진다** — 라운드를 주면 칸마다 잘려 보인다
 * · start > end 로 뒤집힌 범위를 만들면 띠를 그리지 않는다(start <= end 를 요구한다 —
 *   ISO 문자열이라 사전순 비교가 곧 날짜 비교다)
 * · start 만 있고 end 가 없는 "고르는 중" 상태에서는 시작점만 강조된다
 */
const CASES = [
  { id: 'normal', label: '정상 범위', range: { start: '2026-07-08', end: '2026-07-21' } },
  { id: 'partial', label: '고르는 중 (start 만)', range: { start: '2026-07-08' } },
  {
    id: 'reversed',
    label: '뒤집힌 범위 (start > end)',
    range: { start: '2026-07-21', end: '2026-07-08' },
  },
  { id: 'sameDay', label: '하루짜리', range: { start: '2026-07-15', end: '2026-07-15' } },
] as const;

export function CalendarRangeDemo() {
  const [caseId, setCaseId] = useState<(typeof CASES)[number]['id']>('normal');
  const active = CASES.find((entry) => entry.id === caseId) ?? CASES[0];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {CASES.map((entry) => (
          <Button
            key={entry.id}
            size="xs"
            variant={caseId === entry.id ? 'primary' : 'outline-gray'}
            onClick={() => setCaseId(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
      </div>
      <Calendar range={active.range} initialFocus="2026-07-15" />
      <p className="text-dl-xs text-dl-fg-subtle">
        range = <code className="font-dl-mono">{JSON.stringify(active.range)}</code>
      </p>
    </div>
  );
}
