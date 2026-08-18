'use client';

import {
  applyColumnPreference,
  Badge,
  Button,
  ColumnSettingsDialog,
  type ColumnSettingsLabels,
  DataGrid,
  defineColumns,
  GridToolbar,
  IconButton,
  showToast,
  TotalCount,
  useBeforeUnloadGuard,
  useConfirm,
  useGridEditing,
  useGridPreference,
  useGridSelection,
} from '@hvy/ui';
import { Columns3, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DEMO_ADDON_OPTIONS,
  DEMO_EDITABLE_ORDERS,
  DEMO_STATUS_META,
  DEMO_STATUSES,
  type DemoEditableOrder,
} from '../../../mock-orders';

/**
 * 인라인 편집 배선 — `useGridEditing` 3계층(훅 상태 → binding → DataGrid 렌더)의 표준 배선.
 *
 * 확인 포인트:
 * - 셀 더블클릭 → 에디터 전환(레거시 dhtmlx 감각), 수정 셀은 dirty 배경 + 셀 안 ✕(초기화)
 * - ✕ 클릭 또는 값 원복 → 그 셀만 dirty 해제 (편집이 셀 단위이므로 원복도 셀 단위)
 * - Tab/Shift+Tab 좌우 이동 · Enter 확정 후 아래 이동 · Esc 취소
 * - 부가서비스 열(multiselect) — 고를 때마다 커밋하고 **닫지 않는다**. 옵션 12종이라 셀
 *   안에서도 검색이 붙고, 6개째부터 선택 요약(칩)이 붙어 팝오버가 커진다(첫 행이 7개다)
 * - 행 추가(행 전체 dirty 배경 + 주문번호 링크 비활성) → 저장 시 addList 로 나간다
 * - 저장 = validateAll() 통과 후 getSaveRequestData() — 레거시 gridWrapper 계약 그대로
 * - 미저장 상태의 재조회 가드(useConfirm)와 브라우저 이탈 가드(useBeforeUnloadGuard)
 * - 컬럼 설정(순서·숨김)과 편집의 공존 — **훅에는 숨김 적용 전 전체 컬럼**, DataGrid 에는
 *   preference 적용본. 숨긴 편집 컬럼도 저장 전 검증(validateAll)에 포함된다.
 */

const numberFormat = new Intl.NumberFormat('ko-KR');

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

const STATUS_OPTIONS = DEMO_STATUSES.map((status) => ({
  value: status,
  label: DEMO_STATUS_META[status].label,
}));

/** multiselect 에디터의 옵션 — 12종이라 셀 안에서도 검색 입력이 붙는다(임계값 10). */
const ADDON_OPTIONS = DEMO_ADDON_OPTIONS.map((addon) => ({
  value: addon.value,
  label: addon.label,
}));

/**
 * 표시용 역인덱스 — 셀 렌더는 행마다 도므로 매번 find 하지 않는다.
 * 키를 `string` 으로 명시한다: 원본이 `as const` 라 그냥 두면 키가 리터럴 유니온이 되어
 * 셀 값(`string`)으로 조회할 수 없다.
 */
const ADDON_LABELS = new Map<string, string>(
  ADDON_OPTIONS.map((addon) => [addon.value, addon.label]),
);

/** 필수 입력 검증 — `ui` 는 사전을 모르므로 번역된 문구를 클로저로 넘긴다(여기서는 리터럴). */
const required = (value: unknown) =>
  value == null || String(value).trim() === '' ? '필수 입력입니다' : null;

const ALL_COLUMNS = defineColumns<DemoEditableOrder>([
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
    id: 'orderId',
    headerWord: '주문번호',
    width: 140,
    primary: true,
    pinned: true,
    hideable: false,
  },
  {
    id: 'receiver',
    headerWord: '수신자',
    width: 130,
    editor: { type: 'text', maxLength: 20 },
    validate: required,
  },
  {
    id: 'status',
    headerWord: '상태',
    width: 110,
    editor: { type: 'select', options: STATUS_OPTIONS, placeholder: '선택' },
    format: (value) => {
      const meta = DEMO_STATUS_META[value as keyof typeof DEMO_STATUS_META];
      return meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : '';
    },
  },
  {
    id: 'amount',
    headerWord: '금액',
    width: 120,
    align: 'right',
    editor: { type: 'number', min: 0 },
    validate: (value) => (value == null || Number(value) > 0 ? null : '0보다 커야 합니다'),
    format: (value) => (value == null ? '' : `${numberFormat.format(Number(value))} 원`),
  },
  {
    id: 'orderDate',
    headerWord: '주문일',
    width: 150,
    editor: { type: 'date' },
    validate: required,
  },
  {
    id: 'addons',
    headerWord: '부가서비스',
    width: 200,
    sortable: false,
    editor: { type: 'multiselect', options: ADDON_OPTIONS, placeholder: '없음' },
    // 배열은 기본 렌더로 그리면 쉼표 없이 붙는다 — 라벨로 바꿔 잇는다.
    // 대응 option 이 없는 값은 raw 로 남긴다(빈칸이면 데이터 소실로 읽힌다).
    format: (value) =>
      Array.isArray(value)
        ? value.map((entry) => ADDON_LABELS.get(String(entry)) ?? String(entry)).join(', ')
        : '',
  },
  {
    id: 'useYn',
    headerWord: '사용',
    width: 70,
    grow: 1,
    editor: { type: 'checkbox', checkedValue: 'Y', uncheckedValue: 'N' },
  },
]);

export function DataGridEditingDemo() {
  const askConfirm = useConfirm();
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /** 컬럼 순서·숨김·폭의 브라우저 영속 — full 데모(demoOrders)와 키가 갈리도록 gridId 를 분리한다. */
  const preference = useGridPreference({
    userKey: 'ui-test',
    menuUrl: '/',
    gridId: 'demoEditing',
  });

  /** DataGrid 에 넘길 표시용 컬럼 — 사용자 순서·숨김 반영본. */
  const columns = useMemo(
    () => applyColumnPreference(ALL_COLUMNS, preference.preference),
    [preference.preference],
  );

  const editing = useGridEditing({
    data: DEMO_EDITABLE_ORDERS,
    getRowId: (row) => row.orderId,
    // 숨김 적용 전 전체 컬럼 — validate 의 소유자가 훅이다. 숨긴 컬럼도 검증에서 빠지면 안 된다.
    columns: ALL_COLUMNS,
  });

  // 미저장 상태의 새로고침·탭 닫기 가드. SPA 라우팅 가드는 아래 "재조회" 버튼 패턴이 맡는다.
  useBeforeUnloadGuard(editing.isModified);

  const selection = useGridSelection({
    rows: editing.rows,
    getRowId: editing.getRowId,
    resetKey: 'editing-demo',
  });

  /** 툴바 "행 추가" — 맨 위에 넣고 첫 편집 컬럼을 바로 연다(더블클릭 없이 입력 시작). */
  const handleAddRow = () => {
    // addons 를 빈 배열로 명시한다 — undefined 로 두면 편집기가 방어하긴 하지만,
    // 저장 요청(addList)에 그 키가 통째로 빠져 "미선택"과 "필드 없음"이 갈린다.
    const rowId = editing.addRow({ useYn: 'Y', status: 'READY', addons: [] }, { at: 'start' });
    editing.setActiveCell({ rowId, columnId: 'receiver' });
  };

  /** 선택 삭제 — removeRow 는 추가('A') 행만 지운다. 기존 행은 별도 삭제 API 의 영역이다. */
  const handleRemoveSelected = () => {
    const targets = [...selection.selectedIds];
    const added = targets.filter((id) => editing.binding.addedRowIds.has(id));
    for (const id of added) editing.removeRow(id);
    selection.clear();
    if (added.length < targets.length) {
      showToast(
        `기존 행 ${targets.length - added.length}건은 제외했습니다 — 삭제는 별도 API 영역입니다`,
        'warning',
      );
    } else if (added.length > 0) {
      showToast(`추가 행 ${added.length}건을 제거했습니다`, 'success');
    }
  };

  /** 저장 — 검증 실패면 첫 오류 셀로 이동만 하고, 통과하면 레거시 계약 body 를 보여준다. */
  const handleSave = () => {
    if (!editing.isModified) {
      showToast('수정된 데이터가 없습니다', 'info');
      return;
    }
    if (!editing.validateAll()) {
      showToast('검증에 실패했습니다 — 오류 셀로 이동했습니다', 'error');
      return;
    }
    setSavedJson(JSON.stringify(editing.getSaveRequestData(), null, 2));
    // 실전은 여기서 mutation → 성공 후 invalidateQueries + reset() 이다.
    editing.reset();
    showToast(
      '저장 요청 본문을 아래에 표시했습니다 — dirty 표시가 사라진 것을 확인하세요',
      'success',
    );
  };

  /** 재조회 가드 — SPA 이탈 가드의 앱 측 표준 패턴(isModified + useConfirm). */
  const handleRefetch = async () => {
    if (editing.isModified) {
      const ok = await askConfirm({
        message: '저장하지 않은 변경이 있습니다. 버리고 다시 조회할까요?',
        confirmLabel: '버리고 조회',
        cancelLabel: '취소',
        destructive: true,
      });
      if (!ok) return;
    }
    editing.reset();
    setSavedJson(null);
    showToast('다시 조회했습니다 (데모 — 데이터 원복)', 'info');
  };

  const modified = editing.isModified ? editing.getModifiedData() : null;

  return (
    <div className="flex flex-col">
      <DataGrid
        columns={columns}
        rows={editing.rows}
        getRowId={editing.getRowId}
        editing={editing.binding}
        translateHeader={(code) => code}
        onRowPrimaryAction={(row) => showToast(`${row.orderId} 상세 이동 (데모)`, 'info')}
        selection={{
          selectedIds: selection.selectedIds,
          onChange: selection.onChange,
          allState: selection.allState,
          toggleAll: selection.toggleAll,
          selectAllLabel: '전체 선택',
          selectRowLabel: '행 선택',
        }}
        columnWidths={preference.widths}
        onColumnWidthsChange={preference.setWidths}
        resizeColumnLabel="컬럼 너비 조절"
        revertCellLabel="수정 원복"
        maxHeight={360}
        attachedToolbar
      />

      <GridToolbar
        paging={
          <>
            <TotalCount
              total={editing.rows.length}
              prefix="총"
              suffix="건"
              format={numberFormat.format}
            />
            {modified ? (
              <span className="text-dl-sm text-dl-tonal-fg">
                미저장 — 추가 {modified.A.length}건 · 수정 {modified.U.length}건
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button icon={Plus} onClick={handleAddRow}>
              행 추가
            </Button>
            <Button
              variant="outline-red"
              icon={Trash2}
              disabled={selection.selectedCount === 0}
              onClick={handleRemoveSelected}
            >
              선택 삭제
            </Button>
            <Button onClick={handleRefetch}>재조회</Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>
              저장
            </Button>
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

      {/* 원본 컬럼(숨김 적용 전)을 넘겨야 꺼 둔 컬럼도 목록에 보인다 */}
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

      {savedJson !== null ? (
        <pre className="mt-3 max-h-60 overflow-auto rounded-dl-container border border-dl-border bg-dl-canvas p-3 text-dl-fg text-dl-xs">
          {savedJson}
        </pre>
      ) : null}
    </div>
  );
}
