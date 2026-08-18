'use client';

import { Field, FormGrid, NumberInput } from '@hvy/ui';
import { useState } from 'react';

/**
 * NumberInput 기본 — 값 계약이 `number | null` 이다(`Input` 은 문자열).
 *
 * 볼 것:
 * · 표시는 천단위 구분(1,234,567.50) · 편집 중에는 친 그대로 두고 **blur/Enter 에 확정**한다
 * · 숫자가 아닌 입력은 조용히 이전 값으로 되돌린다 — 반쯤 친 문자열을 값으로 남기지 않는다
 * · ↑/↓ 는 step 만큼 증감 · min/max 는 확정 시 클램프 · decimalPlaces 는 표시(0 채움)와
 *   확정(반올림) 양쪽에 적용된다
 * · 폼 안 숫자라 `align="left"` 다 — 기본은 가운데("숫자 칸은 가운데", v3)
 * · 확정값 표시로 값 계약을 실증한다 — 빈 칸은 0 이 아니라 null 이다
 */
export function NumberInputBasicDemo() {
  const [quantity, setQuantity] = useState<number | null>(50);
  const [amount, setAmount] = useState<number | null>(1234567.5);

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <FormGrid>
        <Field label="수량" htmlFor="ni-quantity" help="↑/↓ = 10 씩 · 0 ~ 999 클램프">
          <NumberInput
            id="ni-quantity"
            align="left"
            min={0}
            max={999}
            step={10}
            value={quantity}
            onValueChange={setQuantity}
          />
        </Field>
        <Field label="결제금액" htmlFor="ni-amount" help="천단위 구분 · 소수 2자리 고정(반올림)">
          <NumberInput
            id="ni-amount"
            align="left"
            decimalPlaces={2}
            value={amount}
            onValueChange={setAmount}
          />
        </Field>
      </FormGrid>
      {/* 확정값 — 표시의 콤마와 무관한 원시 숫자다. name 을 주면 hidden input 이 이 값을 든다. */}
      <p className="text-dl-xs text-dl-fg-subtle">
        확정값:{' '}
        <code className="font-dl-mono">
          quantity={quantity === null ? 'null' : quantity} · amount=
          {amount === null ? 'null' : amount}
        </code>
      </p>
    </div>
  );
}
