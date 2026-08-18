import type { IconProps } from '@hvy/ui';
import { IconsAllDemo } from '../../client/ui-test/docs/demos/icons/all';
import { IconsSizesDemo } from '../../client/ui-test/docs/demos/icons/sizes';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Icon } from '@hvy/ui';
import { Search, FileSpreadsheet } from 'lucide-react';

<Icon icon={Search} size="sm" />          // 색은 부모의 currentColor 를 따른다
<span className="text-dl-excel"><Icon icon={FileSpreadsheet} /></span>   // 고정색은 부모가 준다`;

/** 아이콘 문서 — lucide-react 를 <Icon icon={...}> 전달형 래퍼로 쓴다. */
export const iconsDoc: DocEntry = {
  slug: 'icons',
  category: 'foundations',
  title: 'Icons',
  description:
    '아이콘은 lucide-react(peer)에서 직접 import 해 icon prop 으로 전달한다 — 문자열 레지스트리를 두지 않아 트리셰이킹이 유지된다(원본 @deleo/ui 의 자체 스프라이트를 blog 결정으로 lucide 전달형으로 개조). 래퍼가 남는 이유는 크기 토큰(size-dl-ic-*)과 a11y 규약 때문이다. 색은 받지 않는다 — 버튼이 정하고 아이콘은 currentColor 로 따라간다.',
  usage: USAGE,
  examples: [
    {
      id: 'all',
      title: '사용 예 — 대표 아이콘',
      note: '앱에서 쓰는 대표 lucide 아이콘을 <Icon icon> 으로 그린다. 칩에 마우스를 올리면 primary 로 바뀌는 것으로 currentColor 를 확인한다.',
      file: 'src/client/ui-test/docs/demos/icons/all.tsx',
      Component: IconsAllDemo,
    },
    {
      id: 'sizes',
      title: '크기 3단 — 16 · 20 · 24 (+ 자물쇠 12)',
      note: 'is-16 / is-20 / is-24 그대로다. 자물쇠(12)만 상태 표시 예외.',
      file: 'src/client/ui-test/docs/demos/icons/sizes.tsx',
      Component: IconsSizesDemo,
    },
  ],
  propsTables: [
    {
      title: 'Icon',
      rows: definePropRows<IconProps>()([
        {
          name: 'icon',
          type: 'LucideIcon',
          required: true,
          description:
            'lucide-react 아이콘 컴포넌트 참조 — 없는 아이콘은 import 에러라 오타가 컴파일 에러다.',
        },
        {
          name: 'size',
          type: "'sm' | 'md' | 'lg' | 'lock'",
          defaultValue: "'sm'",
          description: '16 · 20 · 24 · 12(자물쇠 전용).',
        },
        {
          name: 'title',
          type: 'string',
          description:
            '있으면 role="img" + aria-label, 없으면 aria-hidden. 라벨 옆 장식 아이콘은 넣지 않는 것이 맞다 — 스크린리더가 라벨을 두 번 읽는다.',
        },
      ]),
    },
  ],
};
