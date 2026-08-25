'use client';

import { DataGrid, defineColumns } from '@hvy/ui';

type Row = {
  readonly id: string;
  readonly postId: string;
  readonly imageCount: number;
  readonly viewCount: number;
};

const ROWS: readonly Row[] = [
  { id: '1', postId: 'POST-2026-0001', imageCount: 3, viewCount: 45000 },
  { id: '2', postId: 'POST-2026-0002', imageCount: 1, viewCount: 12000 },
  { id: '3', postId: 'POST-2026-0003', imageCount: 7, viewCount: 98000 },
  { id: '4', postId: 'POST-2026-0004', imageCount: 2, viewCount: 30000 },
];

const HEADER: Record<string, string> = {
  postid: '게시글 ID',
  images: '이미지',
  views: '조회수',
};

const numberFormat = new Intl.NumberFormat('ko-KR');

const COLUMNS = defineColumns<Row>([
  { id: 'postId', headerWord: 'postid', width: 180, pinned: true },
  {
    id: 'imageCount',
    headerWord: 'images',
    width: 320,
    align: 'right',
    format: (v) => numberFormat.format(v as number),
  },
  {
    id: 'viewCount',
    headerWord: 'views',
    width: 320,
    align: 'right',
    format: (v) => numberFormat.format(v as number),
  },
]);

/**
 * 합계행 — 값은 호출부가 계산해 넘긴다. 서버 페이징이라 전체 합계는 서버만 안다 —
 * 그리드가 보이는 행을 합산하면 "페이지 합계"를 전체로 오독하는 사고가 된다
 * (이 데모는 페이징이 없어 직접 합산했다).
 */
export function DataGridFooterDemo() {
  const totalImages = ROWS.reduce((sum, row) => sum + row.imageCount, 0);
  const totalViews = ROWS.reduce((sum, row) => sum + row.viewCount, 0);
  return (
    <DataGrid
      columns={COLUMNS}
      rows={ROWS}
      getRowId={(row) => row.id}
      translateHeader={(code) => HEADER[code] ?? code}
      maxHeight={260}
      footer={{
        cells: {
          postId: '합계',
          imageCount: numberFormat.format(totalImages),
          viewCount: numberFormat.format(totalViews),
        },
      }}
    />
  );
}
