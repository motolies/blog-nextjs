'use client';

import { Button, ContentDialog, PickerDialog } from '@hvy/ui';
import { useState } from 'react';

/**
 * 콘텐츠 · 선택 모달 — 선택 모달만 Esc·딤 클릭을 받지 않는다.
 * 실수로 고른 것을 잃는 경로를 좁히기 위해서다. 그리드가 든 선택 모달 실전 조합은
 * Examples 의 dialog-picker 문서에 있다.
 *
 * 콘텐츠 모달의 폭(size)·높이(height)는 **직교한 2축**이라 조합을 표로 두고 열린 것을
 * 하나의 state 로 관리한다 — 조합마다 boolean state 를 늘리면 "한 번에 하나만 열린다"를
 * 코드가 보장하지 못하고, 모달 위에 모달이 겹치면 개발 경고가 난다.
 * 선택 모달에는 크기 축이 없다 — 리사이즈가 그 모달의 정체성이다.
 */

/** 눌러 볼 조합 — 기본 · 고정 크기 · 거의 풀사이즈. */
const SIZE_CASES = [
  {
    id: 'default',
    label: '콘텐츠 모달 (기본)',
    size: 'md',
    height: undefined,
    note: 'size 기본값 md · height 미지정(auto) — 내용만큼만 높아진다.',
  },
  {
    id: 'fixed',
    label: '고정 크기 (xl × tall)',
    size: 'xl',
    height: 'tall',
    note: 'QA 기본 폭 1140 × 높이 80vh 고정 — 내용이 적어도 창 크기가 흔들리지 않는다.',
  },
  {
    id: 'full',
    label: '거의 풀사이즈 (full × full)',
    size: 'full',
    height: 'full',
    note: '좌우·상하 10px 만 남긴다. 어느 조합이든 max-h-[calc(100vh-20px)] 가 화면 밖으로 나가는 것을 막는다.',
  },
] as const;

type OpenId = (typeof SIZE_CASES)[number]['id'] | 'picker';

export function ContentPickerDemo() {
  const [open, setOpen] = useState<OpenId | null>(null);
  const sizeCase = SIZE_CASES.find((item) => item.id === open);

  return (
    <div className="flex flex-wrap gap-1.5">
      {SIZE_CASES.map((item) => (
        <Button key={item.id} onClick={() => setOpen(item.id)}>
          {item.label}
        </Button>
      ))}
      <Button variant="outline-primary" onClick={() => setOpen('picker')}>
        선택 모달
      </Button>

      {sizeCase && (
        <ContentDialog
          open
          onOpenChange={(next) => {
            if (!next) setOpen(null);
          }}
          title={sizeCase.label}
          description="무언가를 보는 창"
          size={sizeCase.size}
          height={sizeCase.height}
          footer={
            <Button variant="outline-strong" onClick={() => setOpen(null)}>
              닫기
            </Button>
          }
        >
          <p className="text-dl-base text-dl-fg">
            흰 헤더에 20px 제목을 두어 무엇을 보는 자리인지 알린다. 본문도 헤더·푸터와 같은 흰
            표면이고 내용이 길면 본문만 스크롤된다. 푸터 버튼은 폭 220 고정(QA).
          </p>
          <p className="text-dl-sm text-dl-fg-muted">{sizeCase.note}</p>
        </ContentDialog>
      )}

      <PickerDialog
        open={open === 'picker'}
        onOpenChange={(next) => setOpen(next ? 'picker' : null)}
        title="선택 모달"
        footer={
          <>
            <Button variant="outline-strong" onClick={() => setOpen(null)}>
              닫기
            </Button>
            <Button variant="primary" onClick={() => setOpen(null)}>
              등록
            </Button>
          </>
        }
      >
        <div className="rounded-dl-container border border-dl-border-soft bg-dl-surface p-4 text-dl-sm text-dl-fg">
          본문은 헤더·푸터와 같은 흰 표면이고, 안쪽 카드는 배경색이 아니라 보더·그림자로 구분된다.
          Esc 를 눌러도 닫히지 않는 것을 확인해 볼 것.
        </div>
      </PickerDialog>
    </div>
  );
}
