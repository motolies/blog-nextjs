'use client';

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';

const CATEGORIES = [
  { code: 'DEV', name: '개발', type: '기술', count: '128' },
  { code: 'FE', name: '프론트엔드', type: '기술', count: '74' },
  { code: 'ESSAY', name: '에세이', type: '일반', count: '36' },
  { code: 'REVIEW', name: '리뷰', type: '일반', count: '22' },
] as const;

/** 기본 표 — md 밀도 + 행 hover. 열 머리가 있고 행이 같은 축의 자료라 표다. */
export function TableBasicDemo() {
  return (
    <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
      <Table hover>
        <TableHead>
          <TableRow>
            <TableHeaderCell>코드</TableHeaderCell>
            <TableHeaderCell>카테고리</TableHeaderCell>
            <TableHeaderCell>구분</TableHeaderCell>
            <TableHeaderCell>게시글 수</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {CATEGORIES.map((category) => (
            <TableRow key={category.code}>
              <TableCell className="font-dl-mono">{category.code}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.type}</TableCell>
              <TableCell>{category.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** sm 밀도 — 패딩·글자만 줄어든다. 그리드 밀도 5단과 달리 정적 표는 2단이면 충분하다. */
export function TableDenseDemo() {
  return (
    <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeaderCell>코드</TableHeaderCell>
            <TableHeaderCell>카테고리</TableHeaderCell>
            <TableHeaderCell>구분</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {CATEGORIES.map((category) => (
            <TableRow key={category.code}>
              <TableCell className="font-dl-mono">{category.code}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
