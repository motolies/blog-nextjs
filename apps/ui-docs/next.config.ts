import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // TypeScript 7 은 JS 컴파일러 API 를 제공하지 않는다.
  // 이 플래그가 없으면 next build 의 기본 타입체크가 동작하지 않는다.
  experimental: {
    useTypeScriptCli: true,
  },

  // 워크스페이스 패키지는 dist 빌드 없이 TS 소스를 직접 읽는다 → 저장 즉시 HMR.
  // 이 앱은 @hvy/ui 하나만 쓴다 — core·bff-client 등 서버 계층은 문서 앱에 없다.
  transpilePackages: ['@hvy/ui'],

  poweredByHeader: false,

  // Next 가 apps/ui-docs/{CLAUDE,AGENTS}.md 를 자동 생성하는 기능을 끈다.
  // 레포 루트 CLAUDE.md 가 아키텍처 규칙의 단일 진실 소스인데, 규칙 파일이 갈라지면
  // 그 선언 자체가 무효가 된다.
  agentRules: false,
};

export default nextConfig;
