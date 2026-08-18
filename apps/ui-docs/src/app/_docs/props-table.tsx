import type { PropsTableDef } from './types';

/**
 * API 레퍼런스 Props 표(RSC) — 수동 정의를 그대로 그린다.
 * 여기는 진짜 표라서 `<table>` 이다(열 머리가 있고 행이 같은 축의 자료다) —
 * 라벨·값 쌍인 상세 폼과 다르고, 그쪽은 `FormGrid` 라는 div 격자를 쓴다.
 * 표 내용의 부패는 definePropRows 의 keyof 가드가 잡는다(types.ts).
 */
export function PropsTable({ def }: { readonly def: PropsTableDef }) {
  return (
    <div className="overflow-x-auto rounded-dl-container border border-dl-border bg-dl-surface">
      <div className="border-b border-dl-divider px-4 py-3">
        <span className="font-dl-mono text-dl-md font-bold text-dl-fg-strong">{def.title}</span>
      </div>
      <table className="w-full border-collapse text-left text-dl-sm">
        <thead>
          <tr className="border-b border-dl-divider text-dl-xs text-dl-fg-muted">
            <th className="px-4 py-2 font-semibold">Prop</th>
            <th className="px-4 py-2 font-semibold">타입</th>
            <th className="px-4 py-2 font-semibold">기본값</th>
            <th className="px-4 py-2 font-semibold">설명</th>
          </tr>
        </thead>
        <tbody>
          {def.rows.map((row) => (
            <tr key={row.name} className="border-b border-dl-divider align-top last:border-b-0">
              <td className="whitespace-nowrap px-4 py-2 font-dl-mono text-dl-fg">
                {row.name}
                {row.required ? <span className="text-dl-danger">*</span> : null}
              </td>
              <td className="px-4 py-2 font-dl-mono text-dl-fg-muted">{row.type}</td>
              <td className="whitespace-nowrap px-4 py-2 font-dl-mono text-dl-fg-muted">
                {row.defaultValue ?? '—'}
              </td>
              <td className="px-4 py-2 text-dl-fg">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
