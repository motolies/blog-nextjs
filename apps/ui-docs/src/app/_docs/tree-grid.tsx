import type { TreeGrid } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { TreeGridBasicDemo } from '../../client/ui-test/docs/demos/tree-grid/basic';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { TreeGrid } from '@hvy/ui';

<TreeGrid
  nodes={nodes}                    // { children?: [...] } 재귀 구조
  getRowId={(node) => node.id}
  expanded={expanded}              // controlled Set — 호출부가 소유
  onToggle={toggle}
  collapseLabel="접기" expandLabel="펼치기"
  renderRow={(node) => <>…</>}
/>`;

/** 제네릭 컴포넌트라 T 를 명시해 인스턴스화한다 — 추론만으로는 ComponentProps 가 열리지 않는다. */
type TreeGridProps = ComponentProps<typeof TreeGrid<Record<string, unknown>>>;

/** TreeGrid 문서 — 계층 데이터 재귀 렌더러. */
export const treeGridDoc: DocEntry = {
  slug: 'tree-grid',
  category: 'components',
  title: 'TreeGrid',
  description:
    '계층 데이터 렌더러 — 가상 스크롤도 컬럼도 없는 재귀 구조라 DataGrid 와 완전히 다른 컴포넌트다. 펼침 상태(expanded)가 controlled Set 이라 "모두 펼치기/접기"가 상태 교체 한 번이다. 실전 사용처는 카테고리 트리(`apps/blog` 의 CategoryTreeView)처럼 계층 자체가 자료인 화면이다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '계층 데이터 — 펼침 상태는 호출부가 소유한다',
      note: '모두 펼치기/접기 버튼이 Set 교체 한 번으로 동작하는 것을 확인한다. "노드 비우기" 로 빈 상태도 본다 — DataGrid 와 같은 GridEmpty 계약이다.',
      file: 'src/client/ui-test/docs/demos/tree-grid/basic.tsx',
      Component: TreeGridBasicDemo,
    },
  ],
  propsTables: [
    {
      title: 'TreeGrid',
      rows: definePropRows<TreeGridProps>()([
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
          name: 'expanded',
          type: 'ReadonlySet<string>',
          required: true,
          description:
            '펼쳐진 노드 id 집합 — 펼침 상태는 호출부가 소유한다(controlled). Set 이라 "모두 펼치기/접기" 가 상태 교체 한 번이다.',
        },
        {
          name: 'onToggle',
          type: '(id: string) => void',
          required: true,
          description: '토글 요청 — 컴포넌트는 상태를 갖지 않으므로 호출부가 Set 을 갱신한다.',
        },
        {
          name: 'renderRow',
          type: '(node: T) => ReactNode',
          required: true,
          description: '행 내용 — 컬럼 개념이 없어 자유 렌더다.',
        },
        {
          name: 'empty',
          type: 'GridEmpty — { state?, title, hint?, icon?, action? }',
          description:
            'DataGrid 와 같은 계약이다 — 두 그리드의 "없음"이 화면마다 달라 보이면 안 된다. 생략해도 기본 문구가 나온다(예전에는 nodes 가 비면 아무것도 그리지 않았다). 오버레이가 아니라 흐름 배치인 이유는 헤더도 고정 높이도 없어서고, isFetching 이 없어 로딩 상태를 받지 않는다.',
        },
        {
          name: 'collapseLabel',
          type: 'string',
          required: true,
          description: '접기 버튼의 스크린리더 라벨 — 아이콘 단독이라 없으면 빈 버튼이 된다.',
        },
        {
          name: 'expandLabel',
          type: 'string',
          required: true,
          description: '펼치기 버튼의 스크린리더 라벨.',
        },
      ]),
    },
  ],
};
