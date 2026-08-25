'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button } from '@hvy/ui';
import { useState } from 'react';

/**
 * type 이 갈리는 지점 — single(+collapsible) vs multiple.
 *
 * 검증 포인트:
 * · `type` 이 판별자인 유니온이라 `defaultValue`/`value` 의 타입이 함께 갈린다
 *   (single 은 문자열, multiple 은 배열) — 잘못 주면 typecheck 가 잡는다
 * · collapsible 을 빼면 single 은 **마지막 하나가 닫히지 않는다**(항상 하나는 열려 있다)
 * · 오른쪽의 「전부 펼치기」는 value/onValueChange controlled 배선이다 —
 *   열림 상태를 앱이 소유해야 하는 화면(검색 결과 하이라이트 등)이 이 형태다
 */

const ITEMS = [
  {
    value: 'draft',
    title: '초안은 어디에 저장되나',
    body: '자동 저장은 로컬에 먼저 쌓이고, 발행 시점에 서버 본문을 덮는다.',
  },
  {
    value: 'tag',
    title: '태그는 몇 개까지',
    body: '목록 화면의 태그 열이 한 줄에 담아내는 한계에서 상한이 왔다.',
  },
  {
    value: 'series',
    title: '시리즈와 카테고리의 차이',
    body: '카테고리는 트리 한 자리, 시리즈는 순서가 있는 묶음이다.',
  },
];

export function AccordionMultipleDemo() {
  const [open, setOpen] = useState<string[]>([]);

  return (
    <div className="grid w-full gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <h4 className="text-dl-xs font-semibold text-dl-fg-strong">
          single + collapsible — 하나만, 다시 누르면 전부 닫힘
        </h4>
        <Accordion type="single" collapsible>
          {ITEMS.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>{item.body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-dl-xs font-semibold text-dl-fg-strong">
            multiple — 여러 개 동시에 (controlled)
          </h4>
          <Button
            size="xs"
            variant="outline-gray"
            onClick={() =>
              setOpen((previous) =>
                previous.length === ITEMS.length ? [] : ITEMS.map((item) => item.value),
              )
            }
          >
            {open.length === ITEMS.length ? '전부 접기' : '전부 펼치기'}
          </Button>
        </div>
        {/* multiple 의 value 는 **배열**이다 — single 과 타입이 갈리는 자리다. */}
        <Accordion type="multiple" value={open} onValueChange={setOpen}>
          {ITEMS.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.title}</AccordionTrigger>
              <AccordionContent>{item.body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
