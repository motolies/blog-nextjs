/**
 * 페이지 크기 계약 — 목록 화면 전부가 같은 값을 쓴다.
 *
 * 화면별 기본값은 두지 않는다(저장값이 화면별 차이를 대신한다). 예전에는 페이지마다
 * 10/20/25 가 섞여 있었고, 그 원인이 바로 화면별 기본값 옵션이었다.
 * `src/hooks`(useServerGrid/useClientGrid)와 그리드 컴포넌트(GridPagingBar/useGridSettings)가
 * 함께 import 하는 자리라 `lib` 에 둔다 — React 무의존 순수 모듈이라 node 환경에서 테스트된다.
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

/** 타입이 목록 원소로 묶여 있어, 목록에 없는 기본값은 컴파일 에러다. */
export const DEFAULT_PAGE_SIZE: PageSizeOption = 10;

/**
 * useServerGrid/useClientGrid ↔ useGridSettings 사이의 controlled 페이지 크기 계약.
 * 객체 하나로 묶는 이유: 쪼개 받을 수 있으면 `onPageSizeChange` 만 빼먹은 그리드가
 * 컴파일을 통과한다(`gridProps` 와 같은 이유).
 */
export type GridPagingControl = {
  readonly pageSize: number;
  readonly onPageSizeChange: (next: number) => void;
};

/**
 * 저장값 → 실제 페이지 크기. 목록에 없으면 기본값(가까운 값으로 붙이지 않는다).
 * 1) Select 는 목록 밖 값을 placeholder 로 그려 빈 컨트롤처럼 보인다.
 * 2) 목록 밖 값은 옵션 변경이나 손으로 고친 localStorage 에서만 나온다 — 그대로 서버 파라미터가 되면 안 된다.
 *    페이지 크기는 이전에 저장된 적이 없어 레거시 25 는 없다.
 * 보정값을 되쓰지 않는다 — 다음 사용자 변경이 덮는다.
 */
export function resolvePageSize(saved: number | undefined): number {
  return saved !== undefined && (PAGE_SIZE_OPTIONS as readonly number[]).includes(saved)
    ? saved
    : DEFAULT_PAGE_SIZE;
}
