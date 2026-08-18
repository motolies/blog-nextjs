'use client';

import type { ReactNode } from 'react';

/**
 * 조회 실패 상태. `onRetry` 가 클릭 핸들러로 직결되므로 **클라이언트 전용**이다 —
 * `feedback.tsx` 의 순수 표시용(Badge/EmptyState/Spinner)과 파일을 분리해
 * 서버 컴포넌트에서 핸들러를 넘기는 실수를 경계에서 드러낸다.
 */
export function ErrorState({ message, onRetry }: { message: ReactNode; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <p className="text-dl-sm text-dl-danger">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-dl-xs text-dl-primary-ink underline underline-offset-2"
        >
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
