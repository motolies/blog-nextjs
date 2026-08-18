'use client';

import { Button, useConfirm } from '@hvy/ui';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * 확인 모달 — ConfirmProvider(셸이 감싼다)가 ConfirmDialog 를 렌더하므로
 * useConfirm 으로 결과를 await 로 받는다. 모달이 이미 열려 있으면 두 번째 요청은
 * 거절된다 — 모달 위에 모달을 겹치지 않는다.
 */
export function ConfirmDemo() {
  const askConfirm = useConfirm();
  const [lastResult, setLastResult] = useState('—');

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        onClick={async () => {
          const ok = await askConfirm({
            message: '저장하시겠습니까?',
            confirmLabel: '저장',
            cancelLabel: '취소',
          });
          setLastResult(ok ? '확인' : '취소');
        }}
      >
        확인·취소
      </Button>
      <Button
        variant="outline-red"
        icon={Trash2}
        onClick={async () => {
          const ok = await askConfirm({
            message: '선택한 2건을 삭제하시겠습니까?',
            confirmLabel: '삭제',
            cancelLabel: '취소',
            destructive: true,
          });
          setLastResult(ok ? '삭제 확인' : '취소');
        }}
      >
        파괴적 실행
      </Button>
      <Button
        onClick={async () => {
          await askConfirm({ message: '저장되었습니다', confirmLabel: '확인' });
          setLastResult('알림 닫음');
        }}
      >
        알림(단일 버튼)
      </Button>
      <span className="ml-2 text-dl-sm text-dl-fg-muted">
        결과: <b className="text-dl-fg">{lastResult}</b>
      </span>
    </div>
  );
}
