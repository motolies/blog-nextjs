'use client';

import { Badge } from '@hvy/ui';
import { useState } from 'react';
import { DEMO_STATUS_META, DEMO_STATUSES } from '../../../mock-orders';
import { EnumControl, PlaygroundGrid } from '../../../playground';

/**
 * Badge 플레이그라운드 — 5톤 + 주문상태 매핑 예시.
 * 색은 진행 국면으로 나눈다: 접수 전/진행(틸) · 전환·보류(주황) · 완료(초록) · 종료(회색) · 비정상(빨강).
 */
const TONES = ['neutral', 'primary', 'success', 'warning', 'danger'] as const;

export function BadgePlaygroundDemo() {
  const [tone, setTone] = useState<(typeof TONES)[number]>('primary');

  return (
    <PlaygroundGrid
      controls={<EnumControl label="tone" value={tone} options={TONES} onChange={setTone} />}
      code={`<Badge tone="${tone}">배송완료</Badge>`}
    >
      <Badge tone={tone}>배송완료</Badge>
      <span className="mx-2 h-5 w-px bg-dl-separator" />
      {DEMO_STATUSES.map((status) => (
        <Badge key={status} tone={DEMO_STATUS_META[status].tone}>
          {DEMO_STATUS_META[status].label}
        </Badge>
      ))}
    </PlaygroundGrid>
  );
}
