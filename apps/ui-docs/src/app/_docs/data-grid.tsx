import { DataGridDensityDemo } from '../../client/ui-test/docs/demos/data-grid/density';
import { DataGridEditingDemo } from '../../client/ui-test/docs/demos/data-grid/editing';
import { DataGridEmptyStatesDemo } from '../../client/ui-test/docs/demos/data-grid/empty-states';
import { DataGridFooterDemo } from '../../client/ui-test/docs/demos/data-grid/footer';
import { DataGridFullDemo } from '../../client/ui-test/docs/demos/data-grid/full';
import { DataGridHeightAutoPxDemo } from '../../client/ui-test/docs/demos/data-grid/height-auto-px';
import { DataGridHeightFillDemo } from '../../client/ui-test/docs/demos/data-grid/height-fill';
import { DataGridHeightFillChainDemo } from '../../client/ui-test/docs/demos/data-grid/height-fill-chain';
import { DataGridHeightRowsDemo } from '../../client/ui-test/docs/demos/data-grid/height-rows';
import { DataGridPageSizeFallbackDemo } from '../../client/ui-test/docs/demos/data-grid/page-size-fallback';
import { DataGridPageSizePreferenceDemo } from '../../client/ui-test/docs/demos/data-grid/page-size-preference';
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
    '가상 스크롤 데이터 그리드와 그 부속(GridToolbar · Pager · PageSizeSelect · TotalCount · ColumnSettingsDialog · useGridPreference · useGridSelection). 그리드는 표시만 맡고, 정렬·페이징의 진실 소스는 호출부(실전에서는 URL)다. 고정열은 sticky 인데 가상 스크롤 행을 translateY 가 아니라 top 으로 배치하는 이유가 이 sticky 때문이다(조상 transform 이 containing block 을 만든다). 밀도는 축이 둘이다 — 테마(--dl-scale-* 5키)가 전체를 옮기고 density prop 이 그 안에서 단계를 고른다. 둘은 곱해진다. 높이는 네 모양(px · auto · fill · rows)이다 — fill 은 부모 flex 사슬(column flex + min-height:0)이 조건이고, 사슬이 끊기면 에러 없이 auto 로 퇴화한다.',
  usage: USAGE,
  examples: [
    {
      id: 'full',
      title: '메인 화면 재현 — 정렬 · 선택 · 페이징 · 컬럼 설정',
      note: '컬럼 설정(폭·숨김·순서)은 localStorage 에 저장된다 — 바꾼 뒤 새로고침해서 유지되는지 확인해 볼 것. 페이지 크기도 같은 항목에 저장된다 — 바꾸고 새로고침. 결과가 교체되면(정렬·페이징) 선택이 비워지는 resetKey 배선도 핵심이다. 주문번호 클릭·행 액션은 토스트로 배선했다.',
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
    {
      id: 'height-fill',
      title: '높이 ① fill — 남은 높이를 채운다',
      note: '점선 상자가 목록 화면의 표 패널(column flex + 확정 높이) 역할이다. "행 3개만"이면 그리드가 3행 높이로 끝나고 상자 아래가 빈다 — fill 은 grow 하지 않는다. 57건이면 상자를 채우며 내부 스크롤·헤더 sticky·툴바 고정이 유지된다. 우하단 핸들로 상자를 늘리면 행이 더 보이고, 줄이면 헤더+2행 하한에서 그리드가 멈춘다. 강제 빈 상태는 2~5행 높이이고 세로 스크롤바가 없어야 한다.',
      file: 'src/client/ui-test/docs/demos/data-grid/height-fill.tsx',
      Component: DataGridHeightFillDemo,
    },
    {
      id: 'height-rows',
      title: '높이 ② { rows: N } — 다중 그리드 화면의 행 단위 고정',
      note: '행 수 3/5/8 × density 5단 × 합계행 × 상단 테마 4종 어느 조합에서도 정확히 N행이 보이고 N+1행 윗선이 비치지 않아야 한다. 오른쪽에 합계행을 켜면 그리드가 정확히 한 줄만큼 높아지되 데이터 행은 그대로 N행이다(합계행은 스크롤 영역 안 sticky 라 그만큼 더한다). 합계행을 끄면 두 그리드 높이가 같다. px 가 아니라 행 단위라 밀도·테마 토큰 실측을 따라간다.',
      file: 'src/client/ui-test/docs/demos/data-grid/height-rows.tsx',
      Component: DataGridHeightRowsDemo,
    },
    {
      id: 'height-auto-px',
      title: '높이 ③ auto vs px — 스크롤이 어디에 생기는가',
      note: '57건에서 auto 는 행 수만큼 늘어 페이지 스크롤이 생기고 헤더가 뷰포트에 붙지 않는다. px(320)는 안에서 스크롤하고 헤더 sticky 가 유지된다. "행 3개만"이면 둘 다 내용 높이로 같아진다. auto 는 페이징 없는 집계표 전용이다 — 모든 행이 뷰포트 안이라 가상 스크롤이 사실상 꺼지므로 수백 행에는 쓰지 않는다.',
      file: 'src/client/ui-test/docs/demos/data-grid/height-auto-px.tsx',
      Component: DataGridHeightAutoPxDemo,
    },
    {
      id: 'height-fill-chain',
      title: '높이 ④ fill 이 조용히 실패하는 조건 — flex 사슬',
      note: '(a) flex-column 부모는 채움+내부 스크롤, (b) block 부모는 내용 높이로 늘어나 상자 밖(툴바 포함)이 잘린다 — 에러 없이 조용히 어긋나는 실패다. "부모 min-height:0 제거"를 켜면 (a) 안의 중간 래퍼에서 min-h-0 만 빠지는데, flex 아이템의 자동 최소 높이가 내용 높이라 (b) 와 똑같이 넘쳐 잘린다. 앱의 .admin-table-shell 이 column flex + min-height:0 이어야 하는 이유이고, admin-page-frame--fixed 가 lg 미만에서 풀리면 같은 방식으로 auto 로 퇴화한다(그때는 의도된 페이지 스크롤).',
      file: 'src/client/ui-test/docs/demos/data-grid/height-fill-chain.tsx',
      Component: DataGridHeightFillChainDemo,
    },
    {
      id: 'page-size-preference',
      title: '페이지 크기 영속 — 컬럼 설정과 같은 항목, 초기화에도 남는다',
      note: '50 을 고르면 오른쪽 패널의 JSON 에 "pageSize":50 이 나타나고(디바운스 300ms 뒤) 새로고침해도 50 이다. 컬럼을 숨긴 뒤 컬럼 설정의 "초기화"를 누르면 컬럼만 되돌고 JSON 에는 pageSize 만 남는다 — 초기화 후 다시 연 다이얼로그에서 정의상 숨김인 서비스타입이 체크 해제로 보여야 한다. 컬럼 폭을 드래그하면 widths 만 갱신되고 pageSize 는 그대로다. 저장값이 목록 밖이면 첫 옵션으로 떨어뜨리는 판단은 앱(데모)의 몫이다.',
      file: 'src/client/ui-test/docs/demos/data-grid/page-size-preference.tsx',
      Component: DataGridPageSizePreferenceDemo,
    },
    {
      id: 'page-size-fallback',
      title: '페이지 크기 검증 — 레거시·목록 밖·불량 값',
      note: '버튼이 localStorage 에 원문 JSON 을 직접 쓰고 그리드 블록을 리마운트한다. 레거시(pageSize 없음)는 undefined 이고 주문번호 폭 180 이 유지된다. 25 는 ui 가 그대로 주지만 셀렉트는 10 이다(허용 목록은 앱이 안다). 0 과 문자열 "20" 은 pageSize 항목만 탈락하고 폭은 유지된다. version 2 는 전부 폐기되어 폭도 기본 140 으로 돌아간다.',
      file: 'src/client/ui-test/docs/demos/data-grid/page-size-fallback.tsx',
      Component: DataGridPageSizeFallbackDemo,
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
        {
          name: 'maxHeight',
          type: "number | 'auto' | 'fill' | { rows: number }",
          defaultValue: '560',
          description:
            "본문 높이 규칙. number 는 스크롤 상한(px). 'auto' 는 상한 없음 — 페이징 없는 집계표 전용. 'fill' 은 flex-column 부모의 남은 높이 안에서 줄어든다(CSS 만) — 행이 적으면 내용 높이, 넘치면 내부 스크롤이며 부모 사슬이 전부 column flex + min-height:0 이어야 성립하고 아니면 'auto' 와 같다. { rows: N } 은 헤더 + N행(+합계행) 고정 — px 가 아니라 행 단위라 밀도·테마를 따라간다. 한 화면에 그리드가 둘이거나 다이얼로그 안일 때.",
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
          type: '{ preference, widths, pageSize, setWidths, setPreference, setPageSize, reset }',
          description:
            '컬럼 표시·순서·폭·페이지 크기의 브라우저 영속(같은 저장 항목). pageSize 는 저장값 그대로(양의 정수 검증만)이고 없으면 undefined — 기본값과 허용 목록은 앱이 정한다. reset 은 컬럼만 지우고 pageSize 는 남긴다.',
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
