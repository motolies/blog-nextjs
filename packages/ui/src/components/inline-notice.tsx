import type { LucideIcon } from 'lucide-react';
import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';

/**
 * 인라인 안내 배너 — 화면에 **머무는** 메시지.
 *
 * 토스트(3초 휘발)와 ErrorState(영역 전면 대체) 사이의 층이다: 마스킹 안내처럼
 * 화면에 체류하는 내내 보여야 하는 문맥 설명이 주 용도다. 이 층이 없어서
 * 앱이 생 JSX 로 배너를 그리던 것(`bg-dl-warning-bg` 조합 복제)을 흡수한다.
 *
 * 배색은 oms 실사용·Badge 와 같은 문법이다 — 틴트 배경 + **잉크 글자**(`*-ink`).
 * 500 계열을 틴트 위 글자로 쓰면 WCAG AA 미달이라 잉크를 쓴다(badge.tsx 근거).
 * info 는 `-ink` 토큰이 없어 같은 brand 계열의 `primary-ink`("밝은 표면 위
 * 브랜드색 글자", default.css)를 쓴다. 아이콘은 토스트 세트를 재사용하고
 * info 는 toast.tsx 선례대로 warning 글리프(느낌표)를 info 색으로 쓴다.
 *
 * `'use client'` 가 없다 — 순수 표시라 RSC 에서도 쓴다(Badge 와 같은 이유).
 * 상호작용(언마스킹 링크 등)은 `action` 슬롯으로 앱이 넣는다.
 */

export type InlineNoticeTone = 'muted' | 'info' | 'success' | 'warning' | 'error';

const TONE_STYLE: Readonly<
  Record<
    InlineNoticeTone,
    { readonly box: string; readonly icon?: LucideIcon; readonly iconColor?: string }
  >
> = {
  /** 톤 없는 부가 설명 — 마스킹 안내 등. 아이콘 없이 조용히 깔린다. */
  muted: { box: 'bg-dl-grid-header text-dl-fg-muted' },
  info: {
    box: 'bg-dl-info-bg text-dl-primary-ink',
    icon: TriangleAlert,
    iconColor: 'text-dl-info',
  },
  success: {
    box: 'bg-dl-success-bg text-dl-success-ink',
    icon: CircleCheck,
    iconColor: 'text-dl-success',
  },
  warning: {
    box: 'bg-dl-warning-bg text-dl-warning-ink',
    icon: TriangleAlert,
    iconColor: 'text-dl-warning',
  },
  error: {
    box: 'bg-dl-danger-bg text-dl-danger-ink',
    icon: CircleAlert,
    iconColor: 'text-dl-danger',
  },
};

export type InlineNoticeProps = {
  readonly tone?: InlineNoticeTone;
  /** 제목(선택) — 본문 위 한 줄 굵게. */
  readonly title?: string;
  readonly children: ReactNode;
  /** 우측 액션 슬롯 — 언마스킹 링크·닫기 버튼 등 상호작용은 앱이 넣는다. */
  readonly action?: ReactNode;
  /**
   * 렌더 후 **동적으로 삽입되는** 배너만 켠다 — `role="status"` 로 스크린리더가
   * 등장을 읽는다. 처음부터 있는 배너에 켜면 소음이다.
   */
  readonly live?: boolean;
  readonly className?: string;
};

export function InlineNotice({
  tone = 'muted',
  title,
  children,
  action,
  live,
  className,
}: InlineNoticeProps) {
  const style = TONE_STYLE[tone];
  return (
    <div
      role={live ? 'status' : undefined}
      className={cn(
        'flex items-start gap-2 rounded-dl-control px-3 py-2 text-dl-sm',
        style.box,
        className,
      )}
    >
      {style.icon ? (
        <span className={cn('mt-0.5 flex shrink-0', style.iconColor)}>
          <Icon icon={style.icon} size="sm" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="mb-0.5 font-bold">{title}</p> : null}
        {children}
      </div>
      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
    </div>
  );
}
