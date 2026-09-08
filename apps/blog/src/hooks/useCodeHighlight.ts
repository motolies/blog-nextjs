import { useEffect } from 'react';

/**
 * 포스트 본문 내 코드 블록에 Prism.js 신택스 하이라이팅과 복사 버튼을 적용하는 훅.
 *
 * - CKEditor가 생성하는 <pre><code class="language-{lang}"> 구조를 Prism.js가 바로 인식
 * - 각 <pre> 블록 우상단에 복사 버튼을 동적 삽입
 * - 줄번호는 CSS counter 방식으로 처리
 */
export function useCodeHighlight(postBody: string) {
  useEffect(() => {
    if (!postBody) return;

    const container = document.getElementById('post-content');
    if (!container) return;

    let isCancelled = false;
    // 복사 버튼이 거는 click·scroll 리스너를 정리 시점에 한 번에 떼기 위한 신호
    const listeners = new AbortController();

    const init = async () => {
      const Prism = (await import('prismjs')).default;

      // 언어 컴포넌트 로드 (markup, clike는 다른 언어의 의존성이므로 먼저)
      await import('prismjs/components/prism-markup');
      await import('prismjs/components/prism-css');
      await import('prismjs/components/prism-clike');
      await import('prismjs/components/prism-javascript');
      await import('prismjs/components/prism-typescript');
      await import('prismjs/components/prism-python');
      await import('prismjs/components/prism-java');
      await import('prismjs/components/prism-sql');
      await import('prismjs/components/prism-bash');
      await import('prismjs/components/prism-json');
      await import('prismjs/components/prism-yaml');

      if (isCancelled) return;

      // language-xml -> language-markup으로 매핑 (Prism은 XML을 markup으로 처리)
      container.querySelectorAll('code.language-xml').forEach((el) => {
        el.classList.remove('language-xml');
        el.classList.add('language-markup');
      });

      // language-html -> language-markup
      container.querySelectorAll('code.language-html').forEach((el) => {
        el.classList.remove('language-html');
        el.classList.add('language-markup');
      });

      // language-shell -> language-bash
      container.querySelectorAll('code.language-shell').forEach((el) => {
        el.classList.remove('language-shell');
        el.classList.add('language-bash');
      });

      // language-plaintext는 하이라이팅 없이 표시
      // language 클래스가 없는 code 블록에도 기본 스타일 적용
      container.querySelectorAll('pre > code:not([class*="language-"])').forEach((el) => {
        el.classList.add('language-plaintext');
      });

      Prism.highlightAllUnder(container);

      // 줄번호 삽입
      attachLineNumbers(container);

      // 복사 버튼 삽입
      attachCopyButtons(container, listeners.signal);
    };

    init();

    return () => {
      isCancelled = true;
      listeners.abort();
      // 기존 동적 삽입 요소 정리
      container.querySelectorAll('.code-copy-btn').forEach((btn) => {
        btn.remove();
      });
      container.querySelectorAll('.code-line-numbers').forEach((el) => {
        el.remove();
      });
    };
  }, [postBody]);
}

const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

const FAIL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

function attachLineNumbers(container: HTMLElement) {
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.code-line-numbers')) return;

    const code = pre.querySelector('code');
    if (!code) return;

    const text = code.textContent ?? '';
    const lineCount = text.split('\n').length;
    // 마지막 줄이 빈 줄이면 줄번호에서 제외
    const adjustedCount = text.endsWith('\n') ? lineCount - 1 : lineCount;

    if (adjustedCount <= 0) return;

    const lineNumbersEl = document.createElement('span');
    lineNumbersEl.className = 'code-line-numbers';
    lineNumbersEl.setAttribute('aria-hidden', 'true');

    const numbers = Array.from({ length: adjustedCount }, (_, i) => i + 1).join('\n');
    lineNumbersEl.textContent = numbers;

    pre.classList.add('has-line-numbers');
    pre.insertBefore(lineNumbersEl, pre.firstChild);
  });
}

/**
 * 코드 블록에서 복사할 원문을 뽑아낸다.
 *
 * 본문에는 두 세대의 코드 블록이 섞여 있다.
 * - 최신 CKEditor: <pre><code class="language-*">…\n…</code></pre> — 진짜 개행을 쓴다
 * - 과거 IDE 붙여넣기: <pre><span style="color:…">…</span><br>…</pre> — <code>가 아예 없다
 *
 * 후자를 textContent 로 읽으면 <br>이 무시돼 전체가 한 줄로 뭉개지므로, 렌더된 줄바꿈을
 * 반영하는 innerText 로 읽는다. innerText 는 레이아웃 기반이라 화면에 붙어 있는 원본
 * 노드에서만 유효하다(복제본은 textContent 와 같아진다) — 그래서 우리가 주입한
 * 줄번호·버튼을 잠시 숨겼다가 되돌리는 방식으로 제외한다.
 */
function readCodeText(pre: HTMLElement): string {
  const code = pre.querySelector('code');
  const usesBrLineBreaks = pre.querySelector('br') !== null;

  if (code && !usesBrLineBreaks) {
    return code.textContent ?? '';
  }

  const source = code ?? pre;
  const injected = Array.from(
    source.querySelectorAll<HTMLElement>('.code-copy-btn, .code-line-numbers'),
  );
  const previousDisplay = injected.map((el) => el.style.display);
  injected.forEach((el) => {
    el.style.display = 'none';
  });
  const text = source.innerText;
  injected.forEach((el, i) => {
    el.style.display = previousDisplay[i];
  });

  return text;
}

/**
 * 클립보드에 텍스트를 쓰고 **실제 성공 여부**를 돌려준다.
 * 비보안 컨텍스트(http)나 권한 거부로 Clipboard API 가 막히면 execCommand 로 폴백하되,
 * 폴백의 반환값까지 확인한다 — 실패를 성공으로 표시하면 사용자가 빈 클립보드를 붙여넣게 된다.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    // iOS Safari 는 select() 만으로 범위가 잡히지 않는다
    textarea.setSelectionRange(0, text.length);

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }
}

function attachCopyButtons(container: HTMLElement, signal: AbortSignal) {
  container.querySelectorAll('pre').forEach((pre) => {
    // 이미 복사 버튼이 있으면 스킵
    if (pre.querySelector('.code-copy-btn')) return;
    // 빈 블록에는 붙이지 않는다
    if (!pre.textContent?.trim()) return;

    // pre를 relative 컨테이너로 설정
    pre.style.position = 'relative';

    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', '코드 복사');
    btn.innerHTML = COPY_ICON;

    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    btn.addEventListener(
      'click',
      async () => {
        const copied = await copyToClipboard(readCodeText(pre));

        btn.innerHTML = copied ? CHECK_ICON : FAIL_ICON;
        btn.classList.remove('copied', 'copy-failed');
        btn.classList.add(copied ? 'copied' : 'copy-failed');
        btn.setAttribute('aria-label', copied ? '코드 복사됨' : '코드 복사 실패');

        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          btn.innerHTML = COPY_ICON;
          btn.classList.remove('copied', 'copy-failed');
          btn.setAttribute('aria-label', '코드 복사');
        }, 2000);
      },
      { signal },
    );

    // pre 는 overflow-x:auto 스크롤 컨테이너라 absolute 버튼이 코드와 함께 밀려난다.
    // 가로 스크롤량만큼 되밀어 항상 우상단에 고정한다.
    pre.addEventListener(
      'scroll',
      () => {
        btn.style.transform = pre.scrollLeft ? `translateX(${pre.scrollLeft}px)` : '';
      },
      { passive: true, signal },
    );

    pre.appendChild(btn);
  });
}
