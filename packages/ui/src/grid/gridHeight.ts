/**
 * DataGrid 높이 규칙의 순수 계산 — React·DOM 무의존이라 node 환경에서 단위 테스트가 된다.
 *
 * `maxHeight` 네 모양 중 CSS `max-height` 로 내려갈 숫자는 `number` 와 `{ rows }` 뿐이다.
 * `'auto'`·`'fill'` 은 둘 다 상한이 없다(null) — 둘의 차이는 컨테이너 클래스(flex 수축)에서
 * 갈리지 max-height 에서 갈리지 않는다. 그래서 반환이 판별 유니온이 아니라 `number | null` 이다:
 * fill 여부는 호출부가 `maxHeight === 'fill'` 로 이미 알고 있고, 이 함수가 클래스 결정까지
 * 떠맡을 이유가 없다.
 */

/**
 * `DataGrid.maxHeight` 의 네 모양.
 * - `number`      스크롤 상한(px).
 * - `'auto'`      상한 없음 — 행 수만큼 늘어난다.
 * - `'fill'`      flex-column 부모의 남은 높이 안에서 줄어든다(CSS 만).
 * - `{ rows: N }` 헤더 + N행(+합계행) 고정 — px 가 아니라 행 단위라 밀도·테마를 따라간다.
 */
export type GridMaxHeight = number | 'auto' | 'fill' | { readonly rows: number };

/** 높이 계산에 필요한 실측값. 전부 테마 토큰에서 온다(`useTokenPx`) — 여기서는 숫자만 받는다. */
export type GridHeightMetrics = {
  readonly rowHeight: number;
  readonly headerHeight: number;
  /** 합계행이 그려질 때의 높이(= rowHeight). 안 그리면 0. */
  readonly footerHeight?: number;
};

/**
 * `maxHeight` 를 CSS `max-height` 에 넣을 px 로 푼다. 상한이 없으면(auto·fill) null.
 *
 * `{ rows: N }` 은 헤더 + N행 + 합계행 — 합계행은 스크롤 영역 안의 sticky 라 보이는 행 수에서
 * 한 줄을 먹으므로, N행이 **정확히** 보인 뒤 스크롤이 생기려면 더해야 한다.
 * N 은 1 이상 정수로 정규화한다 — 0·음수·NaN 은 헤더만 남은 표가 되고, 소수는 행이 잘린다.
 */
export function resolveGridMaxHeight(
  maxHeight: GridMaxHeight,
  { rowHeight, headerHeight, footerHeight = 0 }: GridHeightMetrics,
): number | null {
  if (maxHeight === 'auto' || maxHeight === 'fill') return null;
  if (typeof maxHeight === 'number') return maxHeight;
  const rows = Number.isFinite(maxHeight.rows) ? Math.max(1, Math.floor(maxHeight.rows)) : 1;
  return headerHeight + rowHeight * rows + footerHeight;
}

/**
 * 빈 상태 본문 높이 — 하한 2행(문구+힌트+액션이 눌리지 않는 최소치), 상한 5행,
 * max-height 가 있으면 그 안(헤더를 뺀 값). 상한이 없으면(auto·fill) 5행이다.
 *
 * 상한보다 하한이 우선한다(`Math.max` 가 바깥) — max-height 가 헤더+1행처럼 극단적으로 작아도
 * 빈 상태 문구가 눌려 잘리는 것보다 그리드가 조금 넘치는 편이 낫다.
 */
export function resolveEmptyBodyHeight(
  resolvedMaxHeight: number | null,
  { rowHeight, headerHeight }: Pick<GridHeightMetrics, 'rowHeight' | 'headerHeight'>,
): number {
  const cap = resolvedMaxHeight === null ? rowHeight * 5 : resolvedMaxHeight - headerHeight;
  return Math.max(rowHeight * 2, Math.min(rowHeight * 5, cap));
}
