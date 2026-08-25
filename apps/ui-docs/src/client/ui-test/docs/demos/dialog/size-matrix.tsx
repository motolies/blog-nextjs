'use client';

import { Button, ContentDialog } from '@hvy/ui';
import { useState } from 'react';

/**
 * 콘텐츠 모달 크기 — size 5단 × height 3단 **전수**.
 *
 * 열린 것을 하나의 state 로 관리한다 — 조합마다 boolean 을 늘리면 "한 번에 하나만 열린다"를
 * 코드가 보장하지 못하고, 겹치면 개발 경고가 난다(겹침 예제 참조).
 *
 * 검증 포인트:
 * · 폭과 높이는 **직교한다** — xl×auto(넓고 짧은 창)와 sm×full(좁고 긴 창)이 둘 다 성립해야 한다
 * · auto 는 내용만큼, tall 은 80vh 고정, full 은 화면 가득이다
 * · 어느 조합이든 `max-h-[calc(100vh-20px)]` 를 넘지 않는다 — **브라우저 창을 세로로 줄여 가며**
 *   15칸을 훑어 볼 것
 * · size="full" 은 좌우 10px 만 남긴다: base 에 `w-[92vw]` 가 남아 있으면 1440 뷰포트에서
 *   1325px 로 잘린다(실제로 났던 사고이자 이 예제가 지키는 회귀다)
 * · 상단 테마를 compact 로 바꿔도 폭 단계가 무너지지 않는다
 */
const SIZES = ['sm', 'md', 'lg', 'xl', 'full'] as const;
const HEIGHTS = ['auto', 'tall', 'full'] as const;

type Combo = { readonly size: (typeof SIZES)[number]; readonly height: (typeof HEIGHTS)[number] };

/** 높이 축을 눈으로 보려면 본문이 넉넉해야 한다 — auto 와 tall 의 차이가 내용 길이에서 갈린다. */
const PARAGRAPHS = Array.from({ length: 8 }, (_, index) => index + 1);

export function DialogSizeMatrixDemo() {
  const [combo, setCombo] = useState<Combo | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <table className="text-dl-xs">
        <thead>
          <tr className="text-dl-fg-muted">
            <th className="px-2 py-1 text-left font-medium">size \ height</th>
            {HEIGHTS.map((height) => (
              <th key={height} className="px-2 py-1 text-left font-medium">
                {height}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SIZES.map((size) => (
            <tr key={size}>
              <td className="px-2 py-1 font-dl-mono text-dl-fg-muted">{size}</td>
              {HEIGHTS.map((height) => (
                <td key={height} className="px-2 py-1">
                  <Button
                    size="xs"
                    variant="outline-gray"
                    onClick={() => setCombo({ size, height })}
                  >
                    열기
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ContentDialog
        open={combo !== null}
        onOpenChange={(next) => !next && setCombo(null)}
        title={combo ? `size="${combo.size}" · height="${combo.height}"` : ''}
        description="폭과 높이는 직교한다 — 어느 조합이든 화면 밖으로 나가지 않아야 한다."
        size={combo?.size}
        height={combo?.height}
        footer={
          <Button variant="outline-strong" onClick={() => setCombo(null)}>
            닫기
          </Button>
        }
      >
        <div className="flex flex-col gap-2 text-dl-sm text-dl-fg">
          {PARAGRAPHS.map((line) => (
            <p key={line}>
              {line}번째 문단. height="auto" 면 이 내용 길이가 창 높이를 정하고, tall·full 이면 창
              높이가 먼저 정해진 뒤 본문만 스크롤된다.
            </p>
          ))}
        </div>
      </ContentDialog>
    </div>
  );
}
