'use client';

import { Button } from '@hvy/ui';
import { Calendar } from 'lucide-react';

/**
 * variant × size 전수 매트릭스 — QA _button.css 의 모든 조합.
 * 마지막 행은 비활성 배색(locked-fg 글자 · outline 보더 · locked-bg 배경) 확인용이다.
 */
const VARIANTS = [
  'primary',
  'outline-primary',
  'outline-strong',
  'outline-gray',
  'outline-red',
] as const;

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export function ButtonMatrixDemo() {
  return (
    <div className="flex flex-col gap-3">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-1.5">
          <span className="w-8 shrink-0 text-dl-xs text-dl-fg-muted">{size}</span>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} size={size} icon={Calendar}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-8 shrink-0 text-dl-xs text-dl-fg-muted">off</span>
        {VARIANTS.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            disabled
            title="매트릭스 데모 — 비활성 배색은 variant 와 무관하게 같다"
          >
            {variant}
          </Button>
        ))}
      </div>
    </div>
  );
}
