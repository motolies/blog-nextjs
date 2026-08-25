'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@hvy/ui';

/**
 * 상태와 경계 — 비활성 · 긴 본문 · 마지막 항목의 보더.
 *
 * 검증 포인트:
 * · disabled 항목은 label-disabled 글자에 cursor-not-allowed 이고 **키보드로도 열리지 않는다**
 * · 본문이 길어도 열림/닫힘 높이 애니메이션이 튀지 않는다
 *   (`--radix-accordion-content-height` 기반 dl-accordion-down/up)
 * · **마지막 항목만 하단 보더가 없다**(`last:border-b-0`) — 목록 끝에 선이 겹치지 않게 한다
 * · hover 에서 트리거 글자가 primary 로 바뀐다
 * · 접힌 본문은 DOM 에서 사라진다 — Ctrl+F 검색이 닿지 않으므로,
 *   **항상 보여야 하는 내용이면 애초에 접지 않는다**
 */
const LONG_BODY = Array.from({ length: 6 }, (_, index) => index + 1);

export function AccordionStatesDemo() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="normal">
        <AccordionTrigger>보통 항목 — hover 하면 글자가 primary 로</AccordionTrigger>
        <AccordionContent>짧은 본문.</AccordionContent>
      </AccordionItem>

      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>비활성 항목 — 눌러도 열리지 않는다</AccordionTrigger>
        <AccordionContent>여기는 보이지 않는다.</AccordionContent>
      </AccordionItem>

      <AccordionItem value="long">
        <AccordionTrigger>긴 본문 — 열고 닫으며 애니메이션이 튀는지 본다</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2">
            {LONG_BODY.map((line) => (
              <p key={line}>
                {line}번째 문단이다. 본문이 길수록 열림 높이가 커지는데, 높이를 CSS 변수로 받아
                애니메이션하므로 내용 길이와 무관하게 같은 시간에 끝난다.
              </p>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="last">
        <AccordionTrigger>마지막 항목 — 아래 보더가 없다</AccordionTrigger>
        <AccordionContent>목록 끝에서 선이 두 번 겹치지 않게 한다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
