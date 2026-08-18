import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** 목록이 비었을 때. "결과 없음"과 "아직 검색 안 함"을 구분해 보여준다. */
export function EmptyState({ message, hint }: { message: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <p className="text-dl-sm text-dl-fg-muted">{message}</p>
      {hint ? <p className="text-dl-xs text-dl-fg-subtle">{hint}</p> : null}
    </div>
  );
}

/** 인라인 스피너. 그리드 재조회처럼 화면을 비우지 않고 보여줘야 하는 곳에 쓴다. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="불러오는 중"
      className={cn(
        'inline-block size-3.5 animate-spin rounded-full border-2 border-dl-border border-t-dl-primary',
        className,
      )}
    />
  );
}
