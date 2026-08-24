import {
  GridToolbar,
  type GridToolbarSelection,
  IconButton,
  Pager,
  PageSizeSelect,
  TotalCount,
} from '@hvy/ui';
import { Columns3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PAGE_SIZE_OPTIONS } from '@/lib/gridPaging';
import { COLUMN_SETTINGS_LABELS, PAGER_LABELS } from './gridLabels';

/**
 * 그리드 하단 페이징 바 — GridToolbar+Pager+TotalCount+PageSizeSelect 를
 * 한국어 라벨로 조립한 앱 컴포지트. useServerGrid/useClientGrid 반환값을 그대로 배선한다.
 *
 * 슬롯 배치는 `@hvy/ui` GridToolbar 의 계약을 그대로 따른다 —
 * `[총 N건 · 페이저 · 페이지크기] … [액션들] │ [표시 컨트롤]`.
 * 총 건수·페이지 크기를 오른쪽(viewControls)으로 옮기면 ui-docs 기준 화면과 갈라진다.
 */
export function GridPagingBar({
  pageIndex,
  pageCount,
  onPageChange,
  total,
  pageSize,
  onPageSizeChange,
  actions,
  onColumnSettings,
  selection,
}: {
  pageIndex: number;
  pageCount: number;
  onPageChange: (next: number) => void;
  total: number;
  pageSize: number;
  onPageSizeChange: (next: number) => void;
  /** 화면 액션 슬롯 — 행 추가·저장 등. 표시 컨트롤(컬럼 설정)은 여기가 아니다. */
  actions?: ReactNode;
  /** 컬럼 설정 열기 — useGridSettings 의 openSettings 를 넘기면 표시 컨트롤에 아이콘이 뜬다. */
  onColumnSettings?: () => void;
  selection?: GridToolbarSelection;
}) {
  return (
    // 좁은 화면에서 총건수·페이저·페이지크기·액션이 넘치지 않도록 줄바꿈 허용.
    // shrink-0: 표 셸(.admin-table-shell)이 column flex 라 그리드가 남은 높이를 먹을 때
    // 페이징 바까지 눌리지 않게 — fill 밖에서는 무해하다.
    <GridToolbar
      className="shrink-0 flex-wrap"
      paging={
        <>
          <TotalCount
            total={total}
            prefix="총"
            suffix="건"
            format={(value) => value.toLocaleString('ko-KR')}
          />
          <Pager
            pageIndex={pageIndex}
            pageCount={pageCount}
            onChange={onPageChange}
            labels={PAGER_LABELS}
          />
          <PageSizeSelect
            value={pageSize}
            options={PAGE_SIZE_OPTIONS}
            label="페이지당 건수"
            suffix="건"
            format={(value) => String(value)}
            onChange={onPageSizeChange}
          />
        </>
      }
      actions={actions}
      selection={selection}
      viewControls={
        onColumnSettings ? (
          <IconButton
            icon={Columns3}
            label={COLUMN_SETTINGS_LABELS.title}
            size="sm"
            onClick={onColumnSettings}
          />
        ) : undefined
      }
    />
  );
}
