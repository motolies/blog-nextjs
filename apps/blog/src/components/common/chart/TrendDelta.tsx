import { Badge, Icon } from '@hvy/ui';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDelta } from '@/lib/statFormat';

/**
 * 증감 배지 — "비교값 없는 절대수 금지" 원칙을 화면에서 실행하는 조각.
 *
 * invert 는 "낮을수록 좋은" 지표(에러 건수)에 쓴다. 색이 뜻을 나르지만 색만으로 나르지는 않는다 —
 * 배지 안에 부호와 크기가 텍스트로 함께 들어간다.
 */

interface TrendDeltaProps {
  current: number;
  previous: number;
  /** true 면 감소가 좋은 변화 */
  invert?: boolean;
}

export function TrendDelta({ current, previous, invert = false }: TrendDeltaProps) {
  const delta = formatDelta(current, previous, { invert });

  const tone = delta.good === null ? 'neutral' : delta.good ? 'success' : 'danger';
  const icon = delta.kind === 'up' ? TrendingUp : delta.kind === 'down' ? TrendingDown : Minus;

  return (
    <Badge tone={tone} size="xs">
      {/* title 없는 Icon 은 aria-hidden 이라 장식으로만 읽힌다 */}
      <Icon icon={icon} size="sm" />
      {delta.text}
    </Badge>
  );
}
