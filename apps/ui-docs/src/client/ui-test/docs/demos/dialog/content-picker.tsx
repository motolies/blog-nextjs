'use client';

import { Button, ContentDialog, PickerDialog } from '@hvy/ui';
import { useState } from 'react';

/**
 * 콘텐츠 · 선택 모달 — 선택 모달만 Esc·딤 클릭을 받지 않는다.
 * 실수로 고른 것을 잃는 경로를 좁히기 위해서다. 그리드가 든 선택 모달 실전 조합은
 * Examples 의 dialog-picker 문서에 있다.
 */
export function ContentPickerDemo() {
  const [contentOpen, setContentOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button onClick={() => setContentOpen(true)}>콘텐츠 모달</Button>
      <Button variant="outline-primary" onClick={() => setPickerOpen(true)}>
        선택 모달
      </Button>

      <ContentDialog
        open={contentOpen}
        onOpenChange={setContentOpen}
        title="콘텐츠 모달"
        description="무언가를 보는 창"
        size="md"
        footer={
          <Button variant="outline-strong" onClick={() => setContentOpen(false)}>
            닫기
          </Button>
        }
      >
        <p className="text-dl-base text-dl-fg">
          흰 헤더에 20px 제목을 두어 무엇을 보는 자리인지 알린다. 본문은 회색 캔버스이고 내용이 길면
          본문만 스크롤된다. 푸터 버튼은 폭 220 고정(QA).
        </p>
      </ContentDialog>

      <PickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="선택 모달"
        footer={
          <>
            <Button variant="outline-strong" onClick={() => setPickerOpen(false)}>
              닫기
            </Button>
            <Button variant="primary" onClick={() => setPickerOpen(false)}>
              등록
            </Button>
          </>
        }
      >
        <div className="rounded-dl-container border border-dl-border-soft bg-dl-surface p-4 text-dl-sm text-dl-fg">
          본문이 회색 캔버스이고 흰 배경은 안쪽 카드가 갖는다. Esc 를 눌러도 닫히지 않는 것을 확인해
          볼 것.
        </div>
      </PickerDialog>
    </div>
  );
}
