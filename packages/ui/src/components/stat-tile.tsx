import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * 요약 스탯 타일 — 재고현황 화면의 인라인 마크업을 승격한 것이다.
 *
 * 두 얼굴을 가진다: `onClick` 이 없으면 순수 표시(`<div>`), 있으면 필터 숏컷(`<button>`).
 * 숏컷일 때 `active` 가 현재 적용된 필터를 나타낸다 — 판정은 호출부(URL)가 한다.
 * 토글 상태이므로 `aria-pressed` 로 노출한다.
 *
 * 수치는 반드시 화면의 그리드와 **같은 데이터**에서 파생시킨다(수치 불일치 방지).
 * 집계 기준이 화면 필터와 다르면 `hint` 에 기준을 명기한다("전체 기준" 등).
 */

export type StatTileTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<StatTileTone, string> = {
  neutral: 'text-dl-fg-strong',
  primary: 'text-dl-primary-ink',
  success: 'text-dl-success',
  warning: 'text-dl-warning',
  danger: 'text-dl-danger',
};

export type StatTileProps = {
  readonly label: ReactNode;
  readonly value: ReactNode;
  /** 집계 기준 안내 — 라벨 뒤에 `· hint` 로 붙는다. */
  readonly hint?: ReactNode;
  /** 수치 색으로 뜻을 싣는다 — 이슈=danger 처럼 데이터의 뜻일 때만 쓴다. */
  readonly tone?: StatTileTone;
  /** 필터 숏컷 활성 여부 — 진실은 URL 이고 판정은 호출부가 한다. */
  readonly active?: boolean;
  readonly onClick?: () => void;
  readonly className?: string;
};

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  active = false,
  onClick,
  className,
}: StatTileProps) {
  const body = (
    <>
      <p className="text-dl-xs text-dl-fg-muted">
        {label}
        {hint ? <span className="ml-1">· {hint}</span> : null}
      </p>
      <p className={cn('pt-1 text-dl-xl font-bold', TONE_CLASS[tone])}>{value}</p>
    </>
  );

  const surface = 'rounded-dl-container border bg-dl-surface px-4 py-3 shadow-dl-card';

  if (!onClick) {
    return <div className={cn(surface, 'border-dl-border-soft', className)}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        surface,
        'text-left transition-colors',
        active
          ? 'border-dl-primary bg-dl-tonal-hover'
          : 'border-dl-border-soft hover:border-dl-separator',
        className,
      )}
    >
      {body}
    </button>
  );
}
