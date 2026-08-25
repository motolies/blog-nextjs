'use client';

import { Button, showToast } from '@hvy/ui';

/**
 * 액션·duration — 액션이 있으면 박스가 단일 버튼이 아니라 액션·닫기 버튼을 가진
 * div 가 된다(중첩 버튼 회피). durationMs 로 누를 시간을 벌리고,
 * Infinity 면 수동 닫기 전용이다(setTimeout 의 Infinity→0 강제를 가드한다).
 */
export function ToastActionDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline-strong"
        onClick={() =>
          showToast('게시글 1건을 비공개로 전환했습니다', 'info', {
            durationMs: 8000,
            action: { label: '실행 취소', onClick: () => showToast('취소했습니다 (데모)') },
          })
        }
      >
        실행 취소 토스트 (8초)
      </Button>
      <Button
        size="sm"
        variant="outline-strong"
        onClick={() =>
          showToast('내보내기가 끝나면 알림이 옵니다', 'info', {
            durationMs: Number.POSITIVE_INFINITY,
            action: { label: '확인', onClick: () => {} },
          })
        }
      >
        수동 닫기 토스트 (∞)
      </Button>
    </div>
  );
}
