'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@hvy/ui';

/** 기본 아코디언 — single collapsible. 트리거 화살표는 컴포넌트가 자동으로 그린다. */
export function AccordionBasicDemo() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-lg">
      <AccordionItem value="what">
        <AccordionTrigger>아코디언은 언제 쓰나</AccordionTrigger>
        <AccordionContent>
          가이드·도움말처럼 기본은 접어 두고 필요할 때만 펼치는 본문에 쓴다. 항상 보여야 하는
          내용이라면 접지 않는 것이 맞다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="how">
        <AccordionTrigger>키보드 조작</AccordionTrigger>
        <AccordionContent>
          Tab 으로 트리거 사이를 이동하고 Enter/Space 로 토글한다 — radix 가 맡는 영역이다.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="multi">
        <AccordionTrigger>여러 개를 동시에 열려면</AccordionTrigger>
        <AccordionContent>
          <code className="font-dl-mono">type=&quot;multiple&quot;</code> 을 쓴다. single +
          collapsible 은 한 번에 하나만 연다.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
