/**
 * 플레이그라운드 코드 스니펫 조립 — **문자열 규칙**이지 UI 가 아니다.
 *
 * `playground.tsx` 안에 두지 않는 이유가 이것이다. 규칙이 틀리면 모든 Code 탭이 조용히
 * 거짓말을 하는데, 여기 있으면 vitest 로 규칙을 고정할 수 있다(`code-snippet.test.ts`).
 * 검사기를 먼저 세우는 것은 `scripts/verify-tokens.mjs` 의 SELF_TEST 와 같은 정신이다.
 *
 * ── 어디까지 하고 어디부터 안 하는가 ────────────────────────────────────────
 * 데모 파일은 `readDemoSource()` 가 **원문 그대로** 읽어 Code 탭에 내린다. 반면 이 헬퍼의
 * 원문은 화면에 나오지 않는다. 그 비대칭이 설계 기준이다 — 여기는 촘촘해도 되지만
 * **호출부는 그 자체로 읽혀야 한다**.
 *
 * 그래서 `jsxTag` 의 props 객체는 바로 아래 실제 JSX 의 **거울**이다(키 순서까지 같게 쓴다).
 * 독자가 배워야 하는 규칙은 둘뿐이다 — "false·undefined 는 사라진다", "`expr()` 은 중괄호".
 * 컴포넌트 타입에서 prop 을 추론하거나 상태 객체를 통째로 받는 쪽으로 한 걸음이라도 가면
 * 그게 곧 스키마이고, 데모는 `<Button {...values} />` 가 되어 실제 사용법을 감추게 된다.
 */

/** 문자열이 아니라 **표현식**으로 찍는다 — `icon={Save}` 처럼 중괄호가 필요한 자리. */
export type JsxExpr = { readonly expr: string };

export function expr(source: string): JsxExpr {
  return { expr: source };
}

export type JsxValue = string | number | boolean | null | undefined | JsxExpr;

/**
 * 한 줄이 이보다 길어지면 prop 당 한 줄로 편다.
 * Code 탭의 `<pre>` 는 가로 스크롤이라 넘친 줄은 **실제로 읽히지 않는다** —
 * 카드 안쪽 폭에서 눈으로 잡히는 한계가 이 근처다.
 */
const WRAP_AT = 72;

function isExpr(value: JsxValue): value is JsxExpr {
  return typeof value === 'object' && value !== null && 'expr' in value;
}

/**
 * prop 하나를 문자열로. 값이 사라지는 경우(`undefined`·`null`·`false`)는 null 을 돌려
 * 호출자가 통째로 걸러내게 한다 — 데모가 `size !== 'md' ? size : undefined` 로
 * "기본값은 코드에 안 적는다"를 표현할 수 있는 근거다.
 */
function renderProp(name: string, value: JsxValue): string | null {
  if (value === undefined || value === null || value === false) return null;
  // JSX 축약형이 실제 사용례다 — `busy={true}` 라고 쓰는 코드는 없다.
  if (value === true) return name;
  if (isExpr(value)) return `${name}={${value.expr}}`;
  if (typeof value === 'number') return `${name}={${value}}`;
  // 큰따옴표가 값에 들어 있으면 이스케이프 대신 표현식으로 넘어간다.
  return value.includes('"') ? `${name}={'${value}'}` : `${name}="${value}"`;
}

/**
 * JSX 한 조각을 만든다. props 는 **아래 실제 JSX 와 같은 순서**로 적어야
 * 둘을 나란히 놓고 눈으로 대조할 수 있다 — 이 헬퍼가 주는 안전장치는 그 대조 가능성뿐이다.
 */
export function jsxTag(
  name: string,
  props: Readonly<Record<string, JsxValue>>,
  children?: string,
): string {
  const parts = Object.entries(props)
    .map(([key, value]) => renderProp(key, value))
    .filter((part): part is string => part !== null);

  const tail = children === undefined ? ' />' : `>${children}</${name}>`;
  const oneLine = `<${name}${parts.length > 0 ? ` ${parts.join(' ')}` : ''}${tail}`;
  if (oneLine.length <= WRAP_AT) return oneLine;

  const body = parts.map((part) => `  ${part}`).join('\n');
  return children === undefined
    ? `<${name}\n${body}\n/>`
    : `<${name}\n${body}\n>${children}</${name}>`;
}
