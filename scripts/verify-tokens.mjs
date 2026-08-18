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
  const roots = [join(ROOT, 'packages/ui/src')];
  // Gate 3(UI 빅뱅 전환) 완료 전까지 apps/blog 는 구 shadcn 토큰 체계라 스캔에서 제외한다.
  // 전환 완료 시 아래 앱 스캔을 복원할 것 (ui-docs 는 데모 특성상 원본 deleo 도 앱 스캔 대상).
  const appsDir = join(ROOT, 'apps');
  for (const app of readdirSync(appsDir)) {
    if (app === 'blog') continue; // TODO(Gate 3): 제외 해제
    roots.push(join(appsDir, app, 'src'));
  }
  return roots;
}

function main() {
  const tokens = collectTokens();
  const rules = buildRules(tokens);

  const selfTestFailures = [...runSelfTest(rules), ...runThemeSelfTest()];
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
  const themeProblems = checkThemeIntegrity(defaultCss, themeFiles);
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

    for (const rule of rules) {
      for (const finding of rule.scan(source)) {
        violations.push({
          file: relative(ROOT, path),
          line: lineOf(source, finding.index),
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
    `디자인 토큰 규칙 ${rules.length}종 · 파일 ${files.length}개 · 토큰 ${tokens.variables.size}개 — 위반 없습니다.`,
  );
}

main();
