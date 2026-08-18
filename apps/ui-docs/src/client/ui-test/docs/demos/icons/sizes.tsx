'use client';

import { Icon, type IconSize } from '@hvy/ui';
import { Lock, Truck } from 'lucide-react';

/** 크기 3단 — 16 · 20 · 24 (is-16/is-20/is-24) + 자물쇠 전용 12. */
const SIZES: readonly IconSize[] = ['sm', 'md', 'lg'];

export function IconsSizesDemo() {
  return (
    <div className="flex items-end gap-6">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-1.5">
          <Icon icon={Truck} size={size} />
          <span className="text-dl-fg-muted text-dl-xs">{size}</span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-1.5">
        <Icon icon={Lock} size="lock" />
        <span className="text-dl-fg-muted text-dl-xs">lock(12)</span>
      </div>
    </div>
  );
}
