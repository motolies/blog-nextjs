import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';
import type { PropsTableDef } from './types';

/**
 * API 레퍼런스 Props 표(RSC) — 수동 정의를 그대로 그린다.
 * 여기는 진짜 표라서 `Table` 이다(열 머리가 있고 행이 같은 축의 자료다) —
 * 라벨·값 쌍인 상세 폼과 다르고, 그쪽은 `FormGrid` 라는 div 격자를 쓴다.
 * raw `<table>` 을 그리던 것을 `@hvy/ui` `Table` 로 교체했다 — 도그푸딩 소비자 1호.
 * 표 내용의 부패는 definePropRows 의 keyof 가드가 잡는다(types.ts).
 */
export function PropsTable({ def }: { readonly def: PropsTableDef }) {
  return (
    <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
      <div className="border-b border-dl-divider px-4 py-3">
        <span className="font-dl-mono font-bold text-dl-fg-strong text-dl-md">{def.title}</span>
      </div>
      <Table size="sm">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Prop</TableHeaderCell>
            <TableHeaderCell>타입</TableHeaderCell>
            <TableHeaderCell>기본값</TableHeaderCell>
            <TableHeaderCell>설명</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {def.rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="whitespace-nowrap font-dl-mono">
                {row.name}
                {row.required ? <span className="text-dl-danger">*</span> : null}
              </TableCell>
              <TableCell className="font-dl-mono text-dl-fg-muted">{row.type}</TableCell>
              <TableCell className="whitespace-nowrap font-dl-mono text-dl-fg-muted">
                {row.defaultValue ?? '—'}
              </TableCell>
              <TableCell>{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
