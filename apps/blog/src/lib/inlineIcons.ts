/**
 * 본문(dangerouslySetInnerHTML) 안에 문자열로 주입하는 lucide 아이콘.
 * React 트리 밖이라 lucide-react 컴포넌트를 쓸 수 없어 마크업을 그대로 둔다 — 색은 currentColor 로 부모를 따른다.
 */
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const COPY_ICON = svg(
  '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
);

export const CHECK_ICON = svg('<path d="M20 6 9 17l-5-5"/>');

export const FAIL_ICON = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');

export const MAXIMIZE_ICON = svg(
  '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
);

export const EXTERNAL_LINK_ICON = svg(
  '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
);
