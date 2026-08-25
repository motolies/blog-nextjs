'use client';

import { DataGrid, defineColumns } from '@hvy/ui';
import { useState } from 'react';
import { DEMO_POSTS, type DemoPost } from '../../../mock-posts';
import { BoolControl } from '../../../playground';

/**
 * 높이 ③ `'auto'` vs `number` — 같은 데이터에서 **스크롤이 어디에 생기는지**를 비교한다.
 *
 *  - 왼쪽 `maxHeight="auto"`: 상한이 없어 행 수만큼 늘어난다 → 57건이면 **문서(페이지) 스크롤**이
 *    생기고 헤더는 뷰포트에 붙지 않는다(sticky 의 기준이 그리드 안 스크롤 div 이기 때문).
 *    페이징 없는 집계표 전용이다 — 모든 행이 뷰포트 안이라 가상 스크롤이 사실상 꺼지므로
 *    수백 행짜리 목록에는 쓰지 않는다.
 *  - 오른쪽 `maxHeight={320}`: 320px 에서 멈추고 **안에서** 스크롤한다. 헤더 sticky 유지.
 *  - "행 3개만" 을 켜면 둘 다 내용 높이로 같아진다 — 상한은 넘칠 때만 작용한다.
 */

const COLUMNS = defineColumns<DemoPost>([
  { id: 'rowNum', headerWord: 'No', width: 56, sortable: false, resizable: false, pinned: true },
  { id: 'postId', headerWord: '게시글 ID', width: 130, pinned: true },
  { id: 'author', headerWord: '작성자', width: 100 },
  { id: 'writtenAt', headerWord: '작성일', width: 110, grow: 1 },
]);

const FEW_ROWS = DEMO_POSTS.slice(0, 3);

export function DataGridHeightAutoPxDemo() {
  const [fewRows, setFewRows] = useState(false);
  const rows = fewRows ? FEW_ROWS : DEMO_POSTS;

  return (
    <div className="flex flex-col gap-3">
      <BoolControl label="행 3개만" checked={fewRows} onChange={setFewRows} />

      {/* items-start — 그리드 셀이 늘어나 오른쪽 그리드까지 왼쪽 높이로 stretch 되지 않게 한다 */}
      <div className="grid grid-cols-2 items-start gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-dl-xs text-dl-fg-muted">
            maxHeight="auto" — 행 수만큼 늘어남 · 페이지 스크롤
          </span>
          <DataGrid
            columns={COLUMNS}
            rows={rows}
            getRowId={(row) => row.postId}
            translateHeader={(code) => code}
            maxHeight="auto"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-dl-xs text-dl-fg-muted">
            maxHeight={'{320}'} — 320px 상한 · 내부 스크롤
          </span>
          <DataGrid
            columns={COLUMNS}
            rows={rows}
            getRowId={(row) => row.postId}
            translateHeader={(code) => code}
            maxHeight={320}
          />
        </div>
      </div>
    </div>
  );
}
