#!/usr/bin/env node
/**
 * 디자인 토큰 강제 — 컴포넌트가 색·굵기·치수를 직접 박지 못하게 한다.
 *
 * CLAUDE.md §1 "컴포넌트에 hex/rgb 리터럴 → 회사별 런타임 테마 주입이 불가능해진다"의
 * 강제 수단(CI grep)이다. 오래 선언만 되어 있고 구현이 없었다.
 *
 * 검사하는 것 5가지:
 *   1. hex 리터럴            #2578E4
 *   2. 색 함수               rgb( rgba( hsl( oklch( …
 *   3. Tailwind 기본 팔레트  bg-black/40  text-gray-500     ← 실제 유출 경로는 hex 가 아니라 이쪽이다
 *   4. 명세 밖 font-weight   font-medium                    ← v3 는 400·600·700 세 가지뿐
 *   5. 미정의 토큰 참조      bg-dl-primry  --spacing-dl-row ← Tailwind 는 오타를 조용히 버린다
 *
 * 5번이 가장 값이 크다. `bg-dl-primry` 는 CSS 가 한 줄도 안 나오고 화면만 조용히 틀어지며,
 * `useTokenPx('--spacing-dl-row')` 는 토큰 이름이 바뀐 순간 에러 없이 fallback 으로 떨어진다.
 *
 * 검사기가 조용히 죽는 것이 위반보다 위험하므로, 본 검사 전에 SELF_TEST 로
 * 자기 정규식이 실제로 동작하는지 먼저 확인한다(하나라도 어긋나면 exit 1).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 토큰 원본. 여기서 선언된 이름이 "쓸 수 있는 토큰"의 전부다(CLAUDE.md §4). */
const THEME_DIR = join(ROOT, 'packages/ui/src/theme');
const CN_PATH = join(ROOT, 'packages/ui/src/lib/cn.ts');

const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '__boundary-violations__']);

// ─────────────────────────────────────────────────────────────────────────────
// 토큰 수집
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tailwind v4 의 `@theme` 네임스페이스 → 그 토큰을 소비하는 유틸리티 접두사.
 *
 * 접두사가 어느 네임스페이스로 가는지 알아야 `text-dl-sm`(크기)과 `text-dl-fg`(색)를
 * 둘 다 통과시키면서 `text-dl-없는것`만 잡을 수 있다.
 */
const UTILITY_PREFIXES = {
  // 색을 받는 유틸리티
  color: [
    'bg',
    'text',
    'border',
    'border-t',
    'border-r',
    'border-b',
    'border-l',
    'border-x',
    'border-y',
    'ring',
    'ring-offset',
    'outline',
    'fill',
    'stroke',
    'decoration',
    'accent',
    'caret',
    'divide',
    'placeholder',
    'shadow',
    'from',
    'via',
    'to',
  ],
  text: ['text'],
  radius: [
    'rounded',
    'rounded-t',
    'rounded-r',
    'rounded-b',
    'rounded-l',
    'rounded-tl',
    'rounded-tr',
    'rounded-br',
    'rounded-bl',
    'rounded-s',
    'rounded-e',
  ],
  shadow: ['shadow', 'inset-shadow', 'drop-shadow'],
  font: ['font'],
  'font-weight': ['font'],
  spacing: [
    'p',
    'px',
    'py',
    'pt',
    'pr',
    'pb',
    'pl',
    'ps',
    'pe',
    'm',
    'mx',
    'my',
    'mt',
    'mr',
    'mb',
    'ml',
    'ms',
    'me',
    'w',
    'h',
    'size',
    'min-w',
    'min-h',
    'max-w',
    'max-h',
    'gap',
    'gap-x',
    'gap-y',
    'space-x',
    'space-y',
    'inset',
    'inset-x',
    'inset-y',
    'top',
    'right',
    'bottom',
    'left',
    'start',
    'end',
    'translate-x',
    'translate-y',
    'basis',
    'indent',
    'scroll-m',
    'scroll-p',
  ],
};

/**
 * 테마 CSS 에서 선언된 토큰을 모은다.
 *
 * 반환값 둘의 쓰임이 다르다:
 *   variables — `var(--x)` / `useTokenPx('--x')` 참조 검사용. 선언된 **전체 이름**.
 *   utilities — `bg-dl-x` 검사용. 네임스페이스를 벗긴 **꼬리 이름**을 접두사별로 색인.
 */
function collectTokens() {
  const variables = new Set();
  /** @type {Map<string, Set<string>>} 유틸리티 접두사 → 허용되는 꼬리 이름 */
  const utilities = new Map();
  /** `@utility dl-field` 처럼 직접 정의된 클래스. 접두사 없이 그대로 쓰인다. */
  const customUtilities = new Set();

  let files;
  try {
    files = readdirSync(THEME_DIR).filter((name) => name.endsWith('.css'));
  } catch {
    throw new Error(`테마 디렉터리를 읽을 수 없습니다: ${THEME_DIR}`);
  }
  if (files.length === 0) throw new Error(`테마 CSS 가 없습니다: ${THEME_DIR}`);

  for (const name of files) {
    const css = readFileSync(join(THEME_DIR, name), 'utf8');

    // `--color-dl-primary: #2578E4;` 형태의 선언
    for (const match of css.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)) {
      const variable = match[1];
      variables.add(variable);

      // 네임스페이스를 가장 긴 것부터 시도한다 — `font-weight` 가 `font` 보다 먼저다.
      const namespaces = Object.keys(UTILITY_PREFIXES).sort((a, b) => b.length - a.length);
      for (const namespace of namespaces) {
        const head = `--${namespace}-`;
        if (!variable.startsWith(head)) continue;
        const tail = variable.slice(head.length);
        for (const prefix of UTILITY_PREFIXES[namespace]) {
          if (!utilities.has(prefix)) utilities.set(prefix, new Set());
          utilities.get(prefix).add(tail);
        }
        break;
      }
    }

    for (const match of css.matchAll(/@utility\s+([a-z][a-z0-9-]*)/g)) {
      customUtilities.add(match[1]);
    }
  }

  return { variables, utilities, customUtilities };
}

// ─────────────────────────────────────────────────────────────────────────────
// 테마 무결성 — 다중 테마가 조용히 부패하는 경로 3개를 막는다
// ─────────────────────────────────────────────────────────────────────────────

/** CSS 주석을 제거한다 — 블록 파싱이 주석 속 `}` 나 예시 선언에 속지 않게. */
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** 블록 본문에서 커스텀 프로퍼티 이름 집합을 뽑는다. */
function customPropsIn(block) {
  const names = new Set();
  for (const match of block.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)) names.add(match[1]);
  return names;
}

/**
 * default.css 의 팔레트 기준 키 = plain `:root` 블록의 `--dl-*` 중 z-index 제외.
 * (`@theme static` 의 Tier 2 는 소스에서 :root 블록이 아니므로 섞이지 않는다.)
 */
function collectPaletteKeys(defaultCss) {
  const keys = new Set();
  for (const match of stripCssComments(defaultCss).matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const name of customPropsIn(match[1])) {
      if (name.startsWith('--dl-') && !name.startsWith('--dl-z-')) keys.add(name);
    }
  }
  return keys;
}

/**
 * 테마 무결성 검사 3종. 위반 메시지 배열을 돌려준다(비면 통과).
 *
 *   1. 팔레트 패리티 — 각 테마 파일의 `:root[data-theme]` 키 집합이 기준과 **정확히**
 *      일치해야 한다. 키 하나가 빠지면 그 토큰만 default 값으로 새는 조용한 부패가
 *      되는데, base :root 폴백 탓에 화면(tokens 문서 포함)으로는 드러나지 않는다 —
 *      이 검사가 유일한 방어선이다.
 *   2. `@theme static` 회귀 — `inline` 으로 바뀌면 유틸리티가 값을 박아 출력해
 *      런타임 테마 전환·useTokenPx·앱 오버라이드가 전멸하는데, 변수 자체는 남아
 *      있어 어떤 기존 검사로도 잡히지 않는다.
 *   3. 테마 오버라이드 파일 문법 — `@theme` 은 :root 로 병합되어 스코프를 오염시키고,
 *      `@import` 는 tailwindcss 전체를 중복시킨다. 둘 다 테마 파일에서 금지.
 */
function checkThemeIntegrity(defaultCss, themeFiles) {
  const problems = [];

  if (!/@theme\s+static\s*\{/.test(defaultCss)) {
    problems.push(
      'default.css 에 `@theme static` 블록이 없습니다 — 미사용 토큰이 출력에서 떨어져 useTokenPx·런타임 주입이 조용히 깨집니다.',
    );
  }
  if (/@theme\s+inline/.test(defaultCss)) {
    problems.push(
      'default.css 가 `@theme inline` 을 씁니다 — 유틸리티에 값이 박혀 런타임 테마 전환·앱 오버라이드가 전멸합니다. `@theme static` 으로 되돌리세요.',
    );
  }

  const baseKeys = collectPaletteKeys(defaultCss);
  if (baseKeys.size === 0) {
    problems.push(
      'default.css 의 :root 팔레트 키를 찾지 못했습니다 — 파서 또는 파일 구조를 확인하세요.',
    );
    return problems;
  }

  for (const [fileName, rawCss] of themeFiles) {
    const css = stripCssComments(rawCss);

    if (/@import\b/.test(css)) {
      problems.push(
        `${fileName}: 테마 파일에 @import 금지 — tailwindcss 는 default.css 가 이미 물고 있습니다.`,
      );
    }
    if (/@theme\b/.test(css)) {
      problems.push(
        `${fileName}: 테마 파일에 @theme 금지 — :root 로 병합되어 data-theme 스코프가 성립하지 않습니다.`,
      );
    }

    const blocks = [
      ...css.matchAll(/:root\[data-theme=(?:'[a-z][a-z0-9-]*'|"[a-z][a-z0-9-]*")\]\s*\{([^}]*)\}/g),
    ];
    if (blocks.length === 0) {
      problems.push(
        `${fileName}: \`:root[data-theme='<name>']\` 블록이 없습니다 — 테마 파일 형식을 확인하세요.`,
      );
      continue;
    }

    const themeKeys = new Set();
    for (const block of blocks) for (const name of customPropsIn(block[1])) themeKeys.add(name);

    const missing = [...baseKeys].filter((key) => !themeKeys.has(key)).sort();
    const extra = [...themeKeys].filter((key) => !baseKeys.has(key)).sort();
    if (missing.length > 0) {
      problems.push(
        `${fileName}: 팔레트 키 누락 ${missing.length}개 — ${missing.join(', ')} (default 값으로 새는 조용한 부패)`,
      );
    }
    if (extra.length > 0) {
      problems.push(
        `${fileName}: 기준에 없는 키 ${extra.length}개 — ${extra.join(', ')} (default.css 팔레트에 먼저 추가하세요)`,
      );
    }
  }

  return problems;
}

/** 패리티 파서 자기검증 — 검사기가 조용히 죽는 것이 위반보다 위험하다(SELF_TEST 철학). */
function runThemeSelfTest() {
  const failures = [];
  const base =
    ':root { --dl-a: #111; --dl-b: #222; --dl-z-x: 1; }\n@theme static { --color-dl-a: var(--dl-a); }';
  const good = ":root[data-theme='t'] { --dl-a: #333; --dl-b: #444; }";
  const missing = ":root[data-theme='t'] { --dl-a: #333; }";
  const extra = ":root[data-theme='t'] { --dl-a: #333; --dl-b: #444; --dl-c: #555; }";

  if (checkThemeIntegrity(base, [['good.css', good]]).length !== 0) {
    failures.push('테마 패리티: 정상 케이스가 통과해야 하는데 위반이 나왔습니다');
  }
  if (!checkThemeIntegrity(base, [['missing.css', missing]]).some((p) => p.includes('누락'))) {
    failures.push('테마 패리티: 키 누락을 검출하지 못했습니다');
  }
  if (!checkThemeIntegrity(base, [['extra.css', extra]]).some((p) => p.includes('기준에 없는'))) {
    failures.push('테마 패리티: 초과 키를 검출하지 못했습니다');
  }
  return failures;
}

// ─────────────────────────────────────────────────────────────────────────────
// 색 대비 (WCAG)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 위 검사들은 전부 **이름**만 본다 — 키가 다 있는지, 오타가 없는지. 값이 틀린 것은
 * 아무도 잡지 못했다. 실제로 배포 테마의 Primary 버튼 라벨이 2.35:1(WCAG AA 4.5:1
 * 미달)로 오래 서 있었고, 드러난 계기는 사람이 "글자가 잘 안 보인다"고 말한 것이었다.
 *
 * 브라우저가 필요 없다 — 우리 구조가 정확히 2티어라 `var()` 를 한 홉만 따라가면
 * 테마별 최종 hex 가 나온다. 그래서 이 검사는 CSS 소스만으로 성립한다.
 */

const AA_TEXT = 4.5; // WCAG 1.4.3 본문
const AA_UI = 3.0; // WCAG 1.4.11 비텍스트(컨트롤 형태)

/**
 * 검사 쌍: [전경, 배경, 목표, 설명, 기준선?]
 *
 * 기준선이 **없으면** 목표 미달 = 위반(CI 차단).
 * 기준선이 **있으면** 목표 미달은 경고로 두되 **기준선보다 나빠지면 위반**이다 —
 * 아직 못 고친 것을 목록에서 지우면 침묵이 되고, 전부 차단하면 아무도 검사를
 * 못 켠다. 래칫은 "고칠 때까지 더 나빠지지만 않게" 잠그는 절충이고, 고치고 나면
 * 기준선을 지운다.
 *
 * 전 조합(70×70)을 자동 생성하지 않는다 — 화면에 실제로 겹치는 쌍만 사람이 적는다.
 */
const CONTRAST_PAIRS = [
  // 브랜드 채움 위 글자 — QA 정본이 `.btn-primary { color: white }` 라 흰 글자가 계약이다.
  // oms(teal)는 채움이 밝아 AA 에 못 미치는데, 고치려면 **채움 hex** 를 어둡게 해야 하고
  // 그건 디자인 원본의 결정이라 여기서 조용히 바꿀 수 없다. 기준선으로 잠가 악화만 막는다.
  // default(violet)는 같은 흰 글자로 5.47 이라 통과한다 — 기준선은 미달 테마에만 적용된다.
  ['--color-dl-primary-fg', '--color-dl-primary', AA_TEXT, 'Primary 버튼 라벨', 2.35],
  [
    '--color-dl-primary-fg',
    '--color-dl-primary-hover',
    AA_TEXT,
    '버튼 hover — 전 variant 공통',
    3.0,
  ],
  [
    '--color-dl-primary-fg',
    '--color-dl-primary-active',
    AA_TEXT,
    '버튼 active — 전 variant 공통',
    3.59,
  ],
  // 밝은 표면 위 브랜드색 글자
  ['--color-dl-primary-ink', '--color-dl-surface', AA_TEXT, 'outline-primary 라벨·활성 탭·Total'],
  ['--color-dl-primary-ink', '--color-dl-tonal', AA_TEXT, '톤얼 배경 위 브랜드 글자'],
  ['--color-dl-tonal-fg', '--color-dl-tonal', AA_TEXT, 'Badge primary'],
  ['--color-dl-tonal-fg', '--color-dl-tonal-hover', AA_TEXT, '활성 페이지·서브탭 배경 위 글자'],
  // 의미색 배지 — 글자는 ink, 면은 500
  ['--color-dl-success-ink', '--color-dl-success-bg', AA_TEXT, 'Badge success'],
  ['--color-dl-warning-ink', '--color-dl-warning-bg', AA_TEXT, 'Badge warning'],
  ['--color-dl-danger-ink', '--color-dl-danger-bg', AA_TEXT, 'Badge danger'],
  ['--color-dl-danger-fg', '--color-dl-danger-hover', AA_TEXT, '삭제 버튼 hover 채움'],
  ['--color-dl-locked-ink', '--color-dl-locked-bg', AA_TEXT, 'Badge neutral'],
  // 본문·필드
  ['--color-dl-fg', '--color-dl-surface', AA_TEXT, '본문'],
  ['--color-dl-fg', '--color-dl-canvas', AA_TEXT, '캔버스 위 본문'],
  ['--color-dl-fg-muted', '--color-dl-surface', AA_TEXT, '보조 글자'],
  ['--color-dl-fg-label', '--color-dl-surface', AA_TEXT, '폼 라벨'],
  ['--color-dl-field-fg', '--color-dl-surface', AA_TEXT, '입력값'],
  // 버튼 아웃라인 4종
  ['--color-dl-outline-fg', '--color-dl-surface', AA_TEXT, 'outline-gray 라벨'],
  ['--color-dl-outline-strong-fg', '--color-dl-surface', AA_TEXT, 'outline-strong 라벨'],
  // 그리드·탭·툴팁·사이드바
  ['--color-dl-grid-header-fg', '--color-dl-grid-header', AA_TEXT, '그리드 헤더 셀'],
  ['--color-dl-grid-link', '--color-dl-surface', AA_TEXT, '그리드 링크'],
  ['--color-dl-tooltip-fg', '--color-dl-tooltip', AA_TEXT, '툴팁'],
  ['--color-dl-subtab-fg', '--color-dl-subtab', AA_TEXT, '비활성 작업 탭'],
  ['--color-dl-subtab-active-fg', '--color-dl-subtab-active', AA_TEXT, '활성 작업 탭'],
  ['--color-dl-nav-fg', '--color-dl-surface', AA_TEXT, '사이드바 메뉴'],

  // ── 아직 못 고친 것들 — 오늘 값을 기준선으로 잠근다 ──────────────────────────
  // 파괴적 액션과 폼 오류의 빨강은 QA 정본(#ff4263) 이라 값을 못 바꾼다.
  // 배지·문구는 ink 로 갈라냈지만 보더·라벨의 원색 사용은 남아 있다.
  ['--color-dl-danger', '--color-dl-surface', AA_TEXT, 'outline-red 라벨', 3.38],
  ['--color-dl-error', '--color-dl-surface', AA_TEXT, '폼 오류 문구', 3.38],
  // 플레이스홀더는 1.4.3 의 disabled 예외가 아니다. 잠금 글자는 예외에 걸치지만
  // "자동입력·읽기전용" 칸에도 쓰이므로 같이 잠가 둔다.
  ['--color-dl-field-placeholder', '--color-dl-surface', AA_TEXT, '플레이스홀더', 3.15],
  ['--color-dl-locked-fg', '--color-dl-locked-bg', AA_TEXT, '잠긴 칸 값·비활성 버튼', 2.53],
  ['--color-dl-masked', '--color-dl-surface', AA_TEXT, '마스킹된 값', 3.15],
  ['--color-dl-fg-subtle', '--color-dl-surface', AA_TEXT, '흐린 보조 글자', 2.41],
];

/** 비텍스트 대비(1.4.11) — 글자가 아니라 **형태**가 보이는지. */
const CONTRAST_UI_PAIRS = [
  // 도형(mark)은 글자와 달리 미관을 택해 흰색 고정이다 — 이 컨트롤들의 상태는 **채움색
  // 전환**(흰색↔brand)이 말하므로, 1.4.11 판정은 아래 '선택·포커스 보더' 쌍에서 이미
  // 결정된다. 도형 자체의 대비는 그 판정을 바꾸지 않아 기준선으로만 잠근다.
  ['--color-dl-primary-mark', '--color-dl-primary', AA_UI, '체크 글리프·라디오 점·knob', 2.35],
  ['--color-dl-field-border', '--color-dl-surface', AA_UI, '입력 보더', 1.25],
  ['--color-dl-primary', '--color-dl-surface', AA_UI, '선택·포커스 보더', 2.35],
];

function parseHex(value) {
  const text = String(value).trim();
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(text)) return null;
  const hex =
    text.length === 4
      ? text
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : text.slice(1);
  return [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

function relativeLuminance(hex) {
  const channels = parseHex(hex).map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a, b) {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** `@theme static { … }` 본문을 중괄호 균형으로 잘라낸다(정규식 `[^}]*` 는 중첩에 깨진다). */
function themeStaticBody(css) {
  const start = css.search(/@theme\s+static\s*\{/);
  if (start === -1) return '';
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return '';
}

/** Tier 2 매핑: `--color-dl-x: var(--dl-y)` 또는 리터럴. */
function collectSemanticMap(defaultCss) {
  const map = new Map();
  const body = themeStaticBody(stripCssComments(defaultCss));
  for (const match of body.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    map.set(match[1], match[2].trim());
  }
  return map;
}

/** 테마별 Tier 1 팔레트 = default plain `:root` ⊕ `:root[data-theme]` 오버라이드. */
function paletteFor(defaultCss, themeCss) {
  const palette = new Map();
  const read = (block) => {
    for (const match of block.matchAll(/(--dl-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      palette.set(match[1], match[2].trim());
    }
  };
  for (const match of stripCssComments(defaultCss).matchAll(/:root\s*\{([^}]*)\}/g)) read(match[1]);
  if (themeCss) {
    for (const match of stripCssComments(themeCss).matchAll(
      /:root\[data-theme=(?:'[a-z][a-z0-9-]*'|"[a-z][a-z0-9-]*")\]\s*\{([^}]*)\}/g,
    )) {
      read(match[1]);
    }
  }
  return palette;
}

/**
 * Tier 2 토큰을 hex 로 푼다. `var()` 는 **한 홉만** 따라간다 — 우리 구조가 정확히
 * 2티어이기 때문이고, 그보다 깊어지면 그것 자체가 구조 위반이라 알려야 한다.
 * 해석 실패를 조용히 건너뛰지 않는 이유: 오타 하나로 검사 쌍이 통째로 사라지면
 * 검사가 있는데 아무것도 안 보는 상태가 된다(SELF_TEST 철학과 같다).
 */
function resolveColor(token, semantic, palette) {
  const raw = semantic.get(token);
  if (raw === undefined) return { error: `${token} 이 @theme static 에 없습니다` };
  const direct = parseHex(raw);
  if (direct) return { hex: raw };
  const varMatch = raw.match(/^var\((--[a-z0-9-]+)\)$/);
  if (!varMatch) return { error: `${token} 의 값(${raw})이 hex 도 단일 var() 도 아닙니다` };
  const resolved = palette.get(varMatch[1]);
  if (resolved === undefined) return { error: `${token} → ${varMatch[1]} 이 팔레트에 없습니다` };
  if (!parseHex(resolved)) {
    return { error: `${token} → ${varMatch[1]} 의 값(${resolved})이 hex 가 아닙니다` };
  }
  return { hex: resolved };
}

/** 대비 검사. { problems, warnings } 를 돌려준다. */
function checkContrast(defaultCss, themeFiles) {
  const problems = [];
  const warnings = [];
  const semantic = collectSemanticMap(defaultCss);
  const themes = [['default', null], ...themeFiles.map(([name, css]) => [name, css])];

  for (const [themeName, themeCss] of themes) {
    const palette = paletteFor(defaultCss, themeCss);
    for (const [pairs, kind] of [
      [CONTRAST_PAIRS, '텍스트'],
      [CONTRAST_UI_PAIRS, 'UI'],
    ]) {
      for (const [fgToken, bgToken, target, label, baseline] of pairs) {
        const fg = resolveColor(fgToken, semantic, palette);
        const bg = resolveColor(bgToken, semantic, palette);
        if (fg.error || bg.error) {
          problems.push(`${themeName}: ${fg.error ?? bg.error} (${label})`);
          continue;
        }
        const ratio = contrastRatio(fg.hex, bg.hex);
        const shown = `${ratio.toFixed(2)}:1`;
        const where = `${themeName} · ${label} (${fgToken} on ${bgToken}) ${shown}`;
        if (ratio >= target) continue;
        if (baseline === undefined) {
          problems.push(`${where} — ${kind} 대비 ${target}:1 미달`);
        } else if (ratio < baseline - 0.005) {
          problems.push(`${where} — 기준선 ${baseline}:1 보다 나빠졌습니다`);
        } else {
          // 같은 쌍이 테마마다 반복되면 21줄이 되고, 그러면 아무도 안 읽는다.
          // 값이 같은 테마는 한 줄로 묶는다(값이 갈리면 자연히 줄이 갈라진다).
          warnings.push({
            key: `${fgToken}|${bgToken}|${shown}`,
            theme: themeName,
            text: `${label} (${fgToken} on ${bgToken}) ${shown} — ${kind} 대비 ${target}:1 미달, 기준선 ${baseline}:1`,
          });
        }
      }
    }
  }
  return { problems, warnings };
}

/** 대비 검사 자기검증 — 공식·파서·래칫·해석실패 네 축. */
function runContrastSelfTest() {
  const failures = [];
  const near = (actual, expected) => Math.abs(actual - expected) <= 0.02;

  // ① 공식 자체. 손으로 검증한 실측치와 어긋나면 즉시 죽는다.
  if (!near(contrastRatio('#ffffff', '#000000'), 21))
    failures.push('대비 공식: 흰/검 21:1 이 아닙니다');
  if (!near(contrastRatio('#6c4de6', '#ffffff'), 5.47))
    failures.push('대비 공식: violet/흰 5.47:1 이 아닙니다');
  if (!near(contrastRatio('#00bad1', '#ffffff'), 2.35))
    failures.push('대비 공식: teal/흰 2.35:1 이 아닙니다');
  if (!near(contrastRatio('#fff', '#000'), 21))
    failures.push('대비 공식: 3자리 hex 를 못 읽습니다');

  // ② 파서 — var() 한 홉 + 테마 오버라이드 병합
  const base =
    ':root { --dl-a: #ffffff; --dl-b: #000000; }\n@theme static { --color-dl-x: var(--dl-a); --color-dl-y: var(--dl-b); }';
  const semantic = collectSemanticMap(base);
  const defPalette = paletteFor(base, null);
  const themePalette = paletteFor(base, ":root[data-theme='t'] { --dl-a: #777777; }");
  if (resolveColor('--color-dl-x', semantic, defPalette).hex !== '#ffffff') {
    failures.push('대비 파서: default 팔레트 해석 실패');
  }
  if (resolveColor('--color-dl-x', semantic, themePalette).hex !== '#777777') {
    failures.push('대비 파서: 테마 오버라이드가 반영되지 않습니다');
  }
  if (resolveColor('--color-dl-nope', semantic, defPalette).error === undefined) {
    failures.push('대비 파서: 미정의 토큰을 조용히 통과시켰습니다');
  }
  if (
    themeStaticBody('@theme static { a: 1; @media x { b: 2; } c: 3; }').includes('c: 3') === false
  ) {
    failures.push('대비 파서: @theme static 중첩 블록에서 본문이 잘렸습니다');
  }
  return failures;
}

/**
 * cn.ts 의 폰트 크기 목록 ↔ default.css 의 `--text-dl-*` 동일성.
 *
 * 목록에 없는 크기 토큰은 twMerge 가 **색으로 오인**해 같은 요소의 글자색을 지운다.
 * 화면에는 "글자가 검정으로 나온다"로만 보이고 유틸리티도 변수도 멀쩡해, 기존
 * 검사 중 어느 것도 잡지 못한다. 실제로 그렇게 새 나간 적이 있다.
 */
function checkFontSizeGroupParity(defaultCss, cnSource) {
  const declared = new Set(
    [...stripCssComments(defaultCss).matchAll(/--text-(dl-[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );
  const literal = cnSource.match(/DL_FONT_SIZE_TOKENS[^=]*=\s*\[([^\]]*)\]/);
  if (!literal) {
    return [
      'cn.ts 에서 DL_FONT_SIZE_TOKENS 배열을 찾지 못했습니다 — 이름을 바꿨다면 이 검사도 함께 고치세요.',
    ];
  }
  const listed = new Set([...literal[1].matchAll(/'(dl-[a-z0-9-]+)'/g)].map((m) => m[1]));
  const problems = [];
  const missing = [...declared].filter((k) => !listed.has(k)).sort();
  const extra = [...listed].filter((k) => !declared.has(k)).sort();
  if (missing.length > 0) {
    problems.push(
      `cn.ts DL_FONT_SIZE_TOKENS 누락 ${missing.length}개 — ${missing.join(', ')} (twMerge 가 색으로 오인해 글자색을 지웁니다)`,
    );
  }
  if (extra.length > 0) {
    problems.push(`cn.ts DL_FONT_SIZE_TOKENS 에 없는 토큰 ${extra.length}개 — ${extra.join(', ')}`);
  }
  return problems;
}

/** 폰트 크기 패리티 자기검증. */
function runFontSizeSelfTest() {
  const failures = [];
  const css = '@theme static { --text-dl-a: 12px; --text-dl-b: 14px; }';
  const good = "const DL_FONT_SIZE_TOKENS = ['dl-a', 'dl-b'] as const;";
  const missing = "const DL_FONT_SIZE_TOKENS = ['dl-a'] as const;";
  const extra = "const DL_FONT_SIZE_TOKENS = ['dl-a', 'dl-b', 'dl-c'] as const;";
  if (checkFontSizeGroupParity(css, good).length !== 0) {
    failures.push('폰트 크기 패리티: 정상 케이스가 통과해야 하는데 위반이 나왔습니다');
  }
  if (!checkFontSizeGroupParity(css, missing).some((p) => p.includes('누락'))) {
    failures.push('폰트 크기 패리티: 누락을 검출하지 못했습니다');
  }
  if (!checkFontSizeGroupParity(css, extra).some((p) => p.includes('없는 토큰'))) {
    failures.push('폰트 크기 패리티: 초과를 검출하지 못했습니다');
  }
  if (checkFontSizeGroupParity(css, 'const OTHER = [];').length === 0) {
    failures.push('폰트 크기 패리티: 배열을 못 찾았는데 통과시켰습니다');
  }
  return failures;
}

// ─────────────────────────────────────────────────────────────────────────────
// 소스 전처리
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 주석을 공백으로 바꾼다. 오프셋을 보존하므로 라인 번호가 어긋나지 않는다.
 *
 * 목적은 하나다 — 문자열 안의 `//`(URL 등)를 주석으로 오인하지 않는 것.
 * 정규식 리터럴은 인식하지 않는다. TS 정규식에 `//` 가 들어갈 일이 없어서다.
 */
function stripComments(source) {
  let out = '';
  let state = 'code';
  let i = 0;

  while (i < source.length) {
    const char = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (char === '/' && next === '/') {
        state = 'line';
        out += '  ';
        i += 2;
        continue;
      }
      if (char === '/' && next === '*') {
        state = 'block';
        out += '  ';
        i += 2;
        continue;
      }
      if (char === "'") state = 'single';
      else if (char === '"') state = 'double';
      else if (char === '`') state = 'template';
      out += char;
      i += 1;
      continue;
    }

    if (state === 'line') {
      if (char === '\n') {
        state = 'code';
        out += char;
      } else {
        out += ' ';
      }
      i += 1;
      continue;
    }

    if (state === 'block') {
      if (char === '*' && next === '/') {
        state = 'code';
        out += '  ';
        i += 2;
        continue;
      }
      out += char === '\n' ? '\n' : ' ';
      i += 1;
      continue;
    }

    // 문자열 3종
    if (char === '\\') {
      out += char;
      i += 1;
      if (i < source.length) {
        out += source[i];
        i += 1;
      }
      continue;
    }
    if (
      (state === 'single' && char === "'") ||
      (state === 'double' && char === '"') ||
      (state === 'template' && char === '`')
    ) {
      state = 'code';
    }
    out += char;
    i += 1;
  }

  return out;
}

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') line += 1;
  }
  return line;
}

/**
 * 인라인 예외 수집 — `// token-exempt: <사유>` 가 붙은 줄과 그 다음 줄을 면제한다.
 *
 * **파일 단위 제외를 두지 않는 이유**가 이 프로젝트에 실물로 있다: `scanRoots()` 가
 * apps/blog 를 통째로 제외해 두는 동안 팔레트 유출 255건이 아무도 모르게 쌓였다.
 * 예외는 사유와 함께 그 줄 옆에 남아야, 나중에 왜 허용됐는지 읽을 수 있고
 * 같은 파일의 새 유출은 계속 잡힌다.
 *
 * 정당한 예외는 셋뿐이다:
 *   1. dl 토큰이 도달하지 못하는 픽셀 — 새 창(window.open) · canvas · 외부 라이브러리 테마
 *   2. 기능이 색을 규정하는 곳 — 바코드 흑백(스캔 요건)
 *   3. 색 문자열이지만 지정이 아니라 판별인 곳 — 서드파티 산출물 감지 비교
 * 그 밖은 예외가 아니라 아직 안 고친 유출이다.
 */
function collectExemptions(raw) {
  const lines = raw.split('\n');
  const exempt = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    // `token-exempt: 사유` 는 그 줄과 다음 줄, `token-exempt(N): 사유` 는 다음 N줄까지.
    // 범위형이 필요한 이유는 템플릿 리터럴이다 — 리터럴 안에는 `//` 주석을 넣을 수 없어
    // 선언 앞에서 한 번에 덮는 수밖에 없다(mermaid 샘플 코드·팝업 HTML 문자열).
    const match = lines[i].match(/token-exempt(?:\((\d+)\))?:/);
    if (!match) continue;
    const span = match[1] ? Number(match[1]) : 1;
    exempt.add(i + 1);
    for (let k = 1; k <= span; k += 1) exempt.add(i + 1 + k);
  }
  return exempt;
}

// ─────────────────────────────────────────────────────────────────────────────
// 규칙
// ─────────────────────────────────────────────────────────────────────────────

const TAILWIND_PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

/** 색을 받는 유틸리티 접두사. `bg-black/40` 을 잡는 데 쓴다. */
const COLOR_PREFIX =
  'bg|text|border|ring|outline|fill|stroke|decoration|accent|caret|divide|placeholder|shadow|from|via|to';

/**
 * 정규식 하나짜리 규칙을 만든다.
 * `allow` 로 통과시킬 매치를 걸러낸다(예: `text-transparent`).
 */
function patternRule(id, pattern, message, allow) {
  return {
    id,
    message,
    scan(source) {
      const found = [];
      for (const match of source.matchAll(pattern)) {
        if (allow?.(match)) continue;
        found.push({ index: match.index ?? 0, text: match[0] });
      }
      return found;
    },
  };
}

function buildRules(tokens) {
  return [
    patternRule(
      'hex',
      // 3·4·6·8 자리만 — 5·7 자리는 색이 아니라서 `#tab` 류 앵커의 오탐을 줄인다
      /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
      'hex 리터럴 금지 — --dl-* 토큰을 쓰세요 (회사별 런타임 테마 주입이 불가능해집니다)',
      // HTML 수치 문자 참조(`&#039;` = 작은따옴표)는 색이 아니다 — 이스케이프 코드에서 나온다
      (match) => match.input?.[match.index - 1] === '&' && /^#\d+$/.test(match[0]),
    ),

    patternRule(
      'color-function',
      /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\s*\(/g,
      '색 함수 금지 — 색 값은 packages/ui/src/theme 안에만 존재합니다',
    ),

    patternRule(
      'tailwind-palette',
      new RegExp(`\\b(?:${COLOR_PREFIX})-(?:(?:${TAILWIND_PALETTE})-\\d{2,3}|black|white)\\b`, 'g'),
      'Tailwind 기본 팔레트 금지 — --dl-* 토큰을 쓰세요',
    ),

    patternRule(
      'font-weight',
      /\bfont-(?:thin|extralight|light|extrabold|black)\b/g,
      'QA 명세는 weight 400·500·600·700 만 씁니다 — font-normal / font-medium / font-semibold / font-bold 를 쓰세요',
    ),

    {
      id: 'unknown-utility-token',
      message: '정의되지 않은 dl-* 토큰 — Tailwind 는 이 클래스를 조용히 버립니다',
      scan(source) {
        const found = [];
        // 앞의 variant(`hover:`, `data-[state=open]:`)와 `!` 는 \b 로 자연히 끊긴다.
        for (const match of source.matchAll(
          /\b([a-z]+(?:-[a-z]+)*)-(dl-[a-z0-9]+(?:-[a-z0-9]+)*)\b/g,
        )) {
          const [, prefix, token] = match;
          const allowed = tokens.utilities.get(prefix);
          if (!allowed) continue; // 우리가 아는 유틸리티 접두사가 아니면 판단하지 않는다
          if (allowed.has(token)) continue;
          found.push({ index: match.index ?? 0, text: `${prefix}-${token}` });
        }
        return found;
      },
    },

    {
      id: 'unknown-css-variable',
      message:
        '정의되지 않은 CSS 변수 — 이름이 바뀌면 useTokenPx 가 조용히 fallback 으로 떨어집니다',
      scan(source) {
        const found = [];
        for (const match of source.matchAll(/--[a-z0-9-]*\bdl-[a-z0-9-]+/g)) {
          const variable = match[0];
          // 하이픈으로 끝나면 완전한 변수명이 아니라 **접두사**다
          // (`name.startsWith('--dl-z-')` 같은 판별 코드). 참조가 아니므로 검사 대상이 아니다.
          if (variable.endsWith('-')) continue;
          if (tokens.variables.has(variable)) continue;
          found.push({ index: match.index ?? 0, text: variable });
        }
        return found;
      },
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 자기검증 — 검사기가 죽어 있는 것이 위반보다 위험하다
// ─────────────────────────────────────────────────────────────────────────────

const SELF_TEST = [
  { rule: 'hex', code: 'const brand = "#2578E4";', hit: true },
  { rule: 'hex', code: 'const short = "#fff";', hit: true },
  { rule: 'hex', code: 'const anchor = "#top";', hit: false },
  { rule: 'hex', code: 'const url = "/orders#list";', hit: false },

  { rule: 'color-function', code: 'const dim = "rgba(0,0,0,.28)";', hit: true },
  { rule: 'color-function', code: 'const c = "oklch(0.55 0.18 250)";', hit: true },
  { rule: 'color-function', code: 'const fn = collect(rows);', hit: false },

  { rule: 'tailwind-palette', code: 'cn("fixed inset-0 bg-black/40")', hit: true },
  { rule: 'tailwind-palette', code: 'cn("text-gray-500")', hit: true },
  { rule: 'tailwind-palette', code: 'cn("border-transparent text-current")', hit: false },
  { rule: 'tailwind-palette', code: 'cn("bg-dl-primary text-dl-primary-fg")', hit: false },

  { rule: 'font-weight', code: 'cn("font-light")', hit: true },
  // QA 디자인(Pretendard 4종)부터 500 이 명세에 들어왔다 — medium 은 이제 허용이다
  { rule: 'font-weight', code: 'cn("font-medium")', hit: false },
  { rule: 'font-weight', code: 'cn("font-semibold")', hit: false },

  { rule: 'unknown-utility-token', code: 'cn("bg-dl-primry")', hit: true },
  { rule: 'unknown-utility-token', code: 'cn("bg-dl-primary")', hit: false },
  { rule: 'unknown-utility-token', code: 'cn("flex items-center gap-2")', hit: false },

  { rule: 'unknown-css-variable', code: 'useTokenPx("--spacing-dl-nope", 25)', hit: true },
  // 이름이 바뀐 토큰도 잡힌다 — `--spacing-dl-row` 는 P6 에서 `-grid-row` 로 옮겨 사라졌다
  { rule: 'unknown-css-variable', code: 'useTokenPx("--spacing-dl-row", 32)', hit: true },
  { rule: 'unknown-css-variable', code: 'useTokenPx("--spacing-dl-grid-row", 25)', hit: false },
  // 접두사 판별 문자열은 참조가 아니다 — 갤러리가 토큰을 그룹핑할 때 쓴다
  { rule: 'unknown-css-variable', code: 'if (name.startsWith("--dl-z-")) return "z";', hit: false },
  { rule: 'unknown-css-variable', code: 'name.startsWith("--color-dl-")', hit: false },

  // 주석 제거가 동작하지 않으면 아래가 위반으로 잡힌다
  { rule: 'hex', code: '// 목업 원본은 #2578E4 였다\nconst x = 1;', hit: false, raw: true },
  { rule: 'hex', code: '/* Primary #2578E4 */\nconst x = 1;', hit: false, raw: true },
  // 반대로 문자열 안의 `//` 를 주석으로 오인하면 아래가 놓쳐진다
  { rule: 'hex', code: 'const u = "https://x.dev"; const c = "#E5484D";', hit: true, raw: true },
];

function runSelfTest(rules) {
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  const failures = [];

  for (const testCase of SELF_TEST) {
    const rule = byId.get(testCase.rule);
    if (!rule) {
      failures.push(`알 수 없는 규칙 id: ${testCase.rule}`);
      continue;
    }
    const source = stripComments(testCase.code);
    const hit = rule.scan(source).length > 0;
    if (hit !== testCase.hit) {
      failures.push(
        `[${testCase.rule}] ${testCase.hit ? '잡아야 하는데 놓쳤습니다' : '잡으면 안 되는데 잡았습니다'}: ${JSON.stringify(testCase.code)}`,
      );
    }
  }

  return failures;
}

// ─────────────────────────────────────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────────────────────────────────────

function collectFiles(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectFiles(path, out);
      continue;
    }
    if (!SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext))) continue;
    if (/\.(test|spec)\.[cm]?tsx?$/.test(entry)) continue;
    out.push(path);
  }
  return out;
}

function scanRoots() {
  // 앱도 전부 스캔한다. apps/blog 는 Gate 3(UI 빅뱅 전환) 동안 구 shadcn 토큰 체계라
  // 한시적으로 제외돼 있었고, 그 사이 팔레트 유출 255건이 무검사로 쌓였다 —
  // 전환을 마치며 제외를 걷어냈다. 다시 제외하지 말 것.
  const roots = [join(ROOT, 'packages/ui/src')];
  const appsDir = join(ROOT, 'apps');
  for (const app of readdirSync(appsDir)) {
    roots.push(join(appsDir, app, 'src'));
  }
  return roots;
}

function main() {
  const tokens = collectTokens();
  const rules = buildRules(tokens);

  const selfTestFailures = [
    ...runSelfTest(rules),
    ...runThemeSelfTest(),
    ...runContrastSelfTest(),
    ...runFontSizeSelfTest(),
  ];
  if (selfTestFailures.length > 0) {
    console.error('토큰 검사기 자기검증 실패 — 정규식이 의도대로 동작하지 않습니다:');
    for (const failure of selfTestFailures) console.error(`  ✗ ${failure}`);
    process.exit(1);
  }

  // 테마 무결성 — default.css 가 기준, 나머지 테마 파일이 검사 대상이다.
  const defaultCss = readFileSync(join(THEME_DIR, 'default.css'), 'utf8');
  const themeFiles = readdirSync(THEME_DIR)
    .filter((name) => name.endsWith('.css') && name !== 'default.css' && name !== 'utilities.css')
    .map((name) => [name, readFileSync(join(THEME_DIR, name), 'utf8')]);
  const { problems: contrastProblems, warnings } = checkContrast(defaultCss, themeFiles);
  const themeProblems = [
    ...checkThemeIntegrity(defaultCss, themeFiles),
    ...checkFontSizeGroupParity(defaultCss, readFileSync(CN_PATH, 'utf8')),
    ...contrastProblems,
  ];
  // 경고는 막지 않는다 — 기준선을 지키고 있는 항목이라 "아직 남은 빚"의 목록이다.
  if (warnings.length > 0) {
    const grouped = new Map();
    for (const warning of warnings) {
      const entry = grouped.get(warning.key) ?? { text: warning.text, themes: [] };
      entry.themes.push(warning.theme);
      grouped.set(warning.key, entry);
    }
    console.warn(
      `\n대비 경고 ${grouped.size}건 (기준선 유지 — 고치면 목록에서 기준선을 지웁니다):\n`,
    );
    for (const { text, themes } of grouped.values()) {
      console.warn(`  ! ${text}  [${themes.join(', ')}]`);
    }
    console.warn('');
  }
  if (themeProblems.length > 0) {
    console.error(`\n테마 무결성 위반 ${themeProblems.length}건:\n`);
    for (const problem of themeProblems) console.error(`  ✗ ${problem}`);
    console.error('');
    process.exit(1);
  }

  const files = [];
  for (const root of scanRoots()) collectFiles(root, files);

  const violations = [];
  for (const path of files) {
    // 토큰 원본은 예외다 — 색 값이 존재해도 되는 유일한 곳이 theme/** 이다
    if (path.includes(`${join('ui', 'src', 'theme')}`)) continue;

    const raw = readFileSync(path, 'utf8');
    const source = stripComments(raw);
    const exemptLines = collectExemptions(raw);

    for (const rule of rules) {
      for (const finding of rule.scan(source)) {
        const line = lineOf(source, finding.index);
        // 예외는 사유와 함께 코드 옆에 남는다 — 파일 통째 제외는 사유가 사라져 금지다
        if (exemptLines.has(line)) continue;
        violations.push({
          file: relative(ROOT, path),
          line,
          text: finding.text,
          message: rule.message,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\n디자인 토큰 위반 ${violations.length}건:\n`);
    for (const violation of violations) {
      console.error(`  ✗ ${violation.file}:${violation.line}  ${violation.text}`);
      console.error(`    ${violation.message}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log(
    `디자인 토큰 규칙 ${rules.length}종 · 파일 ${files.length}개 · 토큰 ${tokens.variables.size}개 · ` +
      `대비 쌍 ${CONTRAST_PAIRS.length + CONTRAST_UI_PAIRS.length}종 × 테마 ${themeFiles.length + 1} — 위반 없습니다.`,
  );
}

main();
