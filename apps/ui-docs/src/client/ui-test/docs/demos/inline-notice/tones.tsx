'use client';

import { InlineNotice } from '@hvy/ui';

/**
 * 톤 5종 — muted(아이콘 없음)와 의미 톤 4종(토스트 아이콘 재사용).
 * 틴트 배경 위 글자는 잉크 토큰이다 — Badge 와 같은 문법(500 계열은 WCAG 미달).
 */
export function InlineNoticeTonesDemo() {
  return (
    <div className="flex flex-col gap-2">
      <InlineNotice tone="muted">개인정보 항목은 권한에 따라 마스킹되어 표시됩니다.</InlineNotice>
      <InlineNotice tone="info">게시글 상태가 변경되면 자동으로 갱신됩니다.</InlineNotice>
      <InlineNotice tone="success">발행이 완료된 게시글입니다.</InlineNotice>
      <InlineNotice tone="warning">3건이 누락된 채 저장되었습니다.</InlineNotice>
      <InlineNotice tone="error">카테고리가 지정되지 않아 발행이 보류되었습니다.</InlineNotice>
    </div>
  );
}
