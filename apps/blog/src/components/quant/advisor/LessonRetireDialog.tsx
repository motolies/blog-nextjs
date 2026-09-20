'use client';

import { Button, ContentDialog, InlineNotice, Label, showToast, Textarea } from '@hvy/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { quantKeys } from '@/hooks/useQuant';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import service from '@/service';
import type { LessonRow } from '@/types/quant';
import { lessonScopeLabel } from './advisorLabels';

/**
 * 교훈 폐기 — `ContentDialog size="sm"` + 사유 Textarea(필수) + 푸터 [폐기 `outline-red`] 1개(PLAN confirm 매트릭스).
 * 취소는 헤더 × 로 한다 — `DialogFooter` 는 버튼 폭 220 고정·줄바꿈 없음이라 375px 에서 2개부터 잘린다.
 * 사유는 `POST /lessons/{id}/retire?reason=` 쿼리 파라미터로 가고 `retiredReason` 컬럼에 남는다.
 */
export function LessonRetireDialog({
  lesson,
  onClose,
  onRetired,
}: {
  /** null 이면 닫힘. */
  lesson: LessonRow | null;
  onClose: () => void;
  /** 성공 뒤 — 그리드 `refresh()`. */
  onRetired: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  // 대상이 바뀌면 이전 사유를 끌고 가지 않는다.
  useEffect(() => {
    setReason('');
  }, [lesson?.lessonId]);

  const trimmed = reason.trim();

  /** 폐기 실행 — 사유가 비면 버튼이 막혀 있어 여기까지 오지 않는다(400 은 Slack 을 울리므로 프론트에서 선차단). */
  const retire = async () => {
    if (!lesson || trimmed.length === 0) return;
    setBusy(true);
    try {
      await service.advisor.retireLesson(lesson.lessonId, trimmed);
      showToast(`교훈 #${lesson.lessonId} 폐기 — 다음 ADVISE 부터 적용되지 않습니다.`);
      queryClient.invalidateQueries({ queryKey: quantKeys.all });
      onRetired();
      onClose();
    } catch (error) {
      showApiErrorToast(`교훈 #${lesson.lessonId} 폐기에 실패했습니다.`, error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ContentDialog
      open={lesson !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={lesson ? `교훈 #${lesson.lessonId} 폐기` : '교훈 폐기'}
      description={
        lesson ? `${lessonScopeLabel(lesson.scope)} · 적용 ${lesson.appliedCount}회` : undefined
      }
      size="sm"
      footer={
        <Button variant="outline-red" busy={busy} disabled={trimmed.length === 0} onClick={retire}>
          폐기
        </Button>
      }
    >
      {lesson ? (
        <div className="flex flex-col gap-3 p-1">
          <InlineNotice tone="warning">
            <span className="wrap-anywhere">
              폐기하면 프롬프트에서 빠지고 되살릴 수 없습니다(같은 교훈은 다음 WEEKLY_REVIEW 가 다시
              후보로 낼 수 있습니다).
            </span>
          </InlineNotice>
          <p className="text-dl-sm text-dl-fg wrap-anywhere">
            {lesson.lessonText ?? lesson.rule ?? lesson.observation ?? '(본문 없음)'}
          </p>
          <div className="flex flex-col gap-1">
            <Label htmlFor="lesson-retire-reason">폐기 사유 (필수)</Label>
            <Textarea
              id="lesson-retire-reason"
              autoFocus
              rows={3}
              maxLength={500}
              showCount
              placeholder="예: 최근 4주 적용군 초과수익이 미적용군보다 낮음"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </div>
      ) : null}
    </ContentDialog>
  );
}
