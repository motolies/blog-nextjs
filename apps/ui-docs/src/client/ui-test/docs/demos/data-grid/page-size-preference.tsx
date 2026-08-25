'use client';

import {
  applyColumnPreference,
  Badge,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  type GridPreferenceScope,
  GridToolbar,
  gridStorageKey,
  IconButton,
  Pager,
  type PagerLabels,
  PageSizeSelect,
  TotalCount,
  useGridPreference,
} from '@hvy/ui';
import { Columns3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DEMO_POSTS, DEMO_STATUS_META, type DemoPost } from '../../../mock-posts';

/**
 * 페이지 크기 영속 — 컬럼 설정과 **같은 localStorage 항목**(`nx:grid:{user}:{menu}:{grid}`)에 저장된다.
 *
 * 아래 "저장된 값" 패널이 그 항목의 원문을 보여준다(훅의 쓰기가 300ms 디바운스라 조금 늦게 바뀐다).
 * 확인할 것 셋:
 *  1. 50 선택 → 패널에 `"pageSize":50` → 새로고침해도 50.
 *  2. 컬럼 설정에서 컬럼을 숨긴 뒤 **초기화** → 컬럼만 되돌고 JSON 에는 `pageSize` 만 남는다.
 *     "표를 어떻게 보느냐"(컬럼)와 "몇 건씩 조회하느냐"(페이지 크기)는 다른 결정이다.
 *     초기화 후 다시 연 다이얼로그에서 정의상 `hidden: true` 인 카테고리가 체크 해제로 보여야 한다
 *     (order 가 비어도 정의의 hidden 을 따르는 draft 규칙).
 *  3. 컬럼 폭 드래그 → widths 만 갱신되고 pageSize 는 그대로.
 *
 * ui 는 허용 목록을 모른다 — 저장값이 목록 밖이면 첫 옵션으로 떨어뜨리는 판단은 앱(여기서는 데모)의 몫이다.
 */

/** full 데모(demoOrders)와 다른 gridId — 같은 키를 두 그리드가 쓰면 중복 키 경고가 난다. */
const SCOPE: GridPreferenceScope = { userKey: 'ui-test', menuUrl: '/', gridId: 'demoPageSize' };
const STORAGE_KEY = gridStorageKey(SCOPE);

const OPTIONS = [10, 20, 50, 100] as const;

/** 저장값 → 셀렉트 값. 목록 밖이면 첫 옵션(가까운 값으로 붙이지 않는다). */
function resolvePageSize(saved: number | undefined): number {
  return saved !== undefined && (OPTIONS as readonly number[]).includes(saved) ? saved : OPTIONS[0];
}

/** 저장소 원문을 읽는 지연 — 훅의 디바운스(300ms)보다 늦어야 방금 바꾼 값이 보인다. */
const READ_DELAY_MS = 400;

const PAGER_LABELS: PagerLabels = {
  first: '첫 페이지',
  prev: '이전 페이지',
  next: '다음 페이지',
  last: '마지막 페이지',
  jump: '페이지 이동',
  atFirst: '첫 페이지입니다',
  atLast: '마지막 페이지입니다',
};

const COLUMN_SETTINGS_LABELS: ColumnSettingsLabels = {
  title: '컬럼 설정',
  description: '표시할 컬럼과 순서를 정합니다',
  reorder: '순서 변경',
  reorderHint: '드래그 또는 ↑↓ 키로 순서를 바꿉니다',
  reorderAnnouncement: (name, position, total) =>
    `${name}, ${position}번째로 이동(전체 ${total}개)`,
  visibleColumn: '표시 컬럼',
  alwaysVisible: '행 식별에 필요해 끌 수 없습니다',
  pinnedFixed: '고정 컬럼은 선두를 벗어날 수 없습니다',
  reset: '초기화',
  cancel: '취소',
  apply: '적용',
};

const numberFormat = new Intl.NumberFormat('ko-KR');

/** 원본 컬럼 정의 — 숨김 적용 전. 카테고리는 정의상 숨김(초기화 후 다이얼로그 표시 확인용). */
const ALL_COLUMNS = defineColumns<DemoPost>([
  {
    id: 'rowNum',
    headerWord: 'No',
    width: 56,
    sortable: false,
    pinned: true,
    hideable: false,
    resizable: false,
  },
  {
    id: 'postId',
    headerWord: '게시글 ID',
    width: 140,
    primary: true,
    pinned: true,
    hideable: false,
  },
  { id: 'author', headerWord: '작성자', width: 110 },
  {
    id: 'status',
    headerWord: '상태',
    width: 96,
    format: (_value, row) => (
      <Badge tone={DEMO_STATUS_META[row.status].tone}>{DEMO_STATUS_META[row.status].label}</Badge>
    ),
  },
  { id: 'category', headerWord: '카테고리', width: 96, hidden: true },
  { id: 'writtenAt', headerWord: '작성일', width: 120, grow: 1 },
]);

/** 저장소 원문을 사람이 읽게 — JSON 이면 들여쓰고, 아니면(없거나 깨짐) 그대로 보여준다. */
function formatStored(raw: string | null): string {
  if (raw === null) return '(저장된 항목 없음)';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function DataGridPageSizePreferenceDemo() {
  const [pageIndex, setPageIndex] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storedRaw, setStoredRaw] = useState<string | null>(null);

  const preference = useGridPreference(SCOPE);
  const pageSize = resolvePageSize(preference.pageSize);

  // 저장소 로드로 pageSize 가 바뀌면 보던 페이지 번호가 범위를 벗어날 수 있다 — 마지막 페이지로 붙인다.
  const pageCount = Math.max(1, Math.ceil(DEMO_POSTS.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const rows = useMemo(
    () => DEMO_POSTS.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize),
    [safePageIndex, pageSize],
  );

  const columns = useMemo(
    () => applyColumnPreference(ALL_COLUMNS, preference.preference),
    [preference.preference],
  );

  /**
   * 설정이 바뀔 때마다 디바운스 뒤의 저장소 원문을 다시 읽는다 — 값 자체는 쓰지 않고
   * "바뀌었다"는 사실만 트리거로 쓴다(훅이 실제로 쓴 결과를 보는 것이 목적이다).
   */
  const snapshot = preference.preference;
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setStoredRaw(localStorage.getItem(STORAGE_KEY));
      } catch {
        setStoredRaw(null);
      }
    }, READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [snapshot]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 flex-col">
        <DataGrid
          columns={columns}
          rows={rows}
          getRowId={(row) => row.postId}
          translateHeader={(code) => code}
          columnWidths={preference.widths}
          onColumnWidthsChange={preference.setWidths}
          resizeColumnLabel="컬럼 너비 조절"
          // 행 수보다 페이징이 주제다 — 5행으로 고정해 페이지 크기를 바꿔도 카드 높이가 튀지 않게 한다
          maxHeight={{ rows: 5 }}
          attachedToolbar
        />
        <GridToolbar
          paging={
            <>
              <TotalCount
                total={DEMO_POSTS.length}
                prefix="총"
                suffix="건"
                format={numberFormat.format}
              />
              <Pager
                pageIndex={safePageIndex}
                pageCount={pageCount}
                onChange={setPageIndex}
                labels={PAGER_LABELS}
              />
              <PageSizeSelect
                value={pageSize}
                onChange={(next) => {
                  // 저장소가 진실 — 로컬 state 없이 훅에 쓰고, 페이지 번호만 1페이지로 되돌린다.
                  preference.setPageSize(next);
                  setPageIndex(0);
                }}
                options={OPTIONS}
                label="페이지당 건수"
                suffix="건"
                format={numberFormat.format}
              />
            </>
          }
          viewControls={
            <IconButton
              icon={Columns3}
              label="컬럼 설정"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            />
          }
        />
      </div>

      {/* 저장된 값 — 훅이 실제로 localStorage 에 쓴 원문. 초기화 뒤 pageSize 만 남는 것을 여기서 본다 */}
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-dl-xs text-dl-fg-muted">
          저장된 값 — <code className="font-dl-mono">localStorage["{STORAGE_KEY}"]</code>
        </span>
        <pre className="min-h-32 overflow-auto rounded-dl-control bg-dl-canvas px-4 py-3 font-dl-mono text-dl-xs leading-relaxed text-dl-fg">
          {formatStored(storedRaw)}
        </pre>
      </div>

      {/* 원본 컬럼(숨김 적용 전)을 넘겨야 꺼 둔 컬럼도 목록에 보인다. 초기화는 컬럼만 — pageSize 는 남는다 */}
      <ColumnSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        columns={ALL_COLUMNS}
        preference={preference.preference}
        onApply={preference.setPreference}
        onReset={() => {
          preference.reset();
          setSettingsOpen(false);
        }}
        translateHeader={(code) => code}
        labels={COLUMN_SETTINGS_LABELS}
      />
    </div>
  );
}
