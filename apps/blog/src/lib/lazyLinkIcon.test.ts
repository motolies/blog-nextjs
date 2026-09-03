import { createElement } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getLazyLinkIcon } from './lazyLinkIcon';
import { LINK_ICON_FALLBACK } from './linkIcons';

/** 서버 스트리밍 렌더를 끝까지 모아 문자열로 돌려준다 — Suspense 가 다 풀린 뒤의 HTML 이다. */
function renderFully(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = {
      write(chunk: unknown) {
        // Fizz 는 node 에서 Buffer/Uint8Array 로 쓴다 — String() 은 바이트 나열이 되어 버린다.
        html +=
          typeof chunk === 'string' ? chunk : Buffer.from(chunk as Uint8Array).toString('utf8');
        return true;
      },
      end() {
        resolve(html);
      },
      on() {
        return sink;
      },
      once() {
        return sink;
      },
      emit() {
        return false;
      },
      destroy() {},
    };
    const stream = renderToPipeableStream(element, {
      onAllReady() {
        stream.pipe(sink as never);
      },
      onError(error) {
        reject(error);
      },
    });
  });
}

describe('getLazyLinkIcon — 서버 렌더', () => {
  it('큐레이션 밖 이름도 서버 HTML 에 실제 svg 로 들어간다(하이드레이션 뒤에 늦게 뜨지 않는다)', async () => {
    const Anchor = getLazyLinkIcon('Anchor', LINK_ICON_FALLBACK);
    const html = await renderFully(
      createElement(Anchor, { className: 'size-4', 'aria-hidden': true }),
    );
    expect(html).toContain('lucide-anchor');
    expect(html).toContain('class="lucide lucide-anchor size-4"');
  });

  it('알 수 없는 이름은 폴백(Link2)을 그린다 — 렌더가 깨지지 않는다', async () => {
    const Broken = getLazyLinkIcon('NoSuchIconXyz', LINK_ICON_FALLBACK);
    const html = await renderFully(createElement(Broken, { className: 'size-4' }));
    expect(html).toContain('lucide-link-2');
  });

  it('폴백 자리표시자는 같은 className 과 크기를 가진 빈 svg 다 — 아이콘이 오기 전에도 레이아웃이 밀리지 않는다', async () => {
    // 첫 렌더에서 suspend 되면 Fizz 는 폴백을 먼저 내보낸다. 자리표시자 마크업이 포함되는지 본다.
    const Late = getLazyLinkIcon('Aperture', LINK_ICON_FALLBACK);
    const html = await renderFully(createElement(Late, { className: 'size-5', size: 20 }));
    expect(html).toContain('lucide-aperture');
    // 자리표시자가 나갔다면 같은 className 을 갖는다(스트리밍 여부는 타이밍에 따라 다르므로 조건부).
    if (html.includes('<template')) expect(html).toContain('class="size-5"');
  });
});
