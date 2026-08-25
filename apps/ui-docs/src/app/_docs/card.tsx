import type { Card, CardHeader } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { CardHeaderDemo } from '../../client/ui-test/docs/demos/card/header';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Card, CardHeader } from '@hvy/ui';

<Card>
  <CardHeader title="게시글 요약" actions={<Button variant="primary">저장</Button>} />
  본문
</Card>`;

/** Card · CardHeader 문서 — destructive 분리 배치 규칙이 핵심이다. */
export const cardDoc: DocEntry = {
  slug: 'card',
  category: 'components',
  title: 'Card',
  description:
    '섹션 카드와 그 헤더. destructive(삭제)는 actions 와 분리해 왼쪽 끝에 둔다 — 주 실행 옆은 오클릭 자리다(v3 §ds-06). 폼 카드(기본)는 안쪽 여백을 카드가 갖고, 그리드 패널(variant=grid)은 표가 카드 끝까지 닿도록 여백이 0 이다.',
  usage: USAGE,
  examples: [
    {
      id: 'header',
      title: 'Card · CardHeader',
      note: 'aside(배지) · destructive(왼쪽 끝) · actions(오른쪽) 의 3구역 배치를 확인한다.',
      file: 'src/client/ui-test/docs/demos/card/header.tsx',
      Component: CardHeaderDemo,
    },
  ],
  propsTables: [
    {
      title: 'Card',
      rows: definePropRows<ComponentProps<typeof Card>>()([
        {
          name: 'variant',
          type: "'form' | 'grid' | 'plain'",
          defaultValue: "'form'",
          description: 'form 은 카드가 안쪽 여백을 갖고, grid 는 표가 끝까지 닿도록 여백 0.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: '카드 내용.',
        },
      ]),
    },
    {
      title: 'CardHeader',
      rows: definePropRows<ComponentProps<typeof CardHeader>>()([
        {
          name: 'title',
          type: 'ReactNode',
          required: true,
          description: '카드 제목(16px).',
        },
        {
          name: 'aside',
          type: 'ReactNode',
          description: '제목 옆 보조 표시 — 배지·건수 등.',
        },
        {
          name: 'destructive',
          type: 'ReactNode',
          description: '파괴적 액션 자리 — actions 와 분리해 왼쪽 끝에 놓인다.',
        },
        {
          name: 'actions',
          type: 'ReactNode',
          description: '우측 액션 버튼 묶음.',
        },
      ]),
    },
  ],
};
