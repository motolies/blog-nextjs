'use client';

import {
  applyColumnPreference,
  Button,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  type GridPreference,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_POSTS, type DemoPost } from '../../../mock-posts';

/**
 * 순서 변경 — **드래그와 ↑↓ 키가 같은 일을 한다.**
 *
 * 손잡이가 `<button>` 인 이유가 여기 있다. 드래그 전용으로 만들면 키보드 사용자가 순서를
 * 바꿀 수 없는데, 이 모달은 "표를 읽을 수 있게 만드는" 도구라 그 사람들이야말로 가장 필요로 한다.
 *
 * 검증 포인트:
 * · ≡ 손잡이를 끌어 순서를 바꾼다: 드래그 중에는 배열이 바뀌지 않고 잡은 행만 손을 따라오며
 *   나머지는 한 행 높이만큼 비켜난다
 * · 손잡이에 Tab 으로 포커스를 준 뒤 **↑↓ 로도 같은 이동**이 된다
 * · ↑ 를 **연속으로** 눌러 여러 칸 올라가는지 본다 — 배열이 바뀌면 DOM 이 새로 그려져
 *   포커스가 body 로 떨어지므로, 복원이 없으면 한 칸씩밖에 못 옮긴다
 * · 옮길 때마다 sr-only aria-live 로 "카테고리, 3번째로 이동(전체 9개)" 가 나가고,
 *   같은 문장이 연속되면 끝에 공백을 번갈아 붙여 다시 읽히게 한다
 * · 목록이 넘치면 가장자리에서 자동 스크롤이 걸리고 **손을 떼면 반드시 멈춘다**
 *   (안 멈추면 rAF 루프가 샌 것이다) — 컬럼을 9개로 둔 이유가 목록에 스크롤을 만들기 위해서다
 */

const LABELS: ColumnSettingsLabels = {
  title: '컬럼 설정',
  description: '손잡이를 끌거나 ↑↓ 키로 순서를 바꿉니다.',
  reorder: '순서 변경',
  reorderHint: '손잡이에 포커스를 준 뒤 ↑↓ 키로 옮길 수 있습니다.',
  reorderAnnouncement: (name, position, total) =>
    `${name}, ${position}번째로 이동(전체 ${total}개)`,
  visibleColumn: '표시',
  alwaysVisible: '항상 표시되는 컬럼입니다',
  pinnedFixed: '고정열은 고정 구간 안에서만 옮길 수 있습니다',
  reset: '초기화',
  cancel: '취소',
  apply: '적용',
};

/** 9개인 이유: 모달 목록에 스크롤이 생겨야 드래그 중 자동 스크롤을 확인할 수 있다. */
const ALL_COLUMNS = defineColumns<DemoPost>([
  { id: 'rowNum', headerWord: 'No', width: 60, pinned: true, hideable: false },
  { id: 'postId', headerWord: '게시글 ID', width: 140, pinned: true, hideable: false },
  { id: 'author', headerWord: '작성자', width: 110 },
  { id: 'category', headerWord: '카테고리', width: 96 },
  { id: 'status', headerWord: '상태', width: 96 },
  { id: 'viewCount', headerWord: '조회수', width: 110, align: 'right' },
  { id: 'writtenAt', headerWord: '작성일', width: 120 },
  { id: 'summary', headerWord: '요약', width: 160 },
  { id: 'series', headerWord: '시리즈', width: 120, grow: 1 },
]);

/** 목데이터에 없는 두 컬럼은 여기서 파생한다 — 컬럼 수를 채우는 것이 목적이다. */
const ROWS = DEMO_POSTS.slice(0, 6).map((post, index) => ({
  ...post,
  summary: `${post.category} 글 요약 ${index + 1}`,
  series: index % 2 === 0 ? '디자인 시스템 만들기' : '—',
}));

export function ColumnSettingsReorderDemo() {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<GridPreference | null>(null);

  const columns = applyColumnPreference(ALL_COLUMNS, preference);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline-gray" onClick={() => setOpen(true)}>
          컬럼 설정 열기
        </Button>
        <span className="text-dl-xs text-dl-fg-muted">
          현재 순서: {columns.map((column) => column.headerWord).join(' · ')}
        </span>
      </div>

      <DataGrid columns={columns} rows={ROWS} getRowId={(row) => row.postId} maxHeight={240} />

      <ColumnSettingsDialog
        open={open}
        onOpenChange={setOpen}
        columns={ALL_COLUMNS}
        preference={preference}
        onApply={(next) =>
          setPreference((previous) => ({ version: 1, widths: {}, ...previous, ...next }))
        }
        onReset={() => setPreference(null)}
        labels={LABELS}
      />
    </div>
  );
}
