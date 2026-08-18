import type { BadgeProps } from '@hvy/ui';
import { BadgePlaygroundDemo } from '../../client/ui-test/docs/demos/badge/playground';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Badge } from '@hvy/ui';

<Badge tone="success">배송완료</Badge>`;

/** Badge 문서 — 5톤을 진행 국면으로 나눈다. */
export const badgeDoc: DocEntry = {
  slug: 'badge',
  category: 'components',
  title: 'Badge',
  description:
    '상태 배지 — 색은 진행 국면으로 나눈다: 접수 전/진행(틸) · 전환·보류(주황) · 완료(초록) · 종료(회색) · 비정상(빨강). cva 변형이 필요하면 badgeVariants 로 클래스 문자열만 얻을 수 있다.',
  usage: USAGE,
  examples: [
    {
      id: 'playground',
      title: 'Badge',
      note: '5톤 전환 + 주문상태 → tone 매핑 예시(목데이터의 DEMO_STATUS_META).',
      file: 'src/client/ui-test/docs/demos/badge/playground.tsx',
      Component: BadgePlaygroundDemo,
    },
  ],
  propsTables: [
    {
      title: 'Badge',
      rows: definePropRows<BadgeProps>()([
        {
          name: 'tone',
          type: "'neutral' | 'primary' | 'success' | 'warning' | 'danger'",
          defaultValue: "'neutral'",
          description: '진행 국면별 배색.',
        },
        {
          name: 'size',
          type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
          defaultValue: "'md'",
          description: '높이 5단(기본 md 가 QA 19). 폰트는 md 까지 QA 12 유지, lg/xl 만 13.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: '배지 문구.',
        },
      ]),
    },
  ],
};
