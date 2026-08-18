'use client';

import { EmptyState, ErrorState, Spinner, showToast } from '@hvy/ui';

/**
 * 상태 표시 3종 — Spinner · EmptyState · ErrorState.
 * 빈 상태는 "결과 없음"과 "아직 검색 안 함"을 구분해 보여준다.
 * ErrorState 의 재시도는 클릭 핸들러라 클라이언트 전용이다.
 */
export function FeedbackStatesDemo() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col items-center justify-center gap-2 rounded-dl-control bg-dl-canvas py-6">
        <Spinner />
        <span className="text-dl-xs text-dl-fg-muted">Spinner</span>
      </div>
      <div className="rounded-dl-control bg-dl-canvas">
        <EmptyState message="조회 결과가 없습니다" hint="검색 조건을 바꿔 다시 조회해 보세요" />
      </div>
      <div className="rounded-dl-control bg-dl-canvas">
        <ErrorState
          message="조회에 실패했습니다"
          onRetry={() => showToast('다시 시도했습니다 (데모)', 'info')}
        />
      </div>
    </div>
  );
}
