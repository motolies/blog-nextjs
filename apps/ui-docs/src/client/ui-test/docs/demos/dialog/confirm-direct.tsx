'use client';

import { Button, ConfirmDialog } from '@hvy/ui';
import { useState } from 'react';

/**
 * ConfirmDialog 직접 사용 — Provider 없이 쓰는 경로다.
 *
 * **이때만 cancelLabel 을 생략해 단일 버튼 알림을 만들 수 있다.** `useConfirm()` 은 provider 가
 * 기본 취소 문구를 채우므로 늘 두 버튼이고, 단일 버튼은 `useAlert()` 로 만든다.
 *
 * 검증 포인트:
 * · **제목 줄이 없다** — 무슨 알림인지는 본문 문장이 이미 말한다. 접근성 이름은
 *   confirmLabel 이 sr-only Title 로 맡는다(스크린리더로 확인할 것)
 * · 본문은 min-height 120 · 가운데 정렬 · 폭 500 고정이라 문장이 짧아도 창이 납작해지지 않는다
 * · 버튼이 폭을 **반씩 나눠 가진다**(flex-1) — 콘텐츠 모달의 220 고정과 **다른 규격**이다
 * · destructive 를 켜면 확인 버튼이 outline-red 가 되고 hover 에서 짙은 빨강으로 채워진다
 *   (hover 가 primary 로 수렴하는 공통 규칙에서 의도적으로 이탈하는 유일한 variant 다)
 * · 기본 포커스는 취소이고, 딤 클릭과 Esc 로도 닫힌다 — 선택 모달과 갈리는 지점이다
 */
export function DialogConfirmDirectDemo() {
  const [open, setOpen] = useState<'alert' | 'confirm' | 'danger' | null>(null);
  const [last, setLast] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline-gray" onClick={() => setOpen('alert')}>
          단일 버튼 (cancelLabel 없음)
        </Button>
        <Button variant="outline-gray" onClick={() => setOpen('confirm')}>
          두 버튼
        </Button>
        <Button variant="outline-red" onClick={() => setOpen('danger')}>
          파괴적 확인
        </Button>
      </div>

      <ConfirmDialog
        open={open === 'alert'}
        onOpenChange={(next) => !next && setOpen(null)}
        message="색인이 완료되었습니다. 검색 반영까지 최대 5분이 걸립니다."
        confirmLabel="확인"
        onConfirm={() => {
          setLast('단일 버튼 — 확인');
          setOpen(null);
        }}
      />

      <ConfirmDialog
        open={open === 'confirm'}
        onOpenChange={(next) => !next && setOpen(null)}
        message="저장하지 않은 변경이 있습니다. 그래도 나가시겠습니까?"
        confirmLabel="나가기"
        cancelLabel="계속 편집"
        onConfirm={() => {
          setLast('두 버튼 — 나가기');
          setOpen(null);
        }}
      />

      <ConfirmDialog
        open={open === 'danger'}
        onOpenChange={(next) => !next && setOpen(null)}
        message="이 게시글을 삭제하면 되돌릴 수 없습니다. 삭제할까요?"
        confirmLabel="삭제"
        cancelLabel="취소"
        destructive
        onConfirm={() => {
          setLast('파괴적 — 삭제');
          setOpen(null);
        }}
      />

      {last === '' ? null : <p className="text-dl-xs text-dl-fg-subtle">마지막 결과: {last}</p>}
    </div>
  );
}
