import type { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { AccordionBasicDemo } from '../../client/ui-test/docs/demos/accordion/basic';
import { AccordionCompositionDemo } from '../../client/ui-test/docs/demos/accordion/composition';
import { AccordionMultipleDemo } from '../../client/ui-test/docs/demos/accordion/multiple';
import { AccordionStatesDemo } from '../../client/ui-test/docs/demos/accordion/states';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@hvy/ui';

<Accordion type="single" collapsible>
  <AccordionItem value="guide">
    <AccordionTrigger>가이드</AccordionTrigger>
    <AccordionContent>기본은 접어 두는 본문…</AccordionContent>
  </AccordionItem>
</Accordion>`;

/**
 * root 의 props 는 `type` 이 판별자인 **유니온**이다. `keyof (A | B)` 는 공통 키만 남기므로
 * 통짜로 `definePropRows` 에 넣으면 single 전용인 `collapsible` 이 거부된다.
 * 가드를 버리는 대신 유니온을 분기로 편다 — 표가 둘로 나뉘는 편이 오히려 정확하다.
 * single 과 multiple 은 값 타입까지 다른 **사실상 두 컴포넌트**이고, 그 사실이 문서에 드러난다.
 */
type AccordionSingle = Extract<ComponentProps<typeof Accordion>, { type: 'single' }>;
type AccordionMultiple = Extract<ComponentProps<typeof Accordion>, { type: 'multiple' }>;

/** 아코디언 문서 — blog 추가분(조합형 4파트). */
export const accordionDoc: DocEntry = {
  slug: 'accordion',
  category: 'components',
  title: 'Accordion',
  description:
    '접이식 본문 — 가이드·도움말처럼 기본은 접어 두고 필요할 때만 펼치는 내용에 쓴다. 조합형 4파트(shadcn 동형) API 를 유지하는 이유는 트리거 안에 아이콘·배지 등 자유 조합이 들어가는 화면 조합물이기 때문이다. 접근성(키보드·aria-expanded)은 radix 가, 배색·회전 화살표·열림 애니메이션은 여기가 맡는다. 접힌 본문은 DOM 에서 사라진다는 점이 선택 기준이다 — 페이지 내 검색(Ctrl+F)이 닿지 않으므로 항상 보여야 하는 내용은 애초에 접지 않는다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — single collapsible',
      note: '트리거 우측 화살표는 컴포넌트가 자동으로 그린다(열리면 180° 회전) — 사용처마다 직접 그리면 회전 규칙이 갈라진다.',
      file: 'src/client/ui-test/docs/demos/accordion/basic.tsx',
      Component: AccordionBasicDemo,
    },
    {
      id: 'multiple',
      title: 'type="multiple" vs single collapsible',
      note: '왼쪽(single + collapsible)은 하나를 열면 다른 하나가 닫히고, 열린 것을 다시 누르면 전부 닫힌다 — collapsible 을 빼면 마지막 하나는 닫히지 않는다(항상 하나는 열려 있다). 오른쪽(multiple)은 여러 개가 동시에 열린다. defaultValue·value 의 타입이 갈리는 것도 여기서 본다: single 은 문자열, multiple 은 배열이라 type 이 판별자인 유니온이고 잘못 주면 typecheck 가 잡는다. 「전부 펼치기」 버튼이 controlled 배선의 실례다.',
      file: 'src/client/ui-test/docs/demos/accordion/multiple.tsx',
      Component: AccordionMultipleDemo,
    },
    {
      id: 'composition',
      title: '트리거 자유 조합 — 4파트 API 를 유지한 이유',
      note: '트리거 안에 아이콘·배지·건수를 함께 넣어도 우측 화살표는 항상 오른쪽 끝에 남는다. 가운데 항목으로 긴 제목이 화살표를 밀어내지 않는지 확인할 것 — 트리거 자식에 min-w-0 이 없으면 flex 아이템의 자동 최소 폭이 내용 폭이라 화살표가 상자 밖으로 나간다. 마지막 항목처럼 본문에 표를 넣어도 열림 애니메이션이 성립한다. options 배열 API 로 굳혔다면 이 조합이 전부 불가능하다 — 4파트를 유지하는 근거가 이 예제 자체다.',
      file: 'src/client/ui-test/docs/demos/accordion/composition.tsx',
      Component: AccordionCompositionDemo,
    },
    {
      id: 'states',
      title: '상태와 경계 — 비활성 · 긴 본문 · 마지막 보더',
      note: 'disabled 항목은 label-disabled 글자에 cursor-not-allowed 이고 키보드로도 열리지 않는다. 긴 본문을 열고 닫으며 애니메이션이 튀지 않는지 본다 — 높이를 CSS 변수(--radix-accordion-content-height)로 받아 내용 길이와 무관하게 같은 시간에 끝난다. 마지막 항목만 하단 보더가 없어(last:border-b-0) 목록 끝에서 선이 겹치지 않는다.',
      file: 'src/client/ui-test/docs/demos/accordion/states.tsx',
      Component: AccordionStatesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Accordion (type="single")',
      rows: definePropRows<AccordionSingle>()([
        {
          name: 'type',
          type: "'single'",
          required: true,
          description: '한 번에 하나만 연다. 이 값이 아래 value 계열의 타입을 정하는 판별자다.',
        },
        {
          name: 'value',
          type: 'string',
          description:
            '열린 항목의 value — 주면 controlled 다. 열림 상태를 앱이 소유해야 하는 화면(검색 하이라이트 등)에서 쓴다.',
        },
        { name: 'defaultValue', type: 'string', description: '비제어 초기 열림 항목.' },
        {
          name: 'onValueChange',
          type: '(value: string) => void',
          description: 'controlled 배선의 짝.',
        },
        {
          name: 'collapsible',
          type: 'boolean',
          defaultValue: 'false',
          description:
            '열린 항목을 다시 눌러 **전부 닫을 수 있는가**. 끄면 마지막 하나는 닫히지 않는다 — 항상 무언가는 보여야 하는 화면의 선택이다.',
        },
        { name: 'disabled', type: 'boolean', description: '아코디언 전체 비활성.' },
        {
          name: 'orientation',
          type: "'vertical' | 'horizontal'",
          defaultValue: "'vertical'",
          description: '방향키 이동 축을 정한다. 세로 목록이 기본이다.',
        },
        { name: 'dir', type: "'ltr' | 'rtl'", description: '읽기 방향 — 방향키 해석이 뒤집힌다.' },
      ]),
    },
    {
      title: 'Accordion (type="multiple")',
      rows: definePropRows<AccordionMultiple>()([
        {
          name: 'type',
          type: "'multiple'",
          required: true,
          description:
            '여러 항목이 동시에 열린다. collapsible 이 **없다** — 전부 닫는 것이 기본 동작이라 옵션이 아니다.',
        },
        {
          name: 'value',
          type: 'string[]',
          description: '열린 항목들의 value 배열 — single 과 타입이 갈리는 자리다.',
        },
        { name: 'defaultValue', type: 'string[]', description: '비제어 초기 열림 항목들.' },
        {
          name: 'onValueChange',
          type: '(value: string[]) => void',
          description: 'controlled 배선의 짝.',
        },
        { name: 'disabled', type: 'boolean', description: '아코디언 전체 비활성.' },
        {
          name: 'orientation',
          type: "'vertical' | 'horizontal'",
          defaultValue: "'vertical'",
          description: '방향키 이동 축.',
        },
        { name: 'dir', type: "'ltr' | 'rtl'", description: '읽기 방향.' },
      ]),
    },
    {
      title: 'AccordionItem',
      rows: definePropRows<ComponentProps<typeof AccordionItem>>()([
        {
          name: 'value',
          type: 'string',
          required: true,
          description:
            '항목 식별자 — 아코디언 안에서 유일해야 한다. 열림 상태가 이 값으로 표현된다.',
        },
        {
          name: 'disabled',
          type: 'boolean',
          description: '이 항목만 비활성 — 클릭도 키보드도 열지 못한다.',
        },
        {
          name: 'className',
          type: 'string',
          description: '기본은 하단 보더(마지막 항목 제외) — 목록 끝에서 선이 겹치지 않게 한다.',
        },
      ]),
    },
    {
      title: 'AccordionTrigger',
      rows: definePropRows<ComponentProps<typeof AccordionTrigger>>()([
        {
          name: 'children',
          type: 'ReactNode',
          description:
            '아이콘·배지·건수를 자유롭게 조합한다. 우측 화살표는 컴포넌트가 그리므로 넣지 않는다 — 직접 그리면 회전 규칙이 화면마다 갈라진다. 긴 제목에는 min-w-0 + truncate 가 필요하다.',
        },
        { name: 'disabled', type: 'boolean', description: '이 트리거만 비활성.' },
        { name: 'className', type: 'string', description: '' },
      ]),
    },
    {
      title: 'AccordionContent',
      rows: definePropRows<ComponentProps<typeof AccordionContent>>()([
        {
          name: 'children',
          type: 'ReactNode',
          description:
            '표·폼 같은 블록도 들어간다 — 높이를 CSS 변수로 받아 애니메이션하므로 내용 길이와 무관하게 같은 시간에 열린다.',
        },
        {
          name: 'forceMount',
          type: 'boolean',
          description:
            '닫혀 있어도 DOM 에 남긴다. 접힌 본문은 기본적으로 사라져 페이지 내 검색(Ctrl+F)이 닿지 않는데, 그게 곤란할 때의 탈출구다.',
        },
        { name: 'className', type: 'string', description: '본문 여백을 덮는다.' },
      ]),
    },
  ],
};
