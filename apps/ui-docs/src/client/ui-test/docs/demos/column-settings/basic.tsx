'use client';

import {
  applyColumnPreference,
  Button,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  FormMode,
  type GridPreference,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_POSTS, type DemoPost } from '../../../mock-posts';

/**
 * 표시 토글 — **draft 는 열 때마다 다시 만든다.**
 *
 * 검증 포인트:
 * · 체크를 끄고 「취소」한 뒤 다시 열면 **꺼 두었던 체크가 남아 있지 않다** —
 *   열릴 때마다 현재 설정에서 draft 를 다시 만들기 때문이다.
 *   남아 있으면 사용자는 그것이 이미 적용된 상태라고 읽는다
 * · 「적용」을 눌러야 표에 반영된다(hidden·order 를 한 번에 넘긴다)
 * · `hideable: false` 인 No·게시글 ID 는 체크가 잠기고 **왜 못 누르는지** title 로 뜬다
 * · 이 모달은 폼이 아니다 — 바깥 FormMode 를 view/disabled 로 바꿔도 안쪽 체크박스는
 *   잠기지 않는다(내부에서 edit 로 핀되어 있고, Portal 이어도 React 트리를 따라 관통한다).
 *   아래 토글로 직접 눌러 확인할 것
 * · **원본 컬럼(숨김 적용 전)을 넘겨야** 꺼 둔 컬럼도 목록에 보인다 —
 *   여기가 어긋나면 한 번 끈 컬럼을 영영 못 켠다
 */

const LABELS: ColumnSettingsLabels = {
  title: '컬럼 설정',
  description: '표시할 컬럼과 순서를 정합니다.',
  reorder: '순서 변경',
  reorderHint: '손잡이를 끌거나 포커스를 준 뒤 ↑↓ 키로 옮깁니다.',
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
  { id: 'author', headerWord: '작성자', width: 110 },
  { id: 'category', headerWord: '카테고리', width: 96 },
  { id: 'status', headerWord: '상태', width: 96 },
  { id: 'viewCount', headerWord: '조회수', width: 110, align: 'right' },
  { id: 'writtenAt', headerWord: '작성일', width: 120, grow: 1 },
]);

const ROWS = DEMO_POSTS.slice(0, 6);

export function ColumnSettingsBasicDemo() {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<GridPreference | null>(null);
  const [outerMode, setOuterMode] = useState<'edit' | 'view'>('edit');

  const columns = applyColumnPreference(ALL_COLUMNS, preference);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline-gray" onClick={() => setOpen(true)}>
          컬럼 설정 열기
        </Button>
        <Button
          size="sm"
          variant="outline-gray"
          onClick={() => setOuterMode((previous) => (previous === 'edit' ? 'view' : 'edit'))}
        >
          바깥 FormMode: {outerMode}
        </Button>
        <span className="text-dl-xs text-dl-fg-muted">
          표시 중 {columns.length} / 전체 {ALL_COLUMNS.length} 컬럼
        </span>
      </div>

      <DataGrid columns={columns} rows={ROWS} getRowId={(row) => row.postId} maxHeight={240} />

      {/* 바깥이 view 여도 모달 안쪽 체크박스는 잠기지 않아야 한다 — 모달은 폼이 아니다. */}
      <FormMode value={outerMode}>
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
      </FormMode>
    </div>
  );
}
