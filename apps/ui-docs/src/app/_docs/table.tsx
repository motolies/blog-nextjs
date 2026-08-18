import type { TableProps } from '@hvy/ui';
import { TableBasicDemo, TableDenseDemo } from '../../client/ui-test/docs/demos/table/basic';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@hvy/ui';

<Table hover>
  <TableHead>
    <TableRow>
      <TableHeaderCell>코드</TableHeaderCell>
      <TableHeaderCell>이름</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    <TableRow>
      <TableCell>CJT</TableCell>
      <TableCell>CJ대한통운</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

/** Table 문서 — 정적 시멘틱 표. DataGrid·FormGrid 와의 3자 구분이 존재 이유다. */
export const tableDoc: DocEntry = {
  slug: 'table',
  category: 'components',
  title: 'Table',
  description:
    '정적 시멘틱 표 — 5~20행 참조 데이터(코드표·요약표)용. 셋 중 무엇인지 먼저 가른다: 수백 행 조회 결과·서버 페이징·컬럼 설정이 필요하면 DataGrid, 라벨·값 쌍의 상세 폼이면 FormGrid(div 격자), 열 머리가 있고 행이 같은 축의 자료일 때만 이 Table 이다. 시멘틱 <table> 을 유지하는 이유는 스크린리더의 표 탐색(행·열 머리 낭독) — div 격자로 바꾸면 사라진다. 크기 축은 루트의 자손 셀렉터로 내리므로 use client 없이 RSC 에서 그대로 쓴다.',
  usage: USAGE,
  examples: [
    {
      id: 'basic',
      title: '기본 — md · hover',
      note: '테두리·overflow 래퍼는 호출부가 감싼다(문맥마다 카드·민짜가 갈린다). hover 는 행 단위로 읽는 표에만 켠다.',
      file: 'src/client/ui-test/docs/demos/table/basic.tsx',
      Component: TableBasicDemo,
    },
    {
      id: 'dense',
      title: 'sm 밀도',
      note: '정적 표는 내용 높이를 따라가므로 밀도 축이 그리드 5단이 아니라 2단(sm·md)이다 — 패딩·글자만 줄어든다.',
      file: 'src/client/ui-test/docs/demos/table/basic.tsx',
      Component: TableDenseDemo,
    },
  ],
  propsTables: [
    {
      title: 'Table',
      rows: definePropRows<TableProps>()([
        {
          name: 'size',
          type: "'sm' | 'md'",
          defaultValue: "'md'",
          description: '셀 패딩·글자 크기 2단 — 자손 셀렉터로 th/td 에 내린다.',
        },
        {
          name: 'hover',
          type: 'boolean',
          description: '본문(tbody) 행 hover 배경 — 행 단위로 읽는 표에만 켠다.',
        },
        {
          name: 'className',
          type: 'string',
          description: 'table 요소에 병합되는 클래스. 나머지 표준 table 속성도 통과한다.',
        },
      ]),
    },
  ],
};
