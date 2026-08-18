import type { Tooltip } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { LabelTooltipDemo } from '../../client/ui-test/docs/demos/tooltip/label-tooltip';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Icon, Tooltip } from '@hvy/ui';
import { CircleHelp } from 'lucide-react';

<Tooltip content="검색 가능 기준값 안내">
  <button type="button" aria-label="도움말">
    <Icon icon={CircleHelp} size="sm" />
  </button>
</Tooltip>`;

/** Tooltip 문서 — QA label-group 의 question 아이콘 패턴. */
export const tooltipDoc: DocEntry = {
  slug: 'tooltip',
  category: 'components',
  title: 'Tooltip',
  description:
    'Radix Tooltip 기반 — hover 뿐 아니라 키보드 포커스로도 열리고 Esc 로 닫힌다. 트리거는 asChild 로 감싸므로 단일 요소여야 하며, 대표 사용처는 레이블 옆 question 아이콘(QA label-group)이다.',
  usage: USAGE,
  examples: [
    {
      id: 'label-tooltip',
      title: '레이블 툴팁',
      note: 'QA label-group 패턴 — 레이블 옆 question 아이콘이 트리거다. 트리거는 버튼이라 키보드 포커스로도 열린다(Esc 로 닫힘).',
      file: 'src/client/ui-test/docs/demos/tooltip/label-tooltip.tsx',
      Component: LabelTooltipDemo,
    },
  ],
  propsTables: [
    {
      title: 'Tooltip',
      rows: definePropRows<ComponentProps<typeof Tooltip>>()([
        {
          name: 'content',
          type: 'ReactNode',
          required: true,
          description: '말풍선 내용. 개행(\\n)이 그대로 표시된다.',
        },
        {
          name: 'children',
          type: 'ReactNode',
          required: true,
          description: '트리거 — asChild 로 감싸므로 단일 요소여야 한다.',
        },
        {
          name: 'side',
          type: "'top' | 'right' | 'bottom' | 'left'",
          defaultValue: "'right'",
          description: '표시 방향.',
        },
        {
          name: 'delayDuration',
          type: 'number',
          defaultValue: '200',
          description: '열리기까지의 지연(ms).',
        },
      ]),
    },
  ],
};
