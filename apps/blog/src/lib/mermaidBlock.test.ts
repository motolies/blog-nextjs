import { describe, expect, it } from 'vitest';
import {
  buildMermaidEditorHash,
  MIN_READABLE_SCALE,
  normalizeCodeBlockClasses,
  parseMermaidEditorHash,
  pickFitMode,
  pickViewerZoom,
} from './mermaidBlock';

const LANGUAGES = ['plaintext', 'javascript', 'shell', 'mermaid'] as const;

describe('pickFitMode', () => {
  it('본문이 다이어그램보다 넓으면 fit — 원래 크기 이상으로 키우지 않는 건 SVG max-width 몫이다', () => {
    expect(pickFitMode(700, 500)).toEqual({ mode: 'fit' });
  });

  it('최소 배율 경계(정확히 0.7배)까지는 fit 으로 줄인다', () => {
    expect(pickFitMode(700, 1000)).toEqual({ mode: 'fit' });
  });

  it('0.7배보다 더 줄여야 하면 scroll — 폭은 원래 폭 × 최소 배율', () => {
    expect(pickFitMode(340, 1200)).toEqual({
      mode: 'scroll',
      width: Math.round(1200 * MIN_READABLE_SCALE),
    });
  });

  it('측정 전(0)이나 비정상 값은 fit 으로 둔다', () => {
    expect(pickFitMode(0, 500)).toEqual({ mode: 'fit' });
    expect(pickFitMode(500, 0)).toEqual({ mode: 'fit' });
    expect(pickFitMode(Number.NaN, 500)).toEqual({ mode: 'fit' });
    expect(pickFitMode(500, Number.POSITIVE_INFINITY)).toEqual({ mode: 'fit' });
  });
});

describe('pickViewerZoom', () => {
  it('맞춤으로도 읽을 수 있으면 fit', () => {
    expect(pickViewerZoom(1200, 800, 900, 400)).toBe('fit');
  });

  it('세로 모바일의 넓은 다이어그램처럼 맞춤이 최소 배율 아래면 actual', () => {
    expect(pickViewerZoom(335, 633, 1493, 200)).toBe('actual');
  });

  it('세로로 긴 다이어그램도 높이 기준으로 판정한다', () => {
    expect(pickViewerZoom(1200, 600, 400, 2000)).toBe('actual');
  });

  it('측정값이 없으면 fit', () => {
    expect(pickViewerZoom(0, 600, 400, 300)).toBe('fit');
    expect(pickViewerZoom(600, 600, Number.NaN, 300)).toBe('fit');
  });
});

describe('normalizeCodeBlockClasses', () => {
  it('plaintext + 등록 언어 이중 클래스를 단일 클래스로 정리한다', () => {
    const html = '<pre><code class="language-plaintext language-mermaid">flowchart TD</code></pre>';
    expect(normalizeCodeBlockClasses(html, LANGUAGES)).toBe(
      '<pre><code class="language-mermaid">flowchart TD</code></pre>',
    );
  });

  it('등록되지 않은 언어와의 조합은 그대로 둔다 — plaintext 를 지우면 에디터가 언어를 잃는다', () => {
    const html = '<pre><code class="language-plaintext language-bash">ls</code></pre>';
    expect(normalizeCodeBlockClasses(html, LANGUAGES)).toBe(html);
  });

  it('plaintext 단독 블록과 다른 속성은 건드리지 않는다', () => {
    const html =
      '<pre><code class="language-plaintext">a</code></pre>' +
      '<pre><code data-x="1" class="language-plaintext language-javascript extra" title="t">b</code></pre>';
    expect(normalizeCodeBlockClasses(html, LANGUAGES)).toBe(
      '<pre><code class="language-plaintext">a</code></pre>' +
        '<pre><code data-x="1" class="language-javascript extra" title="t">b</code></pre>',
    );
  });

  it('여러 번 적용해도 결과가 같다', () => {
    const html = '<pre><code class="language-plaintext language-mermaid">x</code></pre>';
    const once = normalizeCodeBlockClasses(html, LANGUAGES);
    expect(normalizeCodeBlockClasses(once, LANGUAGES)).toBe(once);
  });

  it('code 가 아닌 요소의 class 는 대상이 아니다', () => {
    const html = '<p class="language-plaintext language-mermaid">문단</p>';
    expect(normalizeCodeBlockClasses(html, LANGUAGES)).toBe(html);
  });
});

describe('mermaid 에디터 해시', () => {
  it('한글·화살표·따옴표가 섞인 소스도 왕복한다', () => {
    const code = 'flowchart TD\n  A["시작 \'인용\'"] --> B{조건?}\n  B -->|예| C[끝]';
    const hash = buildMermaidEditorHash(code);
    expect(hash.startsWith('#code=')).toBe(true);
    // URL-safe base64 라 해시 안에 '+', '/', '=' 패딩이 없다
    expect(hash.slice('#code='.length)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parseMermaidEditorHash(hash)).toBe(code);
  });

  it('키가 없거나 깨진 해시·공백뿐인 소스는 null', () => {
    expect(parseMermaidEditorHash('')).toBeNull();
    expect(parseMermaidEditorHash('#other=abc')).toBeNull();
    expect(parseMermaidEditorHash('#code=%%%')).toBeNull();
    expect(parseMermaidEditorHash(buildMermaidEditorHash('   '))).toBeNull();
  });
});
