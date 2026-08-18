'use client';

import { Button, InlineNotice } from '@hvy/ui';
import { useState } from 'react';

/**
 * title + action 슬롯 — 상호작용은 앱이 넣는다(ui 는 표시 전용).
 * 나중에 삽입되는 배너는 live 를 켠다 — role="status" 로 스크린리더가 등장을 읽는다.
 */
export function InlineNoticeActionDemo() {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <InlineNotice
        tone="warning"
        title="마스킹된 값이 있습니다"
        action={
          <Button size="xs" variant="outline-strong" onClick={() => setShown(true)}>
            언마스킹
          </Button>
        }
      >
        마스킹된 칸은 저장 시 제외됩니다 — 원문 열람은 권한 확인 후 감사 기록이 남습니다.
      </InlineNotice>
      {shown ? (
        <InlineNotice tone="info" live>
          언마스킹 요청이 접수되었습니다 — 180초 동안 원문이 표시됩니다. (데모)
        </InlineNotice>
      ) : null}
    </div>
  );
}
