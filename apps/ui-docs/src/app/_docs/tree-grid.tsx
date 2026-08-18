import { TreeGridBasicDemo } from '../../client/ui-test/docs/demos/tree-grid/basic';
import type { DocEntry } from './types';

const USAGE = `import { TreeGrid } from '@hvy/ui';

<TreeGrid
  nodes={nodes}                    // { children?: [...] } 재귀 구조
  getRowId={(node) => node.id}
  expanded={expanded}              // controlled Set — 호출부가 소유
  onToggle={toggle}
  collapseLabel="접기" expandLabel="펼치기"
  renderRow={(node) => <>…</>}
/>`;

/** TreeGrid 문서 — 계층 데이터 재귀 렌더러. */
export const treeGridDoc: DocEntry = {
  slug: 'tree-grid',
  category: 'components',
  title: 'TreeGrid',
  description:
    '계층 데이터 렌더러 — 가상 스크롤도 컬럼도 없는 재귀 구조라 DataGrid 와 완전히 다른 컴포넌트다. 펼침 상태(expanded)가 controlled Set 이라 "모두 펼치기/접기"가 상태 교체 한 번이다. 실전 사용처는 주문이력 트리 모달(?trace=)이다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '계층 데이터 — 펼침 상태는 호출부가 소유한다',
      note: '모두 펼치기/접기 버튼이 Set 교체 한 번으로 동작하는 것을 확인한다.',
      file: 'src/client/ui-test/docs/demos/tree-grid/basic.tsx',
      Component: TreeGridBasicDemo,
    },
  ],
  propsTables: [
    {
      title: 'TreeGrid',
      rows: [
        {
          name: 'nodes',
          type: 'readonly T[]',
          required: true,
          description: 'children 재귀 구조의 루트 노드들.',
        },
        {
          name: 'getRowId',
          type: '(node: T) => string',
          required: true,
          description: '노드 식별자.',
        },
        {
          name: 'expanded / onToggle',
          type: 'ReadonlySet<string> / (id: string) => void',
          required: true,
          description: '펼침 상태는 호출부가 소유한다(controlled).',
        },
        {
          name: 'renderRow',
          type: '(node: T) => ReactNode',
          required: true,
          description: '행 내용 — 컬럼 개념이 없어 자유 렌더다.',
        },
        {
          name: 'collapseLabel / expandLabel',
          type: 'string',
          required: true,
          description: '토글 버튼의 스크린리더 라벨.',
        },
      ],
    },
  ],
};
