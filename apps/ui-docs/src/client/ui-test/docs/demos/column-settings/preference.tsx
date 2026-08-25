'use client';

import {
  applyColumnPreference,
  Button,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  useGridPreference,
} from '@hvy/ui';
import { useState } from 'react';
import { DEMO_POSTS, type DemoPost } from '../../../mock-posts';

/**
 * useGridPreference 연동 — 저장 · 초기화 · **나중에 늘어난 컬럼**.
 *
 * 검증 포인트:
 * · 숨김·순서를 적용하고 **새로고침**해도 유지된다(localStorage, 키는 사용자·메뉴·그리드 3축)
 * · 「초기화」는 컬럼 설정만 지우고 페이지 크기는 남긴다
 * · 초기화 직후 다시 연 목록에서 **정의상 `hidden: true` 인 컬럼이 체크 해제 상태로 보여야 한다** —
 *   저장 당시 없던 컬럼(order 에 없음)은 저장값이 아니라 정의의 hidden 을 따르기 때문이고,
 *   이게 어긋나면 표와 목록이 서로 다른 것을 말한다
 * · **「나중에 컬럼이 늘었다」** 를 켜면 저장 이후 추가된 컬럼이 목록 뒤에 붙고 사라지지 않는다 —
 *   설정을 저장한 뒤 배포로 컬럼이 늘면 그 컬럼이 영영 안 보이는 사고가 여기서 막힌다
 */

const LABELS: ColumnSettingsLabels = {
  title: '컬럼 설정',
  description: '표시할 컬럼과 순서를 정합니다. 적용하면 브라우저에 저장됩니다.',
  reorder: '순서 변경',
  reorderHint: '손잡이를 끌거나 ↑↓ 키로 옮깁니다.',
  reorderAnnouncement: (name, position, total) =>
    `${name}, ${position}번째로 이동(전체 ${total}개)`,
  visibleColumn: '표시',
  alwaysVisible: '항상 표시되는 컬럼입니다',
  pinnedFixed: '고정열은 고정 구간 안에서만 옮길 수 있습니다',
  reset: '초기화',
  cancel: '취소',
  apply: '적용',
};

const BASE_COLUMNS = defineColumns<DemoPost>([
  { id: 'rowNum', headerWord: 'No', width: 60, pinned: true, hideable: false },
  { id: 'postId', headerWord: '게시글 ID', width: 140, pinned: true, hideable: false },
  { id: 'author', headerWord: '작성자', width: 110 },
  { id: 'category', headerWord: '카테고리', width: 96 },
  // 정의상 숨김 — 초기화 후 목록에서 체크 해제로 보여야 한다.
  { id: 'status', headerWord: '상태', width: 96, hidden: true },
  { id: 'writtenAt', headerWord: '작성일', width: 120, grow: 1 },
]);

/** 배포로 컬럼이 늘어난 상황 — 저장값의 order 에는 없는 컬럼이다. */
const LATER_COLUMN = { id: 'viewCount', headerWord: '조회수', width: 110, align: 'right' } as const;

const ROWS = DEMO_POSTS.slice(0, 6);

export function ColumnSettingsPreferenceDemo() {
  const [open, setOpen] = useState(false);
  const [grown, setGrown] = useState(false);

  // 실제 앱과 같은 3축 키 — 문서 앱이라 사용자·메뉴는 고정값이다.
  const preference = useGridPreference({
    userKey: 'docs',
    menuUrl: '/components/column-settings',
    gridId: 'demo',
  });

  const allColumns = grown
    ? defineColumns<DemoPost>([...BASE_COLUMNS, LATER_COLUMN])
    : BASE_COLUMNS;
  const columns = applyColumnPreference(allColumns, preference.preference);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline-gray" onClick={() => setOpen(true)}>
          컬럼 설정 열기
        </Button>
        <Button
          size="sm"
          variant={grown ? 'primary' : 'outline-gray'}
          onClick={() => setGrown((previous) => !previous)}
        >
          나중에 컬럼이 늘었다 {grown ? '(켜짐)' : ''}
        </Button>
        <span className="text-dl-xs text-dl-fg-muted">
          표시 {columns.length} / 정의 {allColumns.length} — 적용 후 새로고침해도 유지된다.
        </span>
      </div>

      <DataGrid
        columns={columns}
        rows={ROWS}
        getRowId={(row) => row.postId}
        columnWidths={preference.widths}
        onColumnWidthsChange={preference.setWidths}
        resizableColumns
        maxHeight={240}
      />

      <ColumnSettingsDialog
        open={open}
        onOpenChange={setOpen}
        columns={allColumns}
        preference={preference.preference}
        onApply={preference.setPreference}
        onReset={preference.reset}
        labels={LABELS}
      />
    </div>
  );
}
