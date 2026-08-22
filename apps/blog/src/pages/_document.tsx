import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko" suppressHydrationWarning>
      <Head>
        {/* above-the-fold 본문 폰트(Regular 2종)만 프리로드 — Bold 는 온디맨드.
            crossOrigin 은 same-origin 이어도 필수(폰트 fetch 는 CORS 모드라 없으면 이중 다운로드). */}
        <link
          rel="preload"
          href="/fonts/JetBrainsMono-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/d2coding-subset.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
