'use client';

import { Tooltip as RadixTooltip } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * 툴팁 — QA `custom-tooltip`: 검정 말풍선 · 흰 글자 12px 500 · 꼬리 화살표.
 *
 * CSS-only(hover 표시)가 아니라 Radix 인 이유: 키보드 포커스 트리거 · Esc 닫힘 ·
 * 포털(넘침 잘림 회피)이 공짜다. Provider 를 Root 마다 내장한다 — 화면당 툴팁이
 * 몇 개 안 돼 공유 Provider 의 이점(연속 hover 시 지연 생략)보다 배선 단순함이 낫다.
 *
 * ⚠️ trigger(children)는 **포커스 가능한 요소**여야 한다(버튼 등) —
 * 아이콘만 넘기면 키보드 사용자는 툴팁을 영영 못 본다.
 */
export function Tooltip({
  content,
  side = 'right',
  delayDuration = 200,
  className,
  children,
}: {
  readonly content: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly delayDuration?: number;
  readonly className?: string;
  /** 트리거. `asChild` 로 감싸므로 단일 요소여야 한다. */
  readonly children: ReactNode;
}) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className={cn(
              'z-[var(--dl-z-toast)] max-w-80 rounded-dl-badge bg-dl-tooltip px-2 py-1 text-dl-xs font-medium text-dl-tooltip-fg',
              className,
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-dl-tooltip" width={12} height={6} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
