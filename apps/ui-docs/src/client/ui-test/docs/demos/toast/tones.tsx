'use client';

import { Button, showToast, type ToastTone } from '@hvy/ui';

/**
 * 토스트 4톤 — 완료 안내 전용. 딤도 버튼도 없고 3초 뒤 사라진다.
 * 진행을 막아야 하면 확인 모달을 쓴다. warning 은 누락 건수를 반드시 숫자로 적는다.
 */
const TOAST_CASES: readonly { readonly tone: ToastTone; readonly message: string }[] = [
  { tone: 'success', message: '저장되었습니다' },
  { tone: 'warning', message: '12건 중 10건만 저장되었습니다' },
  { tone: 'error', message: '업로드에 실패했습니다' },
  { tone: 'info', message: '엑셀 파일은 만든 뒤 메일로 보냅니다' },
];

export function ToastTonesDemo() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TOAST_CASES.map((item) => (
        <Button key={item.tone} onClick={() => showToast(item.message, item.tone)}>
          {item.tone}
        </Button>
      ))}
      <Button
        variant="outline-strong"
        onClick={() =>
          showToast('본문 영역 — 문장이 아닌 명사형으로 작성 권장', 'error', {
            title: '제목 영역 — 1줄 작성 권장',
          })
        }
      >
        타이틀 있는 토스트
      </Button>
      <Button
        variant="outline-primary"
        onClick={() => {
          for (const item of TOAST_CASES) showToast(item.message, item.tone);
        }}
      >
        4건 한꺼번에
      </Button>
    </div>
  );
}
