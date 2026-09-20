import { Badge } from '@hvy/ui';
import { runStatusLabel, runStatusTone } from '@/lib/quant/runStatus';

/**
 * run 상태 칩 — 라벨·톤은 `lib/quant/runStatus.ts` 가 단독 소유한다(두 모듈·모든 화면이 같은 색을 쓴다).
 * `'use client'` 가 없다 — 순수 표시.
 */
export function RunStatusBadge({
  status,
  size = 'xs',
}: {
  status: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <Badge tone={runStatusTone(status)} size={size}>
      {runStatusLabel(status)}
    </Badge>
  );
}
