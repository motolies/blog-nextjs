'use client';

import { Button, showToast } from '@hvy/ui';

/**
 * 코드 복사 버튼 — 아이콘 세트(QA 42종)에 copy 가 없어 텍스트 버튼을 쓴다.
 * (`gen-icons.mjs` 는 QA 자산이 입력인 수동 전용이라 임의 추가하지 않는다)
 */
export function CopyButton({
  text,
  className,
}: {
  readonly text: string;
  readonly className?: string;
}) {
  return (
    <Button
      size="sm"
      variant="outline-gray"
      className={className}
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => showToast('코드를 복사했습니다.'))
          .catch(() =>
            showToast('복사에 실패했습니다 — 브라우저 클립보드 권한을 확인하세요.', 'error'),
          );
      }}
    >
      복사
    </Button>
  );
}
