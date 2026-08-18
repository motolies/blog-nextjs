/**
 * 테마 선택의 단일 진실 소스는 URL query(`?theme=`)다.
 *
 * 여기는 순수 함수만 둔다(shared 규칙) — DOM 조작은 theme-select.tsx(client),
 * 첫 페인트 전 반영은 layout.tsx 의 인라인 스크립트가 맡는다.
 * 새 테마 추가 = @hvy/ui 에 theme/<name>.css + 이 배열 1항목 + app/theme.css @import 1줄.
 */
export const THEMES = ['default', 'compact'] as const;

export type ThemeName = (typeof THEMES)[number];

/** 기본 테마 — URL 에 query 를 남기지 않는 값. */
export const DEFAULT_THEME: ThemeName = 'default';

/** URL 등 외부 입력을 테마 이름으로 정규화한다 — 미지값은 default 로 접는다. */
export function normalizeTheme(value: string | null | undefined): ThemeName {
  return (THEMES as readonly string[]).includes(value ?? '') ? (value as ThemeName) : DEFAULT_THEME;
}

/**
 * href 에 현재 테마 query 를 실어준다 — 문서 간 이동에서 테마가 유지되는 근거.
 * default 면 URL 을 더럽히지 않는다. hash 는 query **뒤**에 와야 하므로 분리 후 재조립한다
 * (EXPORT_INFO 의 href 에 `#anchor` 가 실존한다).
 */
export function withTheme(href: string, theme: ThemeName): string {
  if (theme === DEFAULT_THEME) return href;
  const hashIndex = href.indexOf('#');
  const base = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}theme=${theme}${hash}`;
}
