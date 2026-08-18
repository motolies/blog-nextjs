import type { NextConfig } from 'next';

process.env.BLOG_URL_DEV ||= 'http://localhost:9090';
// process.env.BLOG_URL_DEV ||= 'https://api.hvy.kr';
process.env.BLOG_URL_PROD ||= 'http://blogback:8080';
process.env.META_URL ||= 'https://hvy.kr';
process.env.JIRA_BROWSE_URL ||= 'https://deleokorea.atlassian.net/browse';

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

export default nextConfig;
