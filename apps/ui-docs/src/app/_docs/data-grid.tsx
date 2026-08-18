import { DataGridDensityDemo } from '../../client/ui-test/docs/demos/data-grid/density';
import { DataGridEditingDemo } from '../../client/ui-test/docs/demos/data-grid/editing';
import { DataGridEmptyStatesDemo } from '../../client/ui-test/docs/demos/data-grid/empty-states';
import { DataGridFooterDemo } from '../../client/ui-test/docs/demos/data-grid/footer';
import { DataGridFullDemo } from '../../client/ui-test/docs/demos/data-grid/full';
import { DataGridSelectionToolbarDemo } from '../../client/ui-test/docs/demos/data-grid/selection-toolbar';
import type { DocEntry } from './types';

const USAGE = `import { DataGrid, defineColumns, GridToolbar, useGridPreference, useGridSelection } from '@hvy/ui';

const ALL_COLUMNS = defineColumns<Order>([
  { id: 'orderId', headerWord: 'orderid', width: 140, primary: true, pinned: true, hideable: false },
  { id: 'amount', headerWord: 'amount', width: 110, align: 'right', format: (v) => money(v) },
]);

<DataGrid columns={columns} rows={rows} getRowId={(r) => r.orderId} … />`;

/** DataGrid 문서 — 목록 화면의 그리드 배선 전체(정렬·선택·페이징·컬럼 설정). */
export const dataGridDoc: DocEntry = {
  slug: 'data-grid',
  category: 'components',
  title: 'DataGrid',
  description:
    '가상 스크롤 데이터 그리드와 그 부속(GridToolbar · Pager · PageSizeSelect · TotalCount · ColumnSettingsDialog · useGridPreference · useGridSelection). 그리드는 표시만 맡고, 정렬·페이징의 진실 소스는 호출부(실전에서는 URL)다. 고정열은 sticky 인데 가상 스크롤 행을 translateY 가 아니라 top 으로 배치하는 이유가 이 sticky 때문이다(조상 transform 이 containing block 을 만든다). 밀도는 축이 둘이다 — 테마(--dl-scale-* 5키)가 전체를 옮기고 density prop 이 그 안에서 단계를 고른다. 둘은 곱해진다.',
  usage: USAGE,
  examples: [
    {
      id: 'full',
      title: '메인 화면 재현 — 정렬 · 선택 · 페이징 · 컬럼 설정',
      note: '컬럼 설정(폭·숨김·순서)은 localStorage 에 저장된다 — 바꾼 뒤 새로고침해서 유지되는지 확인해 볼 것. 결과가 교체되면(정렬·페이징) 선택이 비워지는 resetKey 배선도 핵심이다. 주문번호 클릭·행 액션은 토스트로 배선했다.',
      file: 'src/client/ui-test/docs/demos/data-grid/full.tsx',
      Component: DataGridFullDemo,
    },
    {
      id: 'editing',
      title: '인라인 편집 — 더블클릭 편집 · 행 추가/삭제 · 검증 · 저장 계약',
      note: '셀을 더블클릭하면 에디터로 바뀌고(Enter 확정 후 아래 이동 · Tab 좌우 이동 · Esc 취소), 수정 셀은 dirty 배경과 함께 셀 안에 ✕(수정 원복) 아이콘이 나타난다 — 편집이 셀 단위이므로 원복도 셀 단위다. ✕를 누르거나 값을 원복하거나 저장하면 dirty 가 사라진다. 행 추가는 행 전체 dirty + 주문번호 링크 비활성, 저장은 validateAll() 통과 후 getSaveRequestData() — 현행 gridWrapper 의 { addList, updateList } 계약 그대로다. 미저장 상태의 재조회는 확인 모달, 새로고침·탭 닫기는 useBeforeUnloadGuard 가 막는다. 컬럼 설정(순서·숨김)도 편집과 공존한다 — useGridEditing 에는 숨김 적용 전 전체 컬럼을 넘기므로, 숨긴 편집 컬럼도 저장 전 검증에 포함된다.',
      file: 'src/client/ui-test/docs/demos/data-grid/editing.tsx',
      Component: DataGridEditingDemo,
    },
    {
      id: 'density',
      title: '밀도 5단 — 그리드 전체가 한 단계로 함께 움직인다',
      note: '행 높이만 바뀌는 것이 아니다. 헤더·선택열 폭·셀 좌우 패딩·셀 에디터 컨트롤이 함께 한 단계 움직인다 — 행(30+4n)과 컨트롤(22+4n)의 기울기가 같아 차이가 어느 단계에서도 8px 로 고정되기 때문이다. "편집 켜기" 후 셀을 더블클릭하면 에디터가 같은 단계로 줄어드는 것이 보인다. 상단 테마를 compact 로 바꾸면 5단 전체가 한 번 더 축소된다(두 축이 곱해진다). 글자 크기·컬럼 폭·툴바는 의도적으로 따라가지 않는다 — 각각 가독성·내용·크롬의 축이라 밀도 축이 아니다.',
      file: 'src/client/ui-test/docs/demos/data-grid/density.tsx',
      Component: DataGridDensityDemo,
    },
    {
      id: 'selection-toolbar',
      title: '선택 컨텍스트 툴바 — "N건 선택" 요약과 액션 교대',
      note: '행을 체크하면 페이징 옆에 "N건 선택" 요약(+해제 ×)이 뜨고, actions 자리가 selection.actions 로 교대한다. selection.actions 를 생략하면 요약만 뜨고 상시 액션이 유지된다 — 전부 opt-in 이라 기존 툴바는 그대로다. 표시 컨트롤은 교대하지 않는다(선택 중에도 열람 도구는 쓰인다).',
      file: 'src/client/ui-test/docs/demos/data-grid/selection-toolbar.tsx',
      Component: DataGridSelectionToolbarDemo,
    },
    {
      id: 'footer',
      title: '합계행 (footer) — 하단 sticky 요약',
      note: '값은 호출부가 계산해 넘긴다 — 서버 페이징이라 전체 합계는 서버만 알고, 그리드가 보이는 행을 합산하면 "페이지 합계"를 전체로 오독하는 사고가 된다. 헤더와 같은 sticky 크롬이라 세로 스크롤에도 하단에 남고 고정열(주문번호) 오프셋을 공유한다 — 가로 스크롤로 확인해 볼 것. 행이 0이면 그리지 않는다.',
      file: 'src/client/ui-test/docs/demos/data-grid/footer.tsx',
      Component: DataGridFooterDemo,
    },
    {
      id: 'empty',
      title: '빈 상태 — "행이 없다" 는 한 가지 사실이 아니다',
      note: 'idle(아직 조회 안 함) · empty(0건) · error(조회 실패) · 로딩(조회 중 — 첫 조회든 재조회든)은 서로 다른 사실이라 문구·색·다음 행동이 다르다. state 로 가르므로 앱마다 error ? … : … 삼항식을 복제할 필요가 없다. 가로로 끝까지 스크롤해도 문구가 화면 중앙에 남는 것(오버레이가 스크롤 컨테이너 밖이다)과, 행이 0인데 세로 스크롤바가 생기지 않는 것을 함께 확인한다. empty 를 아예 넘기지 않으면 기본 문구가 나온다 — 예전에는 헤더만 남은 빈 껍데기였다.',
      file: 'src/client/ui-test/docs/demos/data-grid/empty-states.tsx',
      Component: DataGridEmptyStatesDemo,
    },
  ],
  propsTables: [
    {
      title: 'DataGrid — 핵심 props',
      rows: [
        {
          name: 'columns',
          type: 'ColumnDef<T>[]',
          required: true,
          description:
            'defineColumns<T>() 로 정의 — 숨김·순서 반영은 applyColumnPreference 를 거친다.',
        },
        {
          name: 'rows',
          type: 'readonly T[]',
          required: true,
          description: '현재 페이지의 행들.',
        },
        {
          name: 'getRowId',
          type: '(row: T) => string',
          required: true,
          description: '행 식별자 — 선택·가상 스크롤 키.',
        },
        {
          name: 'sortOf / onToggleSort',
          type: '(columnId) => SortDirection | null / (columnId) => void',
          description: '정렬 상태는 호출부 소유 — 그리드는 표시와 토글 이벤트만 맡는다.',
        },
        {
          name: 'selection',
          type: 'GridSelection',
          description:
            'useGridSelection 결과를 그대로 배선한다 — resetKey 로 "목록의 신원"이 바뀌면 선택이 비워진다.',
        },
        {
          name: 'footer',
          type: 'GridFooter',
          description:
            '합계행 — { cells: { columnId: 표시값 } }. 값은 호출부(보통 서버 응답)가 계산한다. 하단 sticky 크롬이고 행이 0이면 그리지 않는다.',
        },
        {
          name: 'editing / revertCellLabel',
          type: 'GridEditing / string',
          description:
            'useGridEditing().binding 을 그대로 배선하면 더블클릭 편집·dirty/invalid 표시·셀 원복 ✕가 켜진다. 없으면 편집 경로가 전혀 열리지 않는다(opt-in).',
        },
        {
          name: 'isFetching',
          type: 'boolean',
          description:
            '조회 중 — 행 유무와 무관하게 빈 상태 오버레이가 본문을 덮고 가운데에 스피너+loadingLabel 을 그린다(로딩 중 "결과 없음"이 뜨지 않는 이유). 행이 남은 채 덮으므로 컨테이너 높이가 그대로라 툴바가 튀지 않는다. 재조회가 전부 사용자의 명시적 조작이라는 전제다 — 폴링처럼 스스로 갱신하는 경로라면 이전 데이터를 살려 두는 별도 표시가 필요하다.',
        },
        {
          name: 'density',
          type: "ControlSize ('xs'|'sm'|'md'|'lg'|'xl')",
          description:
            "기본 'md'. 행·헤더 높이, 선택열 폭, 셀 좌우 패딩, 셀 에디터가 함께 한 단계 움직인다. 테마 스케일과 곱해진다 — compact 테마의 xs 는 36px, default 는 40px.",
        },
        {
          name: 'empty',
          type: 'GridEmpty — { state?, title, hint?, icon?, action? }',
          description:
            "생략해도 기본 문구가 나온다. state 는 'idle'|'empty'|'error'(기본 'empty') — 0건과 조회 실패를 여기서 가르므로 앱이 삼항식을 복제하지 않는다. icon: null 이면 아이콘 없음, action 은 한 개짜리 탈출구(\"다시 시도\" 등).",
        },
        {
          name: 'columnWidths / onColumnWidthsChange',
          type: 'Record<string, number> / (widths) => void',
          description: '리사이즈 영속 — useGridPreference.widths 와 배선한다.',
        },
        {
          name: 'attachedToolbar',
          type: 'boolean',
          description: '바로 아래 GridToolbar 와 보더를 이어 붙인다.',
        },
      ],
    },
    {
      title: 'useGridPreference(options)',
      rows: [
        {
          name: 'userKey / menuUrl / gridId',
          type: 'string',
          required: true,
          description: 'localStorage 키 3축 — menuUrl 은 인가가 아니라 키 스코프다.',
        },
        {
          name: '반환',
          type: '{ preference, widths, setWidths, setPreference, reset }',
          description: '컬럼 표시·순서·폭의 브라우저 영속.',
        },
      ],
    },
    {
      title: 'useGridEditing(options)',
      rows: [
        {
          name: 'data / getRowId / columns',
          type: 'T[] / (row) => string / ColumnDef<T>[]',
          required: true,
          description:
            'data 는 서버 조회 원본(스냅샷은 여기서 파생 — 재조회하면 비교 기준도 따라간다). columns 는 숨김 적용 전 전체 — validate 소유자가 훅이라 숨긴 컬럼도 검증해야 한다.',
        },
        {
          name: 'resetKey',
          type: 'string',
          description: '바뀌면 편집 상태를 전부 비운다 — useGridSelection 과 같은 규약.',
        },
        {
          name: '반환 (그리드 배선)',
          type: '{ rows, getRowId, binding, dirtyCells }',
          description:
            'rows·getRowId·binding(editing prop) 3종을 DataGrid 에 그대로 넘긴다. dirty 표시는 binding 이 자동 파생한다.',
        },
        {
          name: '반환 (저장 계약)',
          type: '{ addRow, removeRow, setCell, isModified, getModifiedData, getSaveRequestData, reset }',
          description:
            '현행 gridWrapper.js 와 이름·형태가 같다 — getModifiedData() = { isModified, A, U }, getSaveRequestData() = { addList, updateList }. removeRow 는 추가(A) 행만 지운다.',
        },
        {
          name: '반환 (검증·원복)',
          type: '{ validateAll, invalidCells, revertCell, revertRow, activeCell, setActiveCell }',
          description:
            'validateAll() 은 실패 시 첫 오류 셀로 activeCell 을 옮기고 false — 저장 차단은 호출부가 이 반환값으로 한다. revertCell 은 dirty 셀의 ✕ 아이콘(binding.onRevertCell)이 부르는 것과 같은 함수다.',
        },
      ],
    },
    {
      title: 'ColumnDef — 편집 관련 필드',
      rows: [
        {
          name: 'editor',
          type: "{ type: 'text'|'number'|'select'|'multiselect'|'date'|'datetime'|'checkbox'|'custom', … }",
          description:
            '있으면 편집 가능 셀. checkbox 는 클릭-편집 없이 즉시 커밋(checkedValue/uncheckedValue 로 Y/N 매핑), custom 은 render({ value, row, commit, cancel }) 탈출구다.',
        },
        {
          name: 'editable',
          type: 'boolean',
          description:
            '편집 잠금 스위치 — editor 가 있어도 false 면 잠긴다. applyLockedColumns(마스킹 잠금)가 이 값을 덮어쓴다.',
        },
        {
          name: 'validate',
          type: '(value, row) => string | null',
          description:
            '셀 확정 시 실행. null = 유효, 문자열 = 오류 문구(셀에 빨간 링 + title). ui 는 사전을 모른다 — 번역된 문구를 넘긴다.',
        },
      ],
    },
    {
      title: 'useGridSelection(options)',
      rows: [
        {
          name: 'rows / getRowId / resetKey',
          type: 'T[] / (row) => string / string',
          required: true,
          description:
            'resetKey 가 바뀌면 선택이 비워진다 — 페이지·정렬·필터를 문자열로 이어 만든다.',
        },
        {
          name: '반환',
          type: '{ selectedIds, selectedCount, onChange, allState, toggleAll }',
          description: 'DataGrid selection prop 에 그대로 배선한다.',
        },
      ],
    },
    {
      title: 'GridToolbar — selection (전부 opt-in)',
      rows: [
        {
          name: 'count / summary',
          type: 'number / (count) => string',
          required: true,
          description:
            'useGridSelection 의 selectedCount 와 "N건 선택" 문구 — ui 는 사전을 모르므로 문구는 함수로 주입한다. count > 0 일 때만 요약·교대가 발동한다.',
        },
        {
          name: 'actions',
          type: 'ReactNode',
          description:
            '선택이 있는 동안 actions 자리를 교대하는 액션들(선택 삭제 등). 생략하면 요약만 뜨고 상시 액션이 유지된다.',
        },
        {
          name: 'clear',
          type: '{ label, onClick }',
          description: '선택 전체 해제 × — label 은 a11y 필수라 핸들러와 함께 받는다.',
        },
      ],
    },
  ],
};
