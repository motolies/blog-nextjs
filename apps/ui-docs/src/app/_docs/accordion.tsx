import { AccordionBasicDemo } from '../../client/ui-test/docs/demos/accordion/basic';
import type { DocEntry } from './types';

const USAGE = `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@hvy/ui';

<Accordion type="single" collapsible>
  <AccordionItem value="guide">
    <AccordionTrigger>가이드</AccordionTrigger>
    <AccordionContent>기본은 접어 두는 본문…</AccordionContent>
  </AccordionItem>
</Accordion>`;

/** 아코디언 문서 — blog 추가분(조합형 4파트). */
export const accordionDoc: DocEntry = {
  slug: 'accordion',
  category: 'components',
  title: 'Accordion',
  description:
    '접이식 본문 — 가이드·도움말처럼 기본은 접어 두고 필요할 때만 펼치는 내용에 쓴다. 조합형 4파트(shadcn 동형) API 를 유지하는 이유는 트리거 안에 아이콘·배지 등 자유 조합이 들어가는 화면 조합물이기 때문이다. 접근성(키보드·aria-expanded)은 radix 가, 배색·회전 화살표·열림 애니메이션은 여기가 맡는다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — single collapsible',
      note: '트리거 우측 화살표는 컴포넌트가 자동으로 그린다(열리면 180° 회전) — 사용처마다 직접 그리면 회전 규칙이 갈라진다.',
      file: 'src/client/ui-test/docs/demos/accordion/basic.tsx',
      Component: AccordionBasicDemo,
    },
  ],
  propsTables: [],
};
