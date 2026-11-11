import type { Mermaid } from 'mermaid';
import { MERMAID_FONT_FAMILY } from './mermaidBlock';
import { type MermaidTheme, mermaidThemeOptions } from './mermaidTheme';

// 테마 정의는 mermaidTheme.ts 가 소유한다 — /util/mermaid 에디터와 같은 설정을 쓰도록 거기서 가져온다.
export { type MermaidTheme, toMermaidTheme } from './mermaidTheme';

let mermaidPromise: Promise<Mermaid> | null = null;
let fontsPromise: Promise<void> | null = null;
let renderQueue: Promise<unknown> = Promise.resolve();
let diagramSeq = 0;
const jsonGuardCounts = new WeakMap<object, number>();

/**
 * task 가 도는 동안 target 이 JSON 직렬화에서 빠지도록 임시 toJSON 을 단다(직렬화 결과는 null 이 된다).
 * 겹쳐 호출되면 마지막 task 가 끝날 때까지 유지하고, task 가 실패해도 반드시 걷어낸다.
 * 열거되지 않는 속성이라 target 을 순회하는 코드에는 보이지 않는다.
 */
export async function withJsonGuard<T>(target: object, task: () => Promise<T>): Promise<T> {
  const active = jsonGuardCounts.get(target) ?? 0;
  if (active === 0) {
    Object.defineProperty(target, 'toJSON', { value: () => undefined, configurable: true });
  }
  jsonGuardCounts.set(target, active + 1);
  try {
    return await task();
  } finally {
    const remaining = (jsonGuardCounts.get(target) ?? 1) - 1;
    if (remaining === 0) {
      jsonGuardCounts.delete(target);
      Reflect.deleteProperty(target, 'toJSON');
    } else {
      jsonGuardCounts.set(target, remaining);
    }
  }
}

/**
 * mermaid 렌더를 <html> 직렬화 가드 안에서 실행한다. 본문 렌더와 /util/mermaid 에디터가 함께 쓴다.
 *
 * block 다이어그램 레이아웃은 디버그 로그 문자열을 만들며 d3 selection 을 JSON.stringify 한다
 * (로그가 꺼져 있어도 인자는 먼저 평가된다). selection 은 부모로 <html> 을 들고 있고, App Router 에서는
 * React 가 <html> 에 순환 참조(fiber)를 달아 두어 "Converting circular structure to JSON" 으로 렌더가 죽는다.
 *
 * TODO(mermaid-js/mermaid#5530): mermaid 상류의 버그를 앱에서 우회하는 임시 코드다. 상류에서 고쳐진
 * 버전으로 올리면 제거한다.
 * - 상류 수정 PR 은 mermaid-js/mermaid#8063 이고, mermaid 12.3.0 에는 아직 들어 있지 않다(2026-11 확인).
 * - 제거 대상: withJsonGuard, withMermaidRenderGuard, 호출부 두 곳(이 파일의 renderMermaid 와
 *   /util/mermaid 의 renderDiagram), mermaidRenderer.test.ts.
 * - 고쳐졌는지는 mermaidRenderer.test.ts 의 감시 테스트가 알려 준다 — mermaid 를 올린 뒤 그 테스트가
 *   실패하면, 가드를 뺀 채 /util/mermaid 의 Block 샘플이 렌더되는지 확인하고 지운다.
 */
export function withMermaidRenderGuard<T>(task: () => Promise<T>): Promise<T> {
  return withJsonGuard(document.documentElement, task);
}

/**
 * mermaid 를 처음 필요할 때 한 번만 불러온다. 다이어그램이 없는 글에서는 이 함수가 호출되지 않아
 * 청크 요청 자체가 없다. 로드 실패는 캐시하지 않는다 — 일시적 네트워크 오류 뒤 재시도할 수 있게.
 */
function loadMermaid(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid')
      .then((module) => module.default)
      .catch((error: unknown) => {
        mermaidPromise = null;
        throw error;
      });
  }
  return mermaidPromise;
}

/**
 * 라벨 폭 측정 전에 웹폰트를 확실히 받아 둔다.
 * document.fonts.ready 는 페이지가 아직 쓰지 않은 face 를 기다리지 않으므로, 한글 face(D2Coding)는
 * 한글 글자로 명시 로드해야 한다. 늦게 도착한 폰트로 바뀌면 측정 폭과 실제 폭이 어긋나 라벨이 잘린다.
 */
function waitForFonts(): Promise<void> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      document.fonts.load('16px "JetBrains Mono"'),
      document.fonts.load('16px "D2Coding"', '가'),
    ]).then(
      () => undefined,
      () => undefined,
    );
  }
  return fontsPromise;
}

/**
 * 렌더된 SVG 의 원래 크기. mermaid 는 width="100%" + max-width 로 내보내 화면 폭이 원래 크기를
 * 가리므로, 화면과 무관한 viewBox 를 기준으로 삼는다(없으면 현재 박스로 대신한다).
 */
export function svgNaturalSize(svg: SVGSVGElement): { width: number; height: number } {
  const box = svg.viewBox?.baseVal;
  if (box && box.width > 0 && box.height > 0) {
    return { width: box.width, height: box.height };
  }
  const rect = svg.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/** SVG id 는 CSS 스코프(#id)와 화살표 marker 참조에 쓰여 페이지 안에서 겹치면 안 된다. */
export function nextDiagramId(): string {
  diagramSeq += 1;
  return `mermaid-diagram-${diagramSeq}`;
}

/**
 * 소스를 SVG 문자열로 렌더한다. 실패하면 mermaid 의 오류를 그대로 던진다.
 *
 * - securityLevel 'strict': 라벨 HTML 을 DOMPurify 로 정화하고 click 콜백 등 스크립트 실행을 막는다.
 *   글 본문은 작성자가 넣었더라도 방문자 브라우저에서 실행되므로 /util/mermaid(본인 입력, loose)와 다르게 둔다.
 * - suppressErrorRendering: 문법 오류 시 mermaid 가 body 에 오류 SVG 를 남기지 않고 정리한 뒤 던진다.
 * - mermaid 설정은 전역 싱글톤이라 initialize→render 를 직렬 큐로 묶어 테마가 섞이지 않게 한다.
 */
export function renderMermaid(id: string, source: string, theme: MermaidTheme): Promise<string> {
  const task = renderQueue.then(async () => {
    const [mermaid] = await Promise.all([loadMermaid(), waitForFonts()]);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      ...mermaidThemeOptions(theme),
      fontFamily: MERMAID_FONT_FAMILY,
    });
    try {
      const { svg } = await withMermaidRenderGuard(() => mermaid.render(id, source));
      return svg;
    } finally {
      // 렌더 도중 예외가 나면 측정용 임시 컨테이너(#d{id})가 남을 수 있다
      document.getElementById(`d${id}`)?.remove();
    }
  });
  renderQueue = task.catch(() => undefined);
  return task;
}
