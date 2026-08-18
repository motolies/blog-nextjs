import type { ControlSize } from '../lib/controlSize';

/**
 * 그리드 밀도 5단의 토큰·클래스 색인.
 *
 * 밀도 축이 왜 성립하는지(행 30+4n · 컨트롤 22+4n → 차이 8px 고정)와 단계별 토큰을
 * **루트에 5개씩** 두는 이유는 `theme/default.css` 의 그리드 밀도 섹션이 정본이다.
 *
 * ⚠️ **토큰 이름을 템플릿 리터럴로 조립하지 않는다.** `scripts/verify-tokens.mjs` 의
 * 검사 ⑤(미정의 토큰 참조)가 소스의 **문자열 리터럴**을 스캔하는데, 조립된 이름은
 * 스캔에 걸리지 않아 오타가 조용히 fallback 으로 떨어진다 — 그건 에러 없이 화면만
 * 틀어지는 종류의 실패다. `FIELD_SIZE_CLASS`(lib/controlSize.ts)와 같은 규약이다.
 */
export const GRID_ROW_TOKEN: Readonly<Record<ControlSize, string>> = {
  xs: '--spacing-dl-grid-row-xs',
  sm: '--spacing-dl-grid-row-sm',
  md: '--spacing-dl-grid-row-md',
  lg: '--spacing-dl-grid-row-lg',
  xl: '--spacing-dl-grid-row-xl',
};

export const GRID_HEADER_TOKEN: Readonly<Record<ControlSize, string>> = {
  xs: '--spacing-dl-grid-header-xs',
  sm: '--spacing-dl-grid-header-sm',
  md: '--spacing-dl-grid-header-md',
  lg: '--spacing-dl-grid-header-lg',
  xl: '--spacing-dl-grid-header-xl',
};

export const GRID_CHECK_TOKEN: Readonly<Record<ControlSize, string>> = {
  xs: '--spacing-dl-grid-check-xs',
  sm: '--spacing-dl-grid-check-sm',
  md: '--spacing-dl-grid-check-md',
  lg: '--spacing-dl-grid-check-lg',
  xl: '--spacing-dl-grid-check-xl',
};

/**
 * SSR fallback — **default 스케일 기준 실측치**다. 하이드레이션 후 `useTokenPx` 가
 * 실제 토큰 값으로 바꾼다. 테마가 스케일을 바꾸면 이 숫자와 달라지는 것이 정상이다
 * (compact 는 36·40·44·50·54) — 그래서 fallback 이지 정본이 아니다.
 */
export const GRID_ROW_FALLBACK: Readonly<Record<ControlSize, number>> = {
  xs: 40,
  sm: 44,
  md: 50,
  lg: 54,
  xl: 60,
};

/** 헤더는 행과 같은 수열이다(둘 다 30+4n) — 갈라질 이유가 생기면 그때 분리한다. */
export const GRID_HEADER_FALLBACK = GRID_ROW_FALLBACK;

/** 선택열 폭 = 체크박스 폭 × 2 (16·18·20·22·24 → 32·36·40·44·48). */
export const GRID_CHECK_FALLBACK: Readonly<Record<ControlSize, number>> = {
  xs: 32,
  sm: 36,
  md: 40,
  lg: 44,
  xl: 48,
};

/**
 * 셀 좌우 패딩 클래스.
 *
 * `px-*` 는 실프로퍼티(padding-inline)를 내는 표준 유틸리티라 twMerge 가 중복을
 * 걷어낸다 — `dl-size-*` 같은 로컬변수 전용 유틸리티가 아니어도 되는 이유다.
 */
export const GRID_CELL_PX_CLASS: Readonly<Record<ControlSize, string>> = {
  xs: 'px-dl-cell-x-xs',
  sm: 'px-dl-cell-x-sm',
  md: 'px-dl-cell-x',
  lg: 'px-dl-cell-x-lg',
  xl: 'px-dl-cell-x-xl',
};
