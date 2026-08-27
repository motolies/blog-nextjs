import '../styles/global.css'; // ⚠️ import 순서 고정 — ckeditor.css 가 content-typography(global.css 내 @import) 뒤에 와야 한다
import '../styles/fonts.css';
import '../styles/rainbow.css';
import '../styles/ckeditor.css';
import '../styles/ckeditor-theme.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';

const META_URL = process.env.META_URL;

// 사이트 기본 메타(옛 MetaHeader(next/head)의 <Head> 내용) — 페이지(post/[id])가 필요한 필드만 덮어쓴다
export const metadata: Metadata = {
  title: 'Skyscape',
  description: 'IT blog by motolies',
  robots: 'index,follow',
  authors: [{ name: 'motolies' }],
  icons: { icon: '/favicon.ico' },
  openGraph: { images: [`${META_URL}/images/og-logo.png`] },
  verification: {
    other: { 'naver-site-verification': 'dea29fb1cd45a91583f252df95e93651693297a3' },
  },
};

/**
 * App Router 루트 레이아웃 — html/head 골격과 전역 CSS·Provider 체인을 소유하는 서버 컴포넌트(옛 _document + _app 의 역할).
 * 라우트별 크롬(공개/관리자)은 세그먼트 layout 이 맡고, 여기서는 문서 골격과 Providers 만 소유한다.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes 가 hydration 전에 data-theme 를 붙인다
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 폰트 preload 2종 — above-the-fold 본문 폰트(Regular 2종)만 프리로드, Bold 는 온디맨드.
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
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
