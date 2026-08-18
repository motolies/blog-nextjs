import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

/**
 * 정적 시멘틱 표 — **DataGrid 가 아니다.**
 *
 * DataGrid(가상 스크롤·서버 페이징·컬럼 설정)는 수백 행의 조회 결과용이라
 * 5~20행 참조 데이터(코드표·요약표·API 레퍼런스)에는 과잉이고, 그 자리마다
 * 앱이 raw `<table>` 을 그리면서 밀도·보더 언어가 갈리던 것을 흡수한다.
 * 시멘틱 `<table>` 을 유지하는 이유: 스크린리더의 표 탐색(행·열 머리 낭독)이
 * 이 컴포넌트의 존재 이유다 — div 격자로 바꾸면 그게 사라진다.
 *
 * 라벨·값 쌍의 상세 폼은 이게 아니라 `FormGrid` 다(열 머리가 있고 행이 같은
 * 축의 자료일 때만 표다 — props-table.tsx 에 있던 판정 기준).
 *
 * 밀도는 2단(sm·md)만 둔다 — 그리드 밀도 5단은 가상 스크롤 행 높이 계약이
 * 필요해서고, 정적 표는 내용 높이를 따라가므로 패딩 축만 있으면 된다.
 * 크기 축은 루트에서 자손 셀렉터로 내린다 — 셀마다 context 를 읽지 않아
 * `'use client'` 없이 RSC 에서 그대로 쓴다(Badge 와 같은 이유).
 */

export type TableSize = 'sm' | 'md';

const SIZE_CLASS: Readonly<Record<TableSize, string>> = {
  sm: 'text-dl-xs [&_td]:px-3 [&_td]:py-1.5 [&_th]:px-3 [&_th]:py-1.5',
  md: 'text-dl-sm [&_td]:px-4 [&_td]:py-2.5 [&_th]:px-4 [&_th]:py-2.5',
};

export type TableProps = {
  readonly size?: TableSize;
  /** 본문 행 hover 배경 — 행 단위로 읽는 표에만 켠다. */
  readonly hover?: boolean;
} & HTMLAttributes<HTMLTableElement>;

export function Table({ size = 'md', hover, className, ...props }: TableProps) {
  return (
    <table
      className={cn(
        'w-full border-collapse text-left',
        SIZE_CLASS[size],
        hover && '[&_tbody_tr:hover]:bg-dl-option-hover',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-dl-grid-header', className)} {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-dl-divider last:border-b-0', className)} {...props} />;
}

/** 열 머리 — `scope="col"` 기본. 행 머리로 쓰면 호출부가 `scope="row"` 로 덮는다. */
export function TableHeaderCell({
  className,
  scope = 'col',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn('whitespace-nowrap font-semibold text-dl-grid-header-fg', className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('align-top text-dl-fg', className)} {...props} />;
}
