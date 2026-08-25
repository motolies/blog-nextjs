'use client';

import { Button, ContentDialog, Field, FormGrid, Input } from '@hvy/ui';
import { useState } from 'react';

/**
 * 콘텐츠 모달 — 헤더·본문·푸터 3단 구조와 **본문만 스크롤**.
 *
 * 검증 포인트:
 * · 본문이 길어도 헤더·푸터는 제자리에 남고 **본문만** 스크롤된다
 * · 제목이 길면 잘리고(truncate) 닫기 버튼을 밀어내지 않는다 — 오른쪽 데모로 확인
 * · description 을 주면 제목 아래 보조 줄이 생기고, 안 주면 Radix 경고를 막는 sr-only
 *   Description 이 대신 들어간다 — **콘솔에 Description 경고가 없어야 한다**
 * · 푸터 버튼은 폭 220 고정이라 글자 수가 달라도 두 버튼 폭이 같다
 *   (알림형이 flex-1 로 반씩 나눠 갖는 것과 **다른 규격**이다)
 * · 헤더·본문·푸터가 모두 같은 흰 표면이다 — 본문을 회색 캔버스로 두면 잠금 배경과
 *   한 단 차이라 "비활성"으로 읽힌다. 안쪽 카드는 배경색이 아니라 보더로 구분되는지 본다
 */
const ROWS = Array.from({ length: 14 }, (_, index) => index + 1);

export function DialogContentScrollDemo() {
  const [open, setOpen] = useState<'scroll' | 'longTitle' | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="outline-gray" onClick={() => setOpen('scroll')}>
        긴 본문 — 본문만 스크롤
      </Button>
      <Button variant="outline-gray" onClick={() => setOpen('longTitle')}>
        긴 제목 — 닫기 버튼을 밀지 않는다
      </Button>

      <ContentDialog
        open={open === 'scroll'}
        onOpenChange={(next) => !next && setOpen(null)}
        title="게시글 설정"
        description="헤더와 푸터는 고정이고 이 아래 본문만 스크롤된다."
        size="lg"
        height="tall"
        footer={
          <>
            <Button variant="outline-strong" onClick={() => setOpen(null)}>
              취소
            </Button>
            <Button variant="primary" onClick={() => setOpen(null)}>
              저장
            </Button>
          </>
        }
      >
        <FormGrid>
          {ROWS.map((row) => (
            <Field key={row} label={`설정 항목 ${row}`} htmlFor={`dlg-row-${row}`}>
              <Input id={`dlg-row-${row}`} defaultValue={`값 ${row}`} />
            </Field>
          ))}
        </FormGrid>
      </ContentDialog>

      <ContentDialog
        open={open === 'longTitle'}
        onOpenChange={(next) => !next && setOpen(null)}
        title="아주 긴 제목이 들어간 모달 — 제목이 길어도 우상단 닫기 버튼이 밖으로 밀려나지 않아야 한다"
        size="md"
        footer={
          <Button variant="outline-strong" onClick={() => setOpen(null)}>
            닫기
          </Button>
        }
      >
        {/* description 을 주지 않은 경우 — 콘솔에 Radix Description 경고가 없어야 한다. */}
        <p className="text-dl-sm text-dl-fg">
          이 모달은 description 을 주지 않았다. 그래도 접근성 이름을 위해 sr-only Description 이
          제목으로 채워지므로 콘솔 경고가 나지 않는다.
        </p>
      </ContentDialog>
    </div>
  );
}
