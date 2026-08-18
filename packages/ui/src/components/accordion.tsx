'use client';

import { ChevronDown } from 'lucide-react';
import { Accordion as RadixAccordion } from 'radix-ui';
import type { ComponentPropsWithoutRef, Ref } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';

/**
 * 아코디언 — 원본 @deleo/ui 에는 없던 blog 추가 컴포넌트 (util 가이드 패널 등 접이식 본문).
 *
 * shadcn 과 같은 **조합형 4파트 API**(Accordion/Item/Trigger/Content)를 유지한다 —
 * 사용처가 트리거 안에 아이콘·배지 등 자유 조합을 넣는 화면 조합물이라, options 배열로
 * 굳히면 앱의 표현력이 죽는다. 접근성(키보드 토글·aria-expanded)은 radix 가 맡고,
 * 여기는 dl 토큰 배색과 열림 애니메이션만 책임진다.
 *
 * 열림/닫힘 화살표는 Trigger 가 자동으로 그린다(우측 ChevronDown, 열리면 180° 회전) —
 * 사용처마다 화살표를 직접 그리면 회전 규칙이 반드시 갈라진다.
 */
export function Accordion(props: ComponentPropsWithoutRef<typeof RadixAccordion.Root>) {
  return <RadixAccordion.Root {...props} />;
}

export function AccordionItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAccordion.Item>) {
  return (
    <RadixAccordion.Item
      className={cn('border-dl-divider border-b last:border-b-0', className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ref,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAccordion.Trigger> & { ref?: Ref<HTMLButtonElement> }) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        ref={ref}
        className={cn(
          'flex flex-1 items-center justify-between gap-2 py-3 text-left font-semibold text-dl-fg text-dl-sm',
          'transition-colors hover:text-dl-primary',
          'disabled:cursor-not-allowed disabled:text-dl-label-disabled',
          '[&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <Icon icon={ChevronDown} size="sm" className="text-dl-icon transition-transform" />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof RadixAccordion.Content>) {
  return (
    <RadixAccordion.Content
      className="overflow-hidden data-[state=closed]:animate-dl-accordion-up data-[state=open]:animate-dl-accordion-down"
      {...props}
    >
      <div className={cn('pt-0 pb-3', className)}>{children}</div>
    </RadixAccordion.Content>
  );
}
