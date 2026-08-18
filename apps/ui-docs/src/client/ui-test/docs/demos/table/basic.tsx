'use client';

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';

const CARRIERS = [
  { code: 'CJT', name: 'CJ대한통운', type: '택배', lead: '1~2일' },
  { code: 'LTT', name: '롯데택배', type: '택배', lead: '1~2일' },
  { code: 'EMS', name: '우체국 EMS', type: '국제특송', lead: '3~7일' },
  { code: 'FDX', name: 'FedEx', type: '국제특송', lead: '2~5일' },
] as const;

/** 기본 표 — md 밀도 + 행 hover. 열 머리가 있고 행이 같은 축의 자료라 표다. */
export function TableBasicDemo() {
  return (
    <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
      <Table hover>
        <TableHead>
          <TableRow>
            <TableHeaderCell>코드</TableHeaderCell>
            <TableHeaderCell>배송사</TableHeaderCell>
            <TableHeaderCell>구분</TableHeaderCell>
            <TableHeaderCell>리드타임</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {CARRIERS.map((carrier) => (
            <TableRow key={carrier.code}>
              <TableCell className="font-dl-mono">{carrier.code}</TableCell>
              <TableCell>{carrier.name}</TableCell>
              <TableCell>{carrier.type}</TableCell>
              <TableCell>{carrier.lead}</TableCell>
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
            <TableHeaderCell>배송사</TableHeaderCell>
            <TableHeaderCell>구분</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {CARRIERS.map((carrier) => (
            <TableRow key={carrier.code}>
              <TableCell className="font-dl-mono">{carrier.code}</TableCell>
              <TableCell>{carrier.name}</TableCell>
              <TableCell>{carrier.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
