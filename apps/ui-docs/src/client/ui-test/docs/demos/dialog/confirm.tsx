'use client';

import { Button, useAlert, useConfirm } from '@hvy/ui';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

/**
 * 확인 · 알림 모달 — ConfirmProvider(셸이 감싼다)가 ConfirmDialog 를 렌더하므로
 * useConfirm 으로 결과를 await 로 받는다. 모달이 이미 열려 있으면 두 번째 요청은
 * 거절된다 — 모달 위에 모달을 겹치지 않는다.
 *
 * **알림(취소 없는 단일 버튼)은 별도 훅 `useAlert()` 다.** `useConfirm()` 에서
 * `cancelLabel` 을 생략해도 앱이 준 기본 취소 문구가 붙어 두 버튼으로 뜬다 —
 * 취소 버튼 없는 확인 모달은 만들 수 없다.
 *
 * ⚠️ `useAlert()` 의 반환 함수는 `showAlert` 로 받는다. `alert` 로 받으면
 * `plugins/no-native-dialog.grit` 이 스코프를 보지 않고 `alert($args)` 호출을 잡아
 * 지역 변수여도 규칙 위반이 된다(`useConfirm` 의 `askConfirm` 과 같은 함정).
 *
 * "파괴적 실행" 버튼은 hover 를 눈으로 확인하는 자리다 — outline-red 는 공통 규칙에서
 * 의도적으로 이탈해 brand 가 아니라 자기 색(짙은 빨강)으로 채워진다.
 */
export function ConfirmDemo() {
  const askConfirm = useConfirm();
  const showAlert = useAlert();
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
          await showAlert({ message: '저장되었습니다', confirmLabel: '확인' });
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
