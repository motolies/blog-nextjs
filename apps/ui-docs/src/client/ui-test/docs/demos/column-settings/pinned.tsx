'use client';

import {
  applyColumnPreference,
  Button,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  type GridPreference,
  pinnedCount,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_POSTS, type DemoPost } from '../../../mock-posts';

/**
 * 고정열 — **막는 게 아니라 가둔다.**
 *
 * 검증 포인트:
 * · 고정열(No·게시글 ID)을 일반열 사이로 끌어도 **고정 구간 경계에서 멈춘다** —
 *   "그룹이 다르면 이동 무시" 로 처리하면 드래그가 여러 칸을 건너뛰는 탓에
 *   아무 일도 안 일어나 고장난 것처럼 보인다
 * · 반대로 일반열을 고정 구간 위로 끌어도 마찬가지다
 * · 손잡이 title 이 **왜 더 못 가는지** 알린다(pinnedFixed 문구)
 * · 적용 후 표를 **가로로 끝까지 밀어** 본다 — 고정열이 흩어지면 스크롤 시 좌우가 갈라져
 *   읽을 수 없다. 그래서 applyColumnPreference 가 저장값과 무관하게 선두 연속 구간으로 되돌린다
 * · 아래 "고정열 수" 표시가 항상 2 여야 한다
 */

const LABELS: ColumnSettingsLabels = {
  title: '컬럼 설정',
  description: '고정열은 고정 구간 안에서만 움직입니다.',
  reorder: '순서 변경',
  reorderHint: '손잡이를 끌거나 ↑↓ 키로 옮깁니다. 고정열은 경계를 넘지 않습니다.',
  reorderAnnouncement: (name, position, total) =>
    `${name}, ${position}번째로 이동(전체 ${total}개)`,
  visibleColumn: '표시',
  alwaysVisible: '항상 표시되는 컬럼입니다',
  pinnedFixed: '고정열은 고정 구간 안에서만 옮길 수 있습니다',
  reset: '초기화',
  cancel: '취소',
  apply: '적용',
};

const ALL_COLUMNS = defineColumns<DemoPost>([
  { id: 'rowNum', headerWord: 'No', width: 60, pinned: true, hideable: false },
  { id: 'postId', headerWord: '게시글 ID', width: 140, pinned: true, hideable: false },
  { id: 'author', headerWord: '작성자', width: 160 },
  { id: 'category', headerWord: '카테고리', width: 160 },
  { id: 'status', headerWord: '상태', width: 160 },
  { id: 'viewCount', headerWord: '조회수', width: 160, align: 'right' },
  { id: 'writtenAt', headerWord: '작성일', width: 200 },
]);

const ROWS = DEMO_POSTS.slice(0, 6);

export function ColumnSettingsPinnedDemo() {
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
          고정열 수: <b>{pinnedCount(columns)}</b> — 적용 후에도 2 여야 한다. 표를 가로로 끝까지
          밀어 고정열이 왼쪽에 붙어 있는지 확인할 것.
        </span>
      </div>

      {/* 폭 합이 컨테이너를 넘도록 컬럼을 넓게 잡았다 — 가로 스크롤이 있어야 sticky 를 본다. */}
      <div className="max-w-2xl">
        <DataGrid columns={columns} rows={ROWS} getRowId={(row) => row.postId} maxHeight={240} />
      </div>

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
