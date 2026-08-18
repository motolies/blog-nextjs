'use client';

import { CircleAlert, CircleCheck, type LucideIcon, TriangleAlert } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Icon } from '../icons';
import { cn } from '../lib/cn';
import {
  dismissToast,
  getToastServerSnapshot,
  getToastSnapshot,
  subscribeToasts,
  type ToastTone,
} from './toast-store';

/**
 * 토스트 뷰포트 — v3 §ds-02.
 *
 * **`position: fixed` 가 아니다.** v3 는 "기준이 브라우저 창이 아니라 콘텐츠 영역"이라
 * 목업은 매번 `getBoundingClientRect()` 로 좌표를 다시 계산한다. 대신 콘텐츠 래퍼를
 * `relative` 로 두고 그 안에 `absolute` 로 띄우면 측정도 리사이즈 리스너도 사라진다.
 * 그래서 **이 컴포넌트를 콘텐츠 래퍼 안에 마운트해야 한다** — 위치는 앱이 정한다.
 *
 * 딤도 버튼도 없다. 3초 뒤 자동으로 사라지고, 여러 건이면 8px 간격으로 쌓인다.
 */

/**
 * QA 토스트: 톤별 **연한 배경 + 본색 보더 + 2색 원형 아이콘**(색 원 + 흰 글리프).
 * 아이콘의 원이 currentColor 라 iconColor 가 곧 원의 색이다.
 * info 는 QA 에 없어 warning 글리프(느낌표)를 info 색으로 쓴다 — "알림"의 관습이다.
 */
const TONE_STYLE: Readonly<
  Record<ToastTone, { readonly box: string; readonly icon: LucideIcon; readonly iconColor: string }>
> = {
  success: {
    box: 'border-dl-success bg-dl-success-bg',
    icon: CircleCheck,
    iconColor: 'text-dl-success',
  },
  warning: {
    box: 'border-dl-warning bg-dl-warning-bg',
    icon: TriangleAlert,
    iconColor: 'text-dl-warning',
  },
  error: {
    box: 'border-dl-danger bg-dl-danger-bg',
    icon: CircleAlert,
    iconColor: 'text-dl-danger',
  },
  info: { box: 'border-dl-info bg-dl-info-bg', icon: TriangleAlert, iconColor: 'text-dl-info' },
};

export function ToastViewport({ dismissLabel = '닫기' }: { readonly dismissLabel?: string }) {
  const toasts = useSyncExternalStore(subscribeToasts, getToastSnapshot, getToastServerSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div
      // QA toast-container: 좌측 하단 32px 안쪽 · 간격 16px. 최신이 맨 아래라 위로 쌓인다.
      className="pointer-events-none absolute bottom-8 left-8 z-[var(--dl-z-toast)] flex flex-col items-start gap-4"
      // 여러 건이 동시에 뜨면 스크린리더가 순서대로 읽는다
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const tone = TONE_STYLE[toast.tone];
        return (
          <button
            key={toast.id}
            type="button"
            aria-label={dismissLabel}
            onClick={() => dismissToast(toast.id)}
            // QA .toast: 320px 고정 폭 · padding 12/16 · radius 8
            className={cn(
              'pointer-events-auto flex w-dl-toast-w items-start gap-2 rounded-dl-container border px-4 py-3 text-left shadow-dl-toast',
              tone.box,
            )}
          >
            <span className={cn('mt-0.5 flex shrink-0', tone.iconColor)}>
              <Icon icon={tone.icon} size="sm" />
            </span>
            <span className="min-w-0 text-dl-md text-dl-fg">
              {toast.title ? (
                <span className="mb-1 block text-dl-sm font-bold">{toast.title}</span>
              ) : null}
              {toast.message}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { showToast, subscribeToasts, type Toast, type ToastTone } from './toast-store';
