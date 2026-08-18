import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * 상태 배지 — md 기준 h19 · 좌우 8 · radius 4 · weight 600 · **톤얼(배경+글자)**.
 * QA multi-badge(연한 배경 + primary 글자)와 같은 문법이다.
 *
 * 글자는 500 계열이 아니라 **잉크 토큰**(`*-ink`)이다 — 틴트 배경 위에 500 을 그대로
 * 쓰면 2.2~2.9:1 로 전부 WCAG AA 미달이었다. 500 은 면(아이콘·막대)에 남는다.
 *
 * 색은 **진행 국면**으로 나눈다: 접수 전/진행(틸) · 전환·보류(주황) · 완료(초록) ·
 * 종료(회색) · 비정상(빨강). 의미색 채움(흰 글자)은 토스트 아이콘 전용이라 여기 없다.
 *
 * 폰트는 md 까지 QA 12(text-dl-xs) 고정이다 — 배지 글자 12 는 "값 라벨" 의미가 강해
 * 높이만 줄어든 xs/sm 에서도 유지하고, lg/xl 만 13 으로 한 단 올린다.
 *
 * `'use client'` 가 없다 — 순수 표시라 RSC 에서도 쓴다(주문 상세가 실제로 그렇게 쓴다).
 */
const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-dl-badge font-semibold',
  {
    variants: {
      tone: {
        /** 종료 · 흐름 이전 단계 — 회색 칩. */
        neutral: 'bg-dl-locked-bg text-dl-locked-ink',
        /** 진행 중인 정상 흐름. */
        primary: 'bg-dl-tonal text-dl-tonal-fg',
        /** 완료. */
        success: 'bg-dl-success-bg text-dl-success-ink',
        /** 전환·보류. */
        warning: 'bg-dl-warning-bg text-dl-warning-ink',
        /** 비정상 종료 — 분실 · 폐기 · 취소완료. */
        danger: 'bg-dl-danger-bg text-dl-danger-ink',
      },
      size: {
        xs: 'h-dl-badge-xs px-1.5 text-dl-xs',
        sm: 'h-dl-badge-sm px-1.5 text-dl-xs',
        md: 'h-dl-badge-md px-2 text-dl-xs',
        lg: 'h-dl-badge-lg px-2.5 text-dl-ctl-sm',
        xl: 'h-dl-badge-xl px-2.5 text-dl-ctl-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export type BadgeProps = { className?: string; children: ReactNode } & VariantProps<
  typeof badgeVariants
>;

export function Badge({ className, tone, size, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)}>{children}</span>;
}

export { badgeVariants };
