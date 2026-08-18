'use client';

import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { ControlSize } from '../lib/controlSize';
import { warnOnce } from '../lib/warnOnce';
import { FieldViewText, useFieldControl } from './field';

/**
 * 스위치 — QA `custom-switch`: md 트랙 36×20 · knob 14 · ON 이면 Primary 채움.
 * (5단은 테마 스케일 유도 — 높이는 체크박스 공식, 폭은 높이 × 1.8.)
 *
 * `<button role="switch">` 다. `<input type="checkbox">` 로 만들면 켜짐/꺼짐을
 * "체크됨"으로 읽어 의미가 흐려지고, div 로 만들면 키보드가 죽는다.
 */

const TRACK_CLASS: Record<ControlSize, string> = {
  xs: 'h-dl-switch-h-xs w-dl-switch-w-xs',
  sm: 'h-dl-switch-h-sm w-dl-switch-w-sm',
  md: 'h-dl-switch-h-md w-dl-switch-w-md',
  lg: 'h-dl-switch-h-lg w-dl-switch-w-lg',
  xl: 'h-dl-switch-h-xl w-dl-switch-w-xl',
};

/** knob 지름 = 트랙 높이 - 6px(상하 3px 마진) — 트랙 토큰에서 유도해 어긋나지 않는다. */
const KNOB_CLASS: Record<ControlSize, string> = {
  xs: 'size-[calc(var(--spacing-dl-switch-h-xs)-6px)]',
  sm: 'size-[calc(var(--spacing-dl-switch-h-sm)-6px)]',
  md: 'size-[calc(var(--spacing-dl-switch-h-md)-6px)]',
  lg: 'size-[calc(var(--spacing-dl-switch-h-lg)-6px)]',
  xl: 'size-[calc(var(--spacing-dl-switch-h-xl)-6px)]',
};

/** ON 위치 = 트랙 폭 - (knob + 우측 3px 마진) = w - h + 3px. */
const KNOB_ON_CLASS: Record<ControlSize, string> = {
  xs: 'left-[calc(var(--spacing-dl-switch-w-xs)-var(--spacing-dl-switch-h-xs)+3px)]',
  sm: 'left-[calc(var(--spacing-dl-switch-w-sm)-var(--spacing-dl-switch-h-sm)+3px)]',
  md: 'left-[calc(var(--spacing-dl-switch-w-md)-var(--spacing-dl-switch-h-md)+3px)]',
  lg: 'left-[calc(var(--spacing-dl-switch-w-lg)-var(--spacing-dl-switch-h-lg)+3px)]',
  xl: 'left-[calc(var(--spacing-dl-switch-w-xl)-var(--spacing-dl-switch-h-xl)+3px)]',
};

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  size = 'md',
  id,
  viewLabels,
  className,
}: {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  /** 스위치는 라벨이 옆에 있어도 자체 이름이 필요하다. */
  readonly label: string;
  /** 5단 사이즈 — 기본 md(36×20). */
  readonly size?: ControlSize;
  readonly id?: string;
  /** view 모드 표시 문구. `ui` 는 사전을 모른다 — 주입받는다. 없으면 개발 경고 + 빈칸. */
  readonly viewLabels?: { readonly on: ReactNode; readonly off: ReactNode };
  readonly className?: string;
}) {
  const field = useFieldControl({ id });

  if (field.mode === 'view') {
    // `<button>` 이라 FormData 에 애초에 없다 — view 에서도 표시는 주입 문구가 전부다.
    if (!viewLabels) {
      warnOnce(
        `switch-view-no-labels:${id ?? field.id ?? 'unknown'}`,
        'view 모드의 Switch 에 viewLabels 가 없습니다. { on, off } 표시 문구를 주입해 주세요.',
      );
      return <FieldViewText size={size} />;
    }
    return <FieldViewText size={size}>{checked ? viewLabels.on : viewLabels.off}</FieldViewText>;
  }

  const effectiveDisabled = disabled || field.mode === 'disabled';

  return (
    <button
      type="button"
      role="switch"
      id={field.id}
      aria-checked={checked}
      aria-label={label}
      disabled={effectiveDisabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-dl-pill transition-colors',
        TRACK_CLASS[size],
        checked ? 'bg-dl-primary' : 'bg-dl-outline-border',
        // disabled 는 흐림이 아니라 전용 배색이다 — off #e6e6e6 · on 하늘색(QA 실측)
        effectiveDisabled && 'cursor-not-allowed',
        effectiveDisabled && (checked ? 'bg-dl-check-disabled-on-bg' : 'bg-dl-locked-bg'),
        className,
      )}
    >
      {/* knob 은 상태와 무관하게 흰색이다(QA) */}
      <span
        className={cn(
          'absolute top-[3px] rounded-full bg-dl-surface transition-[left]',
          KNOB_CLASS[size],
          checked ? KNOB_ON_CLASS[size] : 'left-[3px]',
        )}
      />
    </button>
  );
}
