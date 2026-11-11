/**
 * mermaid 다이어그램 테마 — 글 본문·크게 보기 모달(mermaidRenderer)과 /util/mermaid 에디터가
 * 함께 쓰는 단일 정의. 세 곳이 같은 그림을 그리도록 설정을 여기 한 곳에서만 만든다.
 *
 * mermaid 런타임을 import 하지 않는 순수 모듈이라 node 환경에서 단위 테스트한다.
 *
 * - 라이트: 내장 `default` 테마의 색을 그대로 쓰고 선 두께만 올린다.
 * - 다크: 내장 `dark` 가 아니라 `base` 위에 팔레트를 쌓는다. 내장 `dark` 는 색 계산 단계에서
 *   선·테두리를 내부 상수로 다시 덮어써 원하는 색이 나오지 않는다.
 * - 레이아웃·모양·노드 폭 기본값은 mermaid 11 때의 값으로 고정한다(아래 CLASSIC_APPEARANCE 참조).
 * - themeCSS 는 mermaid 내부 클래스명(messageLine0, row-rect-odd, relationshipLine 등)에 기댄다.
 *   mermaid 버전을 올릴 때는 /util/mermaid 샘플 6종을 라이트·다크로 눈으로 확인할 것.
 */

/** 사이트 라이트/다크에 대응하는 다이어그램 테마 키. */
export type MermaidTheme = 'default' | 'dark';

/**
 * mermaid 12 가 바꾼 기본값을 11 때의 값으로 되돌리는 설정. 그대로 두면 이미 게시된 글의 다이어그램이
 * 다시 배치·채색되고, 이 파일의 팔레트·두께도 classic 모양에 맞춘 값이라 어긋난다.
 *
 * - layout·look: 12 의 기본은 ELK·neo 다.
 * - wrappingWidth: 12 는 라벨 줄바꿈 폭을 200 → 120 으로 줄였다.
 * - minNodeWidth: 12 가 새로 넣은 노드 최소 폭(기본 120)이다. 0 이면 라벨 폭만큼만 그린다.
 */
const CLASSIC_APPEARANCE = {
  layout: 'dagre',
  look: 'classic',
  flowchart: { wrappingWidth: 200, minNodeWidth: 0 },
  state: { wrappingWidth: 200, minNodeWidth: 0 },
} as const;

/** mermaid.initialize 에 펼쳐 넣는 모양 관련 설정 묶음. */
export type MermaidThemeOptions = typeof CLASSIC_APPEARANCE & {
  readonly theme: 'default' | 'base';
  readonly themeVariables: Readonly<Record<string, string | number | boolean>>;
  readonly themeCSS: string;
};

/** 엣지·노드 테두리의 기본 두께(px). 본문 최소 배율 0.7 에서도 1px 이상으로 그려지는 값이다. */
const STROKE_WIDTH = 2;

/** 클러스터·activation 같은 보조 컨테이너와 ER 관계선의 두께(px). */
const SECONDARY_STROKE_WIDTH = 1.5;

// 값은 packages/ui/src/theme/blog-dark.css 의 Tier 1 토큰과 같아야 한다 — mermaidTheme.test.ts 가 강제한다.
// token-exempt(19): 외부 라이브러리 테마 — mermaid themeVariables 는 색을 직접 연산해서 var(--dl-*) 를 받지 못한다.
export const MERMAID_DARK_TOKENS = {
  'gray-000': '#282c34',
  'gray-100': '#2e3138',
  'gray-150': '#32363e',
  'gray-200': '#1d2025',
  'gray-300': '#3c4049',
  'gray-600': '#7d8492',
  'gray-700': '#9da5b4',
  'gray-800': '#c9cdd6',
  black: '#abb2bf',
  'brand-500': '#61afef',
  'brand-050': '#253b52',
  'brand-150': '#2f5476',
  'green-500': '#98c379',
  'green-050': '#2b3a2c',
  'orange-500': '#d19a66',
  'orange-050': '#3a3226',
  'red-050': '#3c2a2e',
  'red-ink': '#e88892',
} as const;

// token-exempt(3): 같은 이유 — 배경은 blog.css 의 gray-000, 클러스터 테두리는 mermaid default 테마의 값이다.
const LIGHT_COLORS = {
  background: '#ffffff',
  clusterBorder: '#aaaa33',
} as const;

const D = MERMAID_DARK_TOKENS;

/**
 * 내보내기(PNG·SVG) 배경색 — 화면의 표면색(dl-surface)과 같다.
 * 다이어그램 색은 이 배경을 전제로 골랐으므로, 내보낼 때도 같은 배경을 깔아야 대비가 유지된다.
 */
export const MERMAID_EXPORT_BACKGROUND: Readonly<Record<MermaidTheme, string>> = {
  default: LIGHT_COLORS.background,
  dark: D['gray-000'],
};

/** mindmap·timeline 등 섹션 색을 쓰는 다이어그램의 다크 채움 순환. */
const DARK_SECTION_FILLS = [
  D['brand-050'],
  D['green-050'],
  D['orange-050'],
  D['red-050'],
  D['brand-150'],
  D['gray-150'],
] as const;

/**
 * 다크 팔레트를 mermaid themeVariables 키에 매핑한다.
 * 노드는 파랑 틴트 채움 + 브랜드 파랑 테두리, 선은 중립 회색, 노트는 주황 틴트다.
 * 채움과 배경의 대비는 일부러 낮고(1.2:1 안팎), 형태 경계는 3:1 이상인 테두리가 맡는다.
 * cScale 을 빼면 base 의 다크 계산이 섹션 색을 검정으로 만들므로 12칸을 모두 채운다.
 */
function buildDarkThemeVariables(): Record<string, string | number | boolean> {
  const sectionFills = Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => [
      `cScale${index}`,
      DARK_SECTION_FILLS[index % DARK_SECTION_FILLS.length],
    ]),
  );

  return {
    darkMode: true,
    strokeWidth: STROKE_WIDTH,
    background: D['gray-000'],

    // 노드
    primaryColor: D['brand-050'],
    mainBkg: D['brand-050'],
    nodeBkg: D['brand-050'],
    primaryBorderColor: D['brand-500'],
    nodeBorder: D['brand-500'],
    primaryTextColor: D['gray-800'],
    nodeTextColor: D['gray-800'],
    textColor: D.black,

    // 선·엣지 라벨
    lineColor: D['gray-700'],
    arrowheadColor: D['gray-700'],
    defaultLinkColor: D['gray-700'],
    edgeLabelBackground: D['gray-300'],

    // 클러스터(subgraph)
    clusterBkg: D['gray-200'],
    clusterBorder: D['gray-600'],
    titleColor: D['gray-800'],

    // 보조·3차 색
    secondaryColor: D['green-050'],
    secondaryBorderColor: D['green-500'],
    secondaryTextColor: D['gray-800'],
    tertiaryColor: D['gray-300'],
    tertiaryBorderColor: D['gray-600'],
    tertiaryTextColor: D['gray-800'],

    // 노트
    noteBkgColor: D['orange-050'],
    noteBorderColor: D['orange-500'],
    noteTextColor: D['gray-800'],

    // sequence
    actorBkg: D['brand-050'],
    actorBorder: D['brand-500'],
    actorTextColor: D['gray-800'],
    actorLineColor: D['gray-600'],
    signalColor: D['gray-700'],
    signalTextColor: D.black,
    labelBoxBkgColor: D['gray-100'],
    labelBoxBorderColor: D['gray-600'],
    labelTextColor: D['gray-800'],
    loopTextColor: D.black,
    activationBkgColor: D['brand-150'],
    activationBorderColor: D['brand-500'],
    sequenceNumberColor: D['gray-200'],

    // class · ER
    classText: D['gray-800'],
    rowOdd: D['gray-100'],
    rowEven: D['gray-150'],
    attributeBackgroundColorOdd: D['gray-100'],
    attributeBackgroundColorEven: D['gray-150'],

    // state
    stateBkg: D['brand-050'],
    stateBorder: D['brand-500'],
    stateLabelColor: D['gray-800'],
    transitionColor: D['gray-700'],
    transitionLabelColor: D.black,
    compositeBackground: D['gray-200'],
    compositeTitleBackground: D['brand-050'],
    compositeBorder: D['brand-500'],
    altBackground: D['gray-150'],
    labelBackgroundColor: D['gray-300'],

    // 섹션 색·오류
    ...sectionFills,
    scaleLabelColor: D['gray-800'],
    errorBkgColor: D['red-050'],
    errorTextColor: D['red-ink'],
  };
}

/**
 * themeVariables.strokeWidth 가 닿지 않는 곳의 두께를 맞추는 보충 CSS.
 * strokeWidth 는 flowchart·class·state·sequence actor 에만 적용되고, sequence 메시지선·ER·block 은
 * mermaid 스타일시트에 두께가 고정값으로 박혀 있다. mermaid 가 이 CSS 를 SVG id 로 스코프해
 * 다이어그램 CSS 뒤에 붙이며, 작성자의 `style`·`classDef` 지시문은 계속 이긴다.
 *
 * - ER 관계선은 마커(crow's foot)가 선 두께에 비례해 커지므로 보조 두께로 둔다.
 * - 점선은 두꺼워지면 기본 간격(2/2)이 실선처럼 뭉개져 간격을 넓힌다.
 * - ER 의 0/N 마커 원은 흰색이 하드코딩돼 있어 배경색으로 덮는다.
 * - block 은 `p` 글자색을 제목색으로 고정해 `style color:` 를 무시한다 — 상속으로 되살린다.
 */
function buildThemeCss(background: string, clusterBorder: string): string {
  const primary = `${STROKE_WIDTH}px`;
  const secondary = `${SECONDARY_STROKE_WIDTH}px`;
  return [
    `.messageLine0, .messageLine1 { stroke-width: ${primary}; }`,
    `.node rect, .node polygon, .node path, .node circle, .node ellipse { stroke-width: ${primary}; }`,
    `.note, .statediagram-note rect, .statediagram-note path { stroke-width: ${primary}; }`,
    '.divider path, .row-rect-odd path, .row-rect-even path { stroke-width: 1px; }',
    `.cluster rect, .activation0, .activation1, .activation2, .labelBox { stroke-width: ${secondary}; }`,
    `.node .cluster { stroke: ${clusterBorder}; stroke-width: ${secondary}; }`,
    `.relationshipLine { stroke-width: ${secondary}; }`,
    '.edge-pattern-dotted { stroke-dasharray: 2 4; }',
    `.marker.zeroOrOne circle, .marker.zeroOrMore circle { fill: ${background}; }`,
    '.node p { color: inherit; }',
  ].join('\n');
}

const THEME_OPTIONS: Readonly<Record<MermaidTheme, MermaidThemeOptions>> = {
  default: {
    theme: 'default',
    ...CLASSIC_APPEARANCE,
    themeVariables: { strokeWidth: STROKE_WIDTH },
    themeCSS: buildThemeCss(LIGHT_COLORS.background, LIGHT_COLORS.clusterBorder),
  },
  dark: {
    theme: 'base',
    ...CLASSIC_APPEARANCE,
    themeVariables: buildDarkThemeVariables(),
    themeCSS: buildThemeCss(D['gray-000'], D['gray-600']),
  },
};

/** next-themes 의 resolvedTheme('light' | 'dark')을 다이어그램 테마 키로 옮긴다. 미정이면 라이트로 본다. */
export function toMermaidTheme(resolvedTheme: string | undefined): MermaidTheme {
  return resolvedTheme === 'dark' ? 'dark' : 'default';
}

/** 다이어그램 테마 키에 해당하는 mermaid 설정(theme·themeVariables·themeCSS)을 돌려준다. */
export function mermaidThemeOptions(theme: MermaidTheme): MermaidThemeOptions {
  return THEME_OPTIONS[theme];
}
