/**
 * 컨트롤 사이즈 5단의 공통 축.
 *
 * 값의 실체는 테마 스케일(`--dl-scale-*`)이고 여기는 **이름만** 안다 —
 * 단계별 실제 px 는 `theme/default.css` 치수 섹션의 공식 표가 정본이다.
 */
export const CONTROL_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export type ControlSize = (typeof CONTROL_SIZES)[number];

/**
 * `dl-field` 계열 전용 사이즈 클래스.
 *
 * 반드시 이 map 으로 **1개만** 산출한다 — `dl-size-*` 는 로컬 변수만 세팅하는
 * 커스텀 유틸리티라 twMerge 가 중복을 걷어내지 못한다(theme/utilities.css 참조).
 */
export const FIELD_SIZE_CLASS: Record<ControlSize, string> = {
  xs: 'dl-size-xs',
  sm: 'dl-size-sm',
  md: 'dl-size-md',
  lg: 'dl-size-lg',
  xl: 'dl-size-xl',
};

/**
 * 표시 칸(view 모드·`FieldValue`)의 최소 높이 — 같은 size 컨트롤 높이와 같은 토큰에서
 * 유도된다(`FIELD_SIZE_CLASS` 와 파리티). 한 격자 안에 편집 칸과 표시 칸이 섞이거나
 * 모드를 토글해도 행이 어긋나지 않는 근거이므로, view 렌더는 반드시 이 map 을 쓴다.
 */
export const VALUE_MIN_H_CLASS: Record<ControlSize, string> = {
  xs: 'min-h-dl-control-xs',
  sm: 'min-h-dl-control-sm',
  md: 'min-h-dl-control',
  lg: 'min-h-dl-control-lg',
  xl: 'min-h-dl-control-xl',
};
