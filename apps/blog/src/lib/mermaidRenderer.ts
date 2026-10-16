import type { Mermaid } from 'mermaid';
import { MERMAID_FONT_FAMILY } from './mermaidBlock';

/** mermaid 내장 테마 — 사이트 라이트/다크에 대응한다. /util/mermaid 와 같은 선택이다. */
export type MermaidTheme = 'default' | 'dark';

let mermaidPromise: Promise<Mermaid> | null = null;
let fontsPromise: Promise<void> | null = null;
let renderQueue: Promise<unknown> = Promise.resolve();
let diagramSeq = 0;

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

/** next-themes 의 resolvedTheme('light' | 'dark') 을 mermaid 테마 이름으로 옮긴다. */
export function toMermaidTheme(resolvedTheme: string): MermaidTheme {
  return resolvedTheme === 'dark' ? 'dark' : 'default';
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
      theme,
      fontFamily: MERMAID_FONT_FAMILY,
    });
    try {
      const { svg } = await mermaid.render(id, source);
      return svg;
    } finally {
      // 렌더 도중 예외가 나면 측정용 임시 컨테이너(#d{id})가 남을 수 있다
      document.getElementById(`d${id}`)?.remove();
    }
  });
  renderQueue = task.catch(() => undefined);
  return task;
}
