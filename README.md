# blog-nextjs

개인 블로그 Next.js 프론트엔드 — pnpm 모노레포

## 구조

```
├─ apps/blog        # 블로그 앱 (Next.js 16, Pages Router) — Docker 배포 대상
├─ apps/ui-docs     # 디자인 시스템 문서 앱 (로컬 전용, 포트 3020) — Docker 미포함
├─ packages/ui      # @hvy/ui 디자인 시스템 — 빌드 산출물 없이 TS 소스를 앱이 직접 소비
├─ pnpm-workspace.yaml  # catalog = 버전 고정의 단일 진실 소스
└─ biome.json       # 린트/포맷 (ESLint 대체)
```

## 📚 문서

- [로컬 개발 가이드 (Local Development)](./docs/local-development.md) - 설치부터 blog·ui-docs 실행까지 (모노레포 전환 후 첫 실행이라면 여기부터)
- [인증 시스템 (Authentication)](./docs/authentication.md) - 쿠키 기반 인증 구조 및 SSR/CSR 플로우
- [디버깅 가이드 (Debug)](./docs/debug.md) - IntelliJ에서 Turbopack 서버/클라이언트 디버깅 설정

## 모니터링

브라우저/BFF 에러는 `@sentry/nextjs` SDK 로 셀프호스트 **GlitchTip** 에 수집된다.
모든 API 요청에 W3C `traceparent` 헤더를 실어 백엔드(Spring/Brave)와 traceId 를 통일하므로,
GlitchTip 이벤트의 trace ID 로 Loki 로그·Zipkin 트레이스를 바로 검색할 수 있다.
DSN 이 비어 있으면 SDK 는 조용히 꺼진다(`apps/blog/next.config.ts`).
배포·운영 절차는 [blog-back/claudedocs/glitchtip-deployment.md](../claudedocs/glitchtip-deployment.md) 참고.

## 사용법

요구사항: Node ≥ 24, pnpm 11.20.0 (`npm i -g pnpm@11.20.0`)

```shell
pnpm install        # 반드시 레포 루트에서 (catalog:/workspace:* 는 루트에서만 해석된다)
pnpm dev            # apps/blog 개발 서버 (:3000)
pnpm dev:docs       # apps/ui-docs 문서 앱 (:3020)
pnpm build          # apps/blog 프로덕션 빌드
pnpm check          # biome 린트/포맷 검사 (자동수정: pnpm check:fix)
pnpm typecheck      # 전 워크스페이스 tsc --noEmit
pnpm test           # vitest (packages/** + apps/**/*.test.ts)
pnpm test:blog      # apps/blog 유틸 테스트 (node:test)
pnpm verify         # check + typecheck + verify:tokens + test + build 일괄
```

백엔드 없이 띄우기(`MOCK_DOWNSTREAM=true`), 로컬 백엔드 연결, 트러블슈팅은
[로컬 개발 가이드](./docs/local-development.md)를 참고한다.

## 의존성 업데이트

버전은 `pnpm-workspace.yaml`의 `catalog:`가 단일 진실 소스다.
deleo-one-ui catalog 와 교집합인 패키지(react, next, tailwindcss 등)는 그쪽 버전과 동기화하고,
blog 전용 의존성(ckeditor5, echarts 등)은 `apps/blog/package.json`에서 관리한다.

```shell
pnpm outdated -r          # 워크스페이스 전체 구버전 확인
pnpm audit                # 보안 취약점 확인
# catalog 버전 수정 후:
pnpm install && pnpm verify
```

---

## 빌드

### 다중 아키텍처 빌드시

```shell
# 기본 docker buildx 로는 바로 빌드가 되지 않는다.
# 그래서 신규로 하나 생성하여 주자
docker buildx create --name jarvis \
&& docker buildx use jarvis \
&& docker buildx inspect --bootstrap

# -t 옵션을 붙이면 tag를 추가해서 업로드 가능하다
docker buildx build --platform linux/amd64,linux/arm64 --no-cache --push -t docker.hvy.kr/blog-front  .

docker buildx build --platform linux/amd64 --no-cache --push -t docker.hvy.kr/blog-front  .
```

### 단일 빌드시
```shell
# 빌드
docker build --no-cache -t docker.hvy.kr/blog-front .

# 이미지 푸쉬
docker push --all-tags docker.hvy.kr/blog-front
```

## 실행

`output: 'standalone'` 빌드는 컨테이너 런타임의 `BLOG_URL_PROD`를 읽습니다.
또한 `blogfront`와 `blogback`은 같은 사용자 정의 Docker 네트워크에 연결되어 있어야 `http://blogback:8080`이 해석됩니다.

```shell
# 삭제
docker rm -f blogfront


# 네트워크(최초 1회)
docker network create prod_back_network


# 실행(테스트용)
docker run -d --restart=unless-stopped \
--pull always \
-e BLOG_URL_PROD=http://blogback:8080 \
--network prod_back_network \
-p 3000:3000 \
--name blogfront docker.hvy.kr/blog-front

# 실행(테스트용 - windows)
docker run -d --restart=unless-stopped --pull always -e BLOG_URL_PROD=http://host.docker.internal:9090 -p 3000:3000 --name blogfront docker.hvy.kr/blog-front

# 실행(프로덕션)
docker run -d --restart=unless-stopped \
--pull always \
-e BLOG_URL_PROD=http://blogback:8080 \
--network prod_back_network \
-p 3000:3000 \
--name blogfront docker.hvy.kr/blog-front
```

`blogback` 컨테이너도 동일하게 `prod_back_network`에 붙어 있어야 합니다.
