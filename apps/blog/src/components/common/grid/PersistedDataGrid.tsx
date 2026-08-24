// 이 파일만 biome override 로 DataGrid 직접 import 가 허용된다 — 앱의 유일한 통로.
import { DataGrid, type DataGridProps } from '@hvy/ui';
import type { GridSettings } from './useGridSettings';

type Props<T extends Record<string, unknown>> = Omit<
  DataGridProps<T>,
  'columns' | 'columnWidths' | 'onColumnWidthsChange'
> & {
  /** useGridSettings 반환값 통째로 — 폭 영속과 컬럼 설정 다이얼로그가 함께 배선된다. */
  readonly settings: GridSettings<T>;
};

/**
 * apps/blog 의 DataGrid 유일 진입점 — `settings` 가 필수라 컬럼 폭·숨김·순서의
 * localStorage 영속 배선을 빼먹을 수 없다 (누락 = tsc 에러).
 *
 * §10 판정 준수(docs/ui-migration-removed-features.md): props 를 번역하지 않고
 * @hvy/ui 의 DataGridProps 를 그대로 통과시키는 앱 컴포지트다 — 구 API 표면을
 * 유지하던 673줄 어댑터(BlogDataGrid)와 다르다. **settings 외 독자 prop 추가 금지** —
 * DataGrid 에 prop 이 새로 생기면 이 파일 수정 없이 자동 통과된다.
 *
 * 같은 이유로 `maxHeight` 기본값도 여기 두지 않는다 — 목록 페이지는 `maxHeight="fill"` 을
 * 직접 명시한다(페이지에서 grep 가능해야 flex 사슬 점검이 된다).
 * `settings.paging` 은 이 컴포넌트가 소비하지 않는다 — 페이지가 grid 훅에 넘긴다.
 */
export function PersistedDataGrid<T extends Record<string, unknown>>({
  settings,
  ...rest
}: Props<T>) {
  return (
    <>
      <DataGrid<T> {...rest} {...settings.gridProps} />
      {settings.dialog}
    </>
  );
}
