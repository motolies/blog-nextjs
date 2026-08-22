import {
  Badge,
  Button,
  type ColumnDef,
  DataGrid,
  defineColumns,
  showToast,
  useGridEditing,
  useGridSelection,
} from '@hvy/ui';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { GridPagingBar } from '@/components/common/grid/GridPagingBar';
import { GRID_EMPTY, SELECTION_LABELS } from '@/components/common/grid/gridLabels';
import { useColumnSettings } from '@/components/common/grid/useColumnSettings';
import { useClientGrid } from '@/hooks/useClientGrid';

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  score: number;
  [key: string]: unknown;
};

const SAMPLE_DATA: UserRow[] = [
  { id: 1, name: '김철수', email: 'kim@example.com', role: '관리자', status: 'active', score: 95 },
  { id: 2, name: '이영희', email: 'lee@example.com', role: '편집자', status: 'active', score: 88 },
  { id: 3, name: '박민수', email: 'park@example.com', role: '뷰어', status: 'inactive', score: 72 },
  { id: 4, name: '정수진', email: 'jung@example.com', role: '편집자', status: 'active', score: 91 },
  { id: 5, name: '최동훈', email: 'choi@example.com', role: '관리자', status: 'active', score: 85 },
  { id: 6, name: '한지민', email: 'han@example.com', role: '뷰어', status: 'inactive', score: 67 },
  { id: 7, name: '오세영', email: 'oh@example.com', role: '편집자', status: 'active', score: 79 },
  { id: 8, name: '윤서연', email: 'yoon@example.com', role: '뷰어', status: 'active', score: 93 },
  {
    id: 9,
    name: '강민호',
    email: 'kang@example.com',
    role: '관리자',
    status: 'inactive',
    score: 81,
  },
  { id: 10, name: '서지현', email: 'seo@example.com', role: '편집자', status: 'active', score: 76 },
  { id: 11, name: '임태우', email: 'lim@example.com', role: '뷰어', status: 'active', score: 88 },
  {
    id: 12,
    name: '황보라',
    email: 'hwang@example.com',
    role: '편집자',
    status: 'inactive',
    score: 64,
  },
];

let nextId = SAMPLE_DATA.length + 1;

const getRowId = (row: UserRow) => String(row.id);

/**
 * 컬럼 정의 — @hvy/ui ColumnDef 직접 사용.
 * ⚠️ ColumnDef 의 기본 정렬은 center, 기본 sortable 은 "onToggleSort 가 있으면 켜짐"이다 —
 * 좌측 정렬과 표시 전용 컬럼의 sortable: false 는 명시해야 한다.
 */
const COLUMNS = defineColumns<UserRow>([
  { id: 'id', headerWord: 'ID', width: 70, align: 'left', primary: true },
  {
    id: 'name',
    headerWord: '이름',
    width: 120,
    grow: 1,
    align: 'left',
    editor: { type: 'text' },
  },
  {
    id: 'email',
    headerWord: '이메일',
    width: 200,
    grow: 1,
    align: 'left',
    editor: { type: 'text' },
  },
  {
    id: 'role',
    headerWord: '역할',
    width: 100,
    align: 'left',
    format: (value) => (
      <Badge tone={value === '관리자' ? 'primary' : 'neutral'}>{String(value)}</Badge>
    ),
    editor: {
      type: 'select',
      placeholder: '선택',
      options: [
        { value: '관리자', label: '관리자' },
        { value: '편집자', label: '편집자' },
        { value: '뷰어', label: '뷰어' },
      ],
    },
  },
  {
    id: 'status',
    headerWord: '상태',
    width: 100,
    align: 'left',
    format: (value) => (
      <span className={value === 'active' ? 'text-dl-success' : 'text-dl-fg-muted'}>
        {value === 'active' ? '활성' : '비활성'}
      </span>
    ),
    editor: {
      type: 'select',
      placeholder: '선택',
      options: [
        { value: 'active', label: '활성' },
        { value: 'inactive', label: '비활성' },
      ],
    },
  },
  {
    id: 'score',
    headerWord: '점수',
    width: 80,
    align: 'right',
    editor: { type: 'number', min: 0, max: 100 },
  },
]);

export default function DataTableTestPage() {
  const [data, setData] = useState<UserRow[]>(SAMPLE_DATA);
  const [modifiedIds, setModifiedIds] = useState<Set<number>>(new Set());
  const [openedRow, setOpenedRow] = useState<string | null>(null);

  const grid = useClientGrid<UserRow>(data, { pageSize: 10 });
  const { visibleColumns, openSettings, dialog } = useColumnSettings(COLUMNS);

  const resetKey = `${grid.pageIndex}:${grid.pageSize}`;

  // 인라인 편집 — 셀 확정 시 원본 data 에도 반영한다
  const editing = useGridEditing<UserRow>({
    data: grid.rows,
    getRowId,
    columns: COLUMNS as ColumnDef<UserRow>[],
    resetKey,
  });

  const editingBinding = useMemo(
    () => ({
      ...editing.binding,
      onCommit: (rowId: string, columnId: string, value: unknown) => {
        editing.binding.onCommit(rowId, columnId, value);
        setData((prev) =>
          prev.map((row) => (String(row.id) === rowId ? { ...row, [columnId]: value } : row)),
        );
        setModifiedIds((prev) => new Set(prev).add(Number(rowId)));
      },
    }),
    [editing.binding],
  );

  const selectionApi = useGridSelection<UserRow>({
    rows: editing.rows as readonly UserRow[],
    getRowId,
    resetKey,
  });
  const selection = { ...selectionApi, ...SELECTION_LABELS };

  const handleAddRow = useCallback(() => {
    const newRow: UserRow = {
      id: nextId++,
      name: `사용자${nextId}`,
      email: `user${nextId}@example.com`,
      role: '뷰어',
      status: 'active',
      score: Math.floor(Math.random() * 40) + 60,
    };
    setData((prev) => [newRow, ...prev]);
    setModifiedIds((prev) => new Set(prev).add(newRow.id));
    showToast(`새 행 추가됨 (ID: ${newRow.id})`);
  }, []);

  const handleSaveAll = useCallback(() => {
    showToast(`${data.length}건 저장 완료 (수정: ${modifiedIds.size}건)`);
    setModifiedIds(new Set());
  }, [data.length, modifiedIds.size]);

  const handleDeleteSelected = useCallback(() => {
    const selectedIds = selectionApi.selectedIds;
    setData((prev) => prev.filter((row) => !selectedIds.has(String(row.id))));
    selectionApi.clear();
    showToast(`${selectedIds.size}건 삭제됨`);
  }, [selectionApi]);

  /**
   * 행 열기 — `onRowActivate`(행 클릭 보조 열기)의 검증 하네스다.
   * 이 기능을 쓰던 화면(`/admin/sprint` 드릴다운)이 삭제돼 지금은 여기서만 확인할 수 있다.
   */
  const handleRowOpen = useCallback((row: UserRow) => {
    setOpenedRow(`${row.name} (${row.email})`);
  }, []);

  // 합계행 — 값이 있는 칸(status 라벨·score 합계)만 넣는다. 없는 컬럼 칸은 빈칸이 된다.
  const footer = useMemo(
    () => ({
      cells: {
        status: '합계',
        score: String(data.reduce((sum, row) => sum + row.score, 0)),
      },
    }),
    [data],
  );

  const rowClassName = useCallback(
    (row: UserRow) => (modifiedIds.has(row.id) ? 'bg-dl-grid-dirty' : undefined),
    [modifiedIds],
  );

  return (
    // 페이지 타이틀은 상단 헤더 브레드크럼(h1, adminRouteMeta '/test/data-table')이 정본
    <section className="admin-page-frame">
      <div className="admin-workspace">
        <div className="admin-panel admin-panel-pad mb-4">
          <h2 className="text-sm font-semibold text-[color:var(--admin-text-secondary)] mb-2">
            기능 테스트 항목
          </h2>
          <ul className="text-xs text-[color:var(--admin-text-muted)] space-y-1">
            <li>
              1. <strong>칼럼 이동·표시</strong> — 하단 &quot;컬럼 설정&quot;에서 순서 변경과
              표시/숨김 (헤더 드래그가 아니다)
            </li>
            <li>
              2. <strong>칼럼 정렬</strong> — 헤더 클릭으로 오름차순/내림차순 토글
            </li>
            <li>
              3. <strong>칼럼 리사이즈</strong> — 헤더 우측 경계선 드래그로 너비 조절
            </li>
            <li>
              4. <strong>행 선택</strong> — 체크박스로 개별/전체 선택, 선택 시 하단 툴바에 N개
              선택됨 표시
            </li>
            <li>
              5. <strong>선택 삭제</strong> — 선택된 행을 삭제하는 버튼 동작
            </li>
            <li>
              6. <strong>행 추가</strong> — 하단 &quot;행 추가&quot; 버튼으로 새 행 생성 (노란 배경
              표시)
            </li>
            <li>
              7. <strong>전체 저장</strong> — 하단 &quot;저장&quot; 버튼 클릭 시 토스트 메시지 확인
            </li>
            <li>
              8. <strong>인라인 편집</strong> — 셀 더블클릭으로 편집 (이름/이메일=텍스트,
              역할/상태=셀렉트, 점수=숫자)
            </li>
            <li>
              9. <strong>행 열기</strong> — 첫 컬럼 링크(키보드 경로) 또는 행 아무 데나 클릭 (포인터
              경로). 액션 버튼·체크박스·에디터 클릭은 열지 않는다
            </li>
            <li>
              10. <strong>합계행</strong> — 표 하단 sticky 합계행에 &quot;상태 합계 · 점수 N&quot;.
              값이 빈 칸(ID·이름·이메일·역할)은 빈칸이어야 한다
            </li>
            <li>
              11. <strong>전체 펼침</strong> — 아래 두 번째 표는 페이징 없이 전 행을 편다. 560px
              에서 잘리면 안 된다
            </li>
          </ul>
        </div>

        <div className="admin-panel admin-table-shell">
          <DataGrid<UserRow>
            columns={visibleColumns}
            rows={editing.rows as readonly UserRow[]}
            getRowId={editing.getRowId as (row: UserRow) => string}
            empty={GRID_EMPTY}
            sortOf={grid.sortOf}
            onToggleSort={grid.toggleSort}
            onRowPrimaryAction={handleRowOpen}
            onRowActivate={handleRowOpen}
            rowClassName={rowClassName}
            selection={selection}
            editing={editingBinding}
            footer={footer}
            attachedToolbar
          />
          <GridPagingBar
            pageIndex={grid.pageIndex}
            pageCount={grid.pageCount}
            onPageChange={grid.setPageIndex}
            total={grid.totalCount}
            pageSize={grid.pageSize}
            onPageSizeChange={grid.setPageSize}
            selection={
              selectionApi.selectedCount > 0
                ? {
                    count: selectionApi.selectedCount,
                    summary: (count) => `${count}개 선택됨`,
                    actions: (
                      <Button
                        variant="outline-red"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        선택 삭제 ({selectionApi.selectedCount})
                      </Button>
                    ),
                    clear: { label: '선택 해제', onClick: selectionApi.clear },
                  }
                : undefined
            }
            onColumnSettings={openSettings}
            actions={
              <>
                <Button variant="outline-gray" size="sm" onClick={handleAddRow}>
                  행 추가
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveAll}>
                  저장
                </Button>
              </>
            }
          />
          {dialog}
          {openedRow ? (
            <p className="mt-2 text-sm text-[color:var(--admin-text-muted)]">
              열린 행: <strong className="text-[color:var(--admin-text)]">{openedRow}</strong>
            </p>
          ) : null}
        </div>

        {/*
          페이징 없이 전 행을 펴는 형태 — 한눈에 봐야 하는 집계표에 쓴다.
          DataGrid 의 본문 높이 상한(기본 560px)을 풀지 않으면 페이징을 껐는데도
          안쪽 스크롤이 생겨 "한눈에 보기"가 성립하지 않는다.
        */}
        <div className="admin-panel admin-table-shell mt-4">
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--admin-text-secondary)]">
            전체 펼침 (maxHeight=&quot;auto&quot;)
          </h2>
          <DataGrid<UserRow>
            columns={COLUMNS}
            rows={data}
            getRowId={getRowId}
            empty={GRID_EMPTY}
            footer={footer}
            maxHeight="auto"
          />
        </div>
      </div>
    </section>
  );
}
