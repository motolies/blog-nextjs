import { showToast } from '@hvy/ui';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { copyToClipboard } from '@/lib/clipboard';
import {
  CHECK_ICON,
  COPY_ICON,
  EXTERNAL_LINK_ICON,
  FAIL_ICON,
  MAXIMIZE_ICON,
} from '@/lib/inlineIcons';
import { MERMAID_CODE_SELECTOR, mermaidEditorHref, pickFitMode } from '@/lib/mermaidBlock';
import {
  nextDiagramId,
  renderMermaid,
  svgNaturalSize,
  toMermaidTheme,
} from '@/lib/mermaidRenderer';

const BLOCK_SELECTOR = 'figure.mermaid-block';
const CANVAS_CLASS = 'mermaid-block__canvas';
const COPY_LABEL = '다이어그램 소스 복사';

/**
 * 본문 DOM 후처리 단계 — mermaid 코드블록을 다이어그램 블록(figure)으로 감싼다.
 *
 * 원본 <pre> 는 지우지 않고 숨겨서 figure 안에 둔다. 소스 복사의 단일 원본이자, 렌더가 실패했을 때
 * 그대로 드러내는 대체 표시다(코드 하이라이트 훅이 이 <pre> 에도 줄번호·복사 버튼을 붙여 둔다).
 * 툴바는 정적 마크업으로 함께 만들어 렌더 전에도 자리를 차지하게 하고, 동작은 훅이 위임으로 붙인다.
 */
export function wrapMermaidBlocks(doc: Document) {
  doc.body.querySelectorAll(MERMAID_CODE_SELECTOR).forEach((code) => {
    const pre = code.parentElement;
    if (!pre?.parentNode || pre.closest(BLOCK_SELECTOR)) return;
    const source = code.textContent ?? '';
    if (!source.trim()) return;

    const figure = doc.createElement('figure');
    figure.className = 'mermaid-block';
    figure.dataset.mermaidState = 'pending';
    figure.dataset.fit = 'fit';

    const toolbar = doc.createElement('div');
    toolbar.className = 'mermaid-block__toolbar';
    toolbar.append(
      createElement(doc, 'span', { class: 'mermaid-block__label' }, 'Mermaid'),
      createElement(doc, 'span', { class: 'mermaid-block__hint' }, '← 좌우 스크롤 →'),
    );

    const actions = createElement(doc, 'div', { class: 'mermaid-block__actions' });
    actions.append(
      createButton(doc, 'copy', COPY_LABEL, '소스 복사', COPY_ICON),
      createButton(doc, 'expand', '다이어그램 크게 보기', '크게 보기', MAXIMIZE_ICON),
    );
    const editLink = createElement(doc, 'a', {
      class: 'mermaid-block__btn',
      href: mermaidEditorHref(source),
      target: '_blank',
      rel: 'noopener',
      'aria-label': '새 탭에서 다이어그램 편집',
      title: '새 탭에서 편집',
    });
    editLink.innerHTML = EXTERNAL_LINK_ICON;
    actions.append(editLink);
    toolbar.append(actions);

    const canvas = createElement(doc, 'div', { class: CANVAS_CLASS });
    canvas.append(
      createElement(doc, 'p', { class: 'mermaid-block__placeholder' }, '다이어그램을 그리는 중…'),
    );

    pre.parentNode.insertBefore(figure, pre);
    pre.hidden = true;
    figure.append(toolbar, canvas, pre);
  });
}

/**
 * 본문의 다이어그램 블록을 실제로 그리고 툴바 동작을 연결한다.
 *
 * - 다이어그램이 없는 글에서는 mermaid 를 불러오지 않는다(청크 요청 0).
 * - 테마가 바뀌면 숨겨 둔 원본으로 다시 그린다 — mermaid 는 색을 SVG 안 <style> 에 박아 넣어
 *   CSS 만으로는 바뀌지 않는다. 기존 SVG 는 새 SVG 가 준비될 때까지 둬서 깜빡이지 않는다.
 * - 폭이 바뀌면 다시 그리지 않고 표시 방식(fit/scroll)만 다시 고른다.
 */
export function useMermaidDiagrams(
  postBody: string,
  containerId: string,
  onOpenViewer: (source: string) => void,
) {
  const { resolvedTheme } = useTheme();
  const onOpenViewerRef = useRef(onOpenViewer);
  onOpenViewerRef.current = onOpenViewer;

  // 툴바 위임 리스너와 폭 감시 — 본문이 바뀔 때만 다시 건다
  useEffect(() => {
    if (!postBody) return;
    const container = document.getElementById(containerId);
    if (!container?.querySelector(BLOCK_SELECTOR)) return;

    const listeners = new AbortController();
    container.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element | null)?.closest<HTMLButtonElement>(
          'button[data-mermaid-action]',
        );
        const figure = button?.closest<HTMLElement>(BLOCK_SELECTOR);
        if (!button || !figure) return;

        const source = readSource(figure);
        if (button.dataset.mermaidAction === 'copy') {
          void copySource(button, source);
        } else if (button.dataset.mermaidAction === 'expand') {
          onOpenViewerRef.current(source);
        }
      },
      { signal: listeners.signal },
    );

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        applyFit(entry.target as HTMLElement);
      }
    });
    container.querySelectorAll<HTMLElement>(BLOCK_SELECTOR).forEach((figure) => {
      resizeObserver.observe(figure);
    });

    return () => {
      listeners.abort();
      resizeObserver.disconnect();
    };
  }, [postBody, containerId]);

  // 렌더 — 본문이나 테마가 바뀔 때. 테마가 정해지기 전(undefined)에는 한 번 그렸다 다시 그리지 않도록 기다린다.
  useEffect(() => {
    if (!postBody || !resolvedTheme) return;
    const container = document.getElementById(containerId);
    const figures = Array.from(container?.querySelectorAll<HTMLElement>(BLOCK_SELECTOR) ?? []);
    if (figures.length === 0) return;

    let cancelled = false;
    const theme = toMermaidTheme(resolvedTheme);

    const renderAll = async () => {
      for (const figure of figures) {
        if (cancelled) return;
        try {
          const svg = await renderMermaid(nextDiagramId(), readSource(figure), theme);
          if (cancelled || !figure.isConnected) return;
          showDiagram(figure, svg);
        } catch {
          if (cancelled || !figure.isConnected) return;
          showFallback(figure);
        }
      }
    };
    void renderAll();

    return () => {
      cancelled = true;
    };
  }, [postBody, resolvedTheme, containerId]);
}

/**
 * 숨겨 둔 원본을 읽는다. 클래스가 아니라 구조로 찾는 이유: 코드 하이라이트 훅의 Prism 이
 * `language-*` 클래스를 전부 지우고 자기가 고른 언어 하나만 다시 붙인다 — 이중 클래스 블록은
 * `language-plaintext` 만 남아 mermaid 셀렉터로는 하이라이트 이후 원본을 찾을 수 없다.
 */
function readSource(figure: HTMLElement): string {
  return figure.querySelector(':scope > pre > code')?.textContent ?? '';
}

function showDiagram(figure: HTMLElement, svg: string) {
  const canvas = figure.querySelector<HTMLElement>(`.${CANVAS_CLASS}`);
  if (!canvas) return;
  canvas.innerHTML = svg;
  figure.dataset.mermaidState = 'rendered';
  applyFit(figure);
}

/** 렌더 실패 — 숨긴 원본을 일반 코드블록으로 드러내고 사유를 한 줄 붙인다. */
function showFallback(figure: HTMLElement) {
  figure.dataset.mermaidState = 'error';
  const pre = figure.querySelector<HTMLElement>(':scope > pre');
  if (pre) pre.hidden = false;
  if (!figure.querySelector('.mermaid-block__error')) {
    const notice = document.createElement('p');
    notice.className = 'mermaid-block__error';
    notice.textContent = '다이어그램을 그리지 못해 원본 코드를 표시합니다. 문법을 확인해 주세요.';
    figure.querySelector(`.${CANVAS_CLASS}`)?.after(notice);
  }
}

/**
 * 본문 폭에 맞춰 표시 방식을 고른다. 최소 배율보다 더 줄여야 하면 폭을 고정하고 캔버스를
 * 가로 스크롤 영역으로 만든다 — 키보드로도 스크롤할 수 있게 그때만 포커스를 받는다.
 */
function applyFit(figure: HTMLElement) {
  const canvas = figure.querySelector<HTMLElement>(`.${CANVAS_CLASS}`);
  const svg = canvas?.querySelector<SVGSVGElement>(':scope > svg');
  if (!canvas || !svg) return;

  const { width: naturalWidth } = svgNaturalSize(svg);
  const style = getComputedStyle(canvas);
  const available =
    canvas.clientWidth -
    Number.parseFloat(style.paddingLeft) -
    Number.parseFloat(style.paddingRight);
  const fit = pickFitMode(available, naturalWidth);

  figure.dataset.fit = fit.mode;
  if (fit.mode === 'scroll') {
    svg.style.width = `${fit.width}px`;
    svg.style.maxWidth = 'none';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'region');
    canvas.setAttribute('aria-label', '다이어그램 가로 스크롤 영역');
  } else {
    svg.style.width = '';
    svg.style.maxWidth = `${naturalWidth}px`;
    canvas.removeAttribute('tabindex');
    canvas.removeAttribute('role');
    canvas.removeAttribute('aria-label');
  }
}

/** 소스를 복사하고 아이콘·라벨·토스트로 결과를 알린다. 원본이 화면에 없으니 토스트가 유일한 확인 수단이다. */
async function copySource(button: HTMLButtonElement, source: string) {
  const copied = await copyToClipboard(source);
  button.innerHTML = copied ? CHECK_ICON : FAIL_ICON;
  button.setAttribute(
    'aria-label',
    copied ? '다이어그램 소스 복사됨' : '다이어그램 소스 복사 실패',
  );
  showToast(
    copied ? '다이어그램 소스를 복사했습니다.' : '클립보드에 복사하지 못했습니다.',
    copied ? 'success' : 'error',
  );

  window.clearTimeout(copyResetTimers.get(button));
  copyResetTimers.set(
    button,
    window.setTimeout(() => {
      button.innerHTML = COPY_ICON;
      button.setAttribute('aria-label', COPY_LABEL);
    }, 2000),
  );
}

// 연속 클릭 시 앞선 복원 타이머가 새 결과 아이콘을 일찍 지우지 않게 버튼별로 하나만 유지한다
const copyResetTimers = new WeakMap<HTMLButtonElement, number>();

function createButton(doc: Document, action: string, label: string, title: string, icon: string) {
  const button = createElement(doc, 'button', {
    type: 'button',
    class: `mermaid-block__btn mermaid-block__btn--${action}`,
    'data-mermaid-action': action,
    'aria-label': label,
    title,
  });
  button.innerHTML = icon;
  return button;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  attributes: Record<string, string>,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  if (text) element.textContent = text;
  return element;
}
