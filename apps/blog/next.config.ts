import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

process.env.BLOG_URL_DEV ||= 'http://localhost:9090';
// process.env.BLOG_URL_DEV ||= 'https://api.hvy.kr';
process.env.BLOG_URL_PROD ||= 'http://blogback:8080';
process.env.META_URL ||= 'https://hvy.kr';
process.env.JIRA_BROWSE_URL ||= 'https://deleokorea.atlassian.net/browse';
// GlitchTip DSN — 공개키라 비밀이 아니다. 발급 후 아래 주석을 실값으로 교체한다.
process.env.SENTRY_DSN ||= 'https://42171b5b42454852bc5300892d4d7334@glitchtip.hvy.kr/1';

const nextConfig: NextConfig = {
  output: 'standalone',
  // @hvy/ui 는 빌드 산출물 없이 소스(main: ./src/index.ts)를 직접 노출한다 — 앱이 트랜스파일한다
  transpilePackages: ['@hvy/ui'],
  // next dev 가 앱마다 AGENTS.md/CLAUDE.md 를 자동 생성하는 것을 차단 — 루트 문서를 단일 소스로 유지
  agentRules: false,
  experimental: {
    // TS 7 은 JS 컴파일러 API 를 제공하지 않는다 — 이 플래그가 없으면 next build 의 타입체크가 동작하지 않는다.
    useTypeScriptCli: true,
  },
  env: {
    META_URL: process.env.META_URL,
    JIRA_BROWSE_URL: process.env.JIRA_BROWSE_URL,
    // 빌드타임 인라인 — 비어 있으면 Sentry init 이 enabled=false 로 조용히 꺼진다
    SENTRY_DSN: process.env.SENTRY_DSN ?? '',
    // 이벤트 environment 태그 — 기본은 NODE_ENV. 로컬에서 운영 GlitchTip 으로 검증할 때 'local' 로 분리한다
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

/**
 * withSentryConfig — 빌드 시 소스맵 생성·업로드(debug-id 방식)와 release 주입을 담당한다.
 * SENTRY_AUTH_TOKEN 이 없으면 업로드만 스킵되므로 로컬 pnpm verify 는 그대로 통과한다.
 * 토큰이 있는데 업로드가 실패하면 빌드가 실패한다(errorHandler) — minified 스택만 남는 배포를 막는다.
 * 업로드 대상은 셀프호스트 GlitchTip — sentryUrl 로 지정한다 (Docker build ARG 로 재정의 가능).
 */
export default withSentryConfig(nextConfig, {
  org: 'hvy',
  project: 'blog-nextjs',
  sentryUrl: process.env.SENTRY_URL || 'https://glitchtip.hvy.kr',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // 이미지 태그·이벤트·소스맵이 커밋 SHA 7자리 하나로 정렬된다 (buildx 가 VERSION 전달)
  release: { name: process.env.VERSION || undefined },
  sourcemaps: {
    // static 의 sourceMappingURL 주석 제거를 트리거한다 (삭제 대상은 아래 filesToDeleteAfterUpload 가 대체)
    deleteSourcemapsAfterUpload: true,
    // SDK 기본 삭제 패턴은 .next/static/** 한정이라 서버 .map(Turbopack 기본 산출물)이 standalone 에 그대로 실린다.
    // runAfterProductionCompile 은 standalone 복사 전에 실행되므로 여기서 지우면 공개 Docker 이미지에서 빠진다.
    // GlitchTip 심볼화는 업로드가 먼저 끝난 뒤라 영향 없다.
    filesToDeleteAfterUpload: ['.next/static/**/*.map', '.next/server/**/*.map'],
  },
  silent: true,
  telemetry: false,
  // silent 여도 이 콜백은 호출된다 — 업로드 실패를 조용히 넘기지 않는다.
  // 토큰이 있는 빌드(CI)는 실패시켜 minified 스택만 남는 배포를 막고, 토큰 없는 로컬 빌드는 경고만 남긴다.
  errorHandler(err) {
    console.warn('[sentry] 소스맵 업로드 오류:', err.message);
    if (process.env.SENTRY_AUTH_TOKEN) throw err;
  },
  // tunnelRoute 미사용 — 자체 도메인 GlitchTip 은 광고차단 리스트에 오를 가능성이 낮다.
  // 차단이 관측되면 '/monitoring' 으로 추가한다 (BFF catch-all 은 /api/* 라 경로 충돌 없음).
});
