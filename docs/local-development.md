# 로컬 개발 가이드

레포를 처음 받은 시점부터 **설치 → `apps/blog` 실행 → `apps/ui-docs` 확인**까지의 절차를 정리한다. 모노레포 전환으로 실행 진입점이 3개 (blog · ui-docs · 목 모드)로 늘었고, 설치 위치가 루트로 고정됐다.

---

## 1. 사전 요구사항

| 도구    | 버전                   | 확인      |
|---------|------------------------|-----------|
| Node.js | ≥ 24 (`.nvmrc` = `24`) | `node -v` |
| pnpm    | 11.20.0                | `pnpm -v` |

```shell
nvm use                       # .nvmrc 를 읽어 Node 24 로 전환
npm i -g pnpm@11.20.0
```

**corepack 을 쓰지 않는다.** corepack 은 Node 25 부터 제거 예정이라 `Dockerfile` 에서 이미 배제하고
`npm install -g pnpm@11.20.0` 으로 고정했다. 로컬도 같은 방식으로 맞춰 빌드 환경과 어긋나지 않게 한다.

버전이 어긋나면 루트 `package.json` 의 `packageManager: "pnpm@11.20.0"` 이 설치 시점에 경고 또는 실패로 알려준다.

---

## 2. 최초 셋업

```shell
cd blog-nextjs
pnpm install          # 반드시 레포 루트에서
```

### 왜 루트에서만 설치하나

각 앱의 `package.json` 은 버전을 직접 적지 않고 프로토콜로 참조한다.

```jsonc
"next": "catalog:",      // 실제 버전은 pnpm-workspace.yaml 의 catalog: 에 있다
"@hvy/ui": "workspace:*" // 레지스트리가 아니라 packages/ui 를 링크한다
```

`catalog:` 와 `workspace:*` 는 **워크스페이스 루트 컨텍스트에서만 해석된다.**
`apps/blog` 안에서 `pnpm install` 을 돌리면 두 프로토콜을 풀지 못해 실패한다. 버전 고정의 단일 진실 소스는 `pnpm-workspace.yaml` 의 `catalog:` 이므로, 버전을 올릴 때도 그 파일을 고친 뒤 루트에서 재설치한다.

### 설치 로그에서 정상인 것

```
Scope: all 4 workspace projects
✓ Lockfile passes supply-chain policies (707 entries in 6s)
Done in 7.2s using pnpm v11.20.0
```

- **`Scope: all 4 workspace projects`** — 루트 + blog + ui-docs + @hvy/ui. 이 숫자가 1 이면 잘못된 위치에서 설치한 것이다.
- **공급망 정책 검증에 몇 초** — pnpm 11 이 lockfile 전체를 검사한다. 느린 게 아니라 원래 그렇다.
- **postinstall 관련 경고가 없다** — pnpm 11 은 postinstall 을 기본 차단하지만, `pnpm-workspace.yaml` 의 `allowBuilds` 가 판단을 미리 명시해 둬서 승인 프롬프트가 뜨지 않는다: `sharp: true`(next 이미지 최적화 네이티브 바이너리 — standalone 런타임에 필요),
  `msw: false`(브라우저 서비스워커 자산 불필요 — Node 사이드 목만 쓴다). 새 패키지를 추가했다가 `Ignored build scripts` 경고를 보면 여기에 판단을 추가한다.
- **`node_modules` 가 하나도 없는 상태에서 시작** — 커밋 대상이 아니므로 클론 직후엔 정상이다.

> ⚠️ 설치 중 pnpm 이 `Update available! ... To update, run: corepack use pnpm@X` 배너를 띄울 수 있다. **따르지 않는다.**
> 버전은 `packageManager` 로 고정돼 있고, corepack 은 이 프로젝트가 의도적으로 배제한 경로다.

### 별도 빌드 단계가 없다 (전환 전과 가장 다른 점)

`packages/ui`(`@hvy/ui`)는 dist 산출물을 만들지 않는다. `package.json` 의 `main` 이 `./src/index.ts` 이고, 앱이 `next.config.ts` 의 `transpilePackages: ['@hvy/ui']` 로 TS 소스를 직접 트랜스파일한다.

> `pnpm install` 다음에 `pnpm build` 를 먼저 돌릴 필요가 없다. 설치가 끝나면 바로 dev 서버를 띄우면 된다.
> `packages/ui/src` 를 수정하면 앱 쪽 HMR 이 즉시 반응한다.

---

## 3. 워크스페이스 명령 규칙

`pnpm -F <name>` 의 `<name>` 은 **디렉터리가 아니라 `package.json` 의 `name`** 이다.

| 경로           | 패키지 이름 | 용도                                                     |
|----------------|-------------|----------------------------------------------------------|
| `apps/blog`    | `blog`      | 블로그 앱 (:3000) — Docker 배포 대상                     |
| `apps/ui-docs` | `ui-docs`   | 디자인 시스템 문서 앱 (:3020) — 로컬 전용, Docker 미포함 |
| `packages/ui`  | `@hvy/ui`   | 공유 UI 계층 — 빌드 산출물 없음                          |

```shell
pnpm -F blog dev              # 특정 패키지에서 스크립트 실행
pnpm -r --parallel exec tsc --noEmit   # 전 워크스페이스 순회
```

루트 `package.json` 의 `dev` · `build` · `start` 는 전부 `blog` 로 위임하는 단축키다.

---

## 4. apps/blog 실행

```shell
pnpm dev              # = pnpm -F blog dev → http://localhost:3000
```

### 백엔드 연결 3경로

브라우저는 백엔드를 직접 호출하지 않는다. 모든 요청이 Next 의 `/api/*` 로 들어오고 Next 가 Java 백엔드로 프록시한다 (→ [인증 시스템](./authentication.md)). 그 프록시 대상이 `BLOG_URL_DEV` 이고, `next.config.ts` 상단이 기본값을 채운다.

| 경로                      | 명령                                          | 쓰는 상황                                                        |
|---------------------------|-----------------------------------------------|------------------------------------------------------------------|
| **A. MSW 목**             | `MOCK_DOWNSTREAM=true pnpm dev`               | 백엔드 없이 화면만 확인 — 클론 직후 가장 빠른 경로               |
| **B. 원격 실서버** (기본) | `pnpm dev`                                    | `BLOG_URL_DEV` 기본값 `https://api.hvy.kr` 로 붙어 실데이터 확인 |
| **C. 로컬 hvy-blog**      | `BLOG_URL_DEV=http://localhost:9090 pnpm dev` | 백엔드를 함께 고칠 때                                            |

C 경로는 옆 폴더의 `hvy-blog`(Spring) 를 먼저 띄워야 한다. 기동 절차는 그 레포 문서 소관이다.
`apps/blog/.env` 는 레포에 커밋되어 있어 (`.env*.local` 만 gitignore) 클론 직후 별도 설정 없이 B 경로가 동작한다. 값을 바꾸고 싶으면 `.env.local` 을 만들어 덮어쓰면 된다 — 커밋되지 않는다.

### A 경로 상세 — MSW 목 다운스트림

`MOCK_DOWNSTREAM=true` 를 주면 Next 서버 프로세스 기동 시 `src/instrumentation.ts` 의 `register()` 가 MSW 를 켠다. 브라우저 서비스워커는 쓰지 않는다 — 백엔드 호출이 전부 Next 서버에서 일어나므로 (SSR axios · BFF 프록시 fetch) 인터셉트 지점도 서버 하나뿐이다.

```shell
MOCK_DOWNSTREAM=true pnpm dev
# 기동 로그: [mock] MSW 목 다운스트림 활성 — 실제 백엔드를 호출하지 않는다
```

**목 로그인**: `username` 은 `admin`. 목은 복호화하지 않으므로 비밀번호는 검사하지 않는다 (개인키 미보관).

**커버 범위** — `mocks/handlers.ts` 의 공개 API 16종:

| 도메인       | 경로                                                                                                                                                                          |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| auth (3)     | `/api/auth/shake` · `/api/auth/login` · `/api/auth/profile`                                                                                                                   |
| post (6)     | `/api/post` · `/api/post/:postId` · `/api/post/search` · `/api/post/search-engine` · `/api/post/public-content` · `/api/post/prev-next/:postId` · `/api/post/:postId/related` |
| category (2) | `/api/category` · `/api/category/root`                                                                                                                                        |
| tag (2)      | `/api/tag` · `/api/tag/all`                                                                                                                                                   |
| series (3)   | `/api/series` · `/api/series/:seriesId` · `/api/series/by-post/:postId`                                                                                                       |

> ⚠️ **admin CRUD (`/api/post/admin/**` 등)에는 목이 없다.** 미핸들 요청은 `onUnhandledRequest: 'bypass'` 로 **실 백엔드로 나간다.**
> `/admin/*` 화면을 테스트하려면 B 또는 C 경로를 써야 한다. 목 모드에서 관리 화면이 이상하게 동작하면 대개 이것이 원인이다.

**목이 실제로 동작하는지 확인** — 핸들러 호출 카운터를 조회한다:

```shell
curl localhost:3000/api/dev/mock-stats            # {"auth":0,"post":3,"search":1,...}
curl 'localhost:3000/api/dev/mock-stats?reset=true'  # 카운터 초기화
```

`MOCK_DOWNSTREAM` 이 꺼져 있으면 이 엔드포인트는 500 을 준다 — 운영에 실수로 남아도 아무것도 노출하지 않는다.

**함정 2가지**

1. **`mocks/` 를 수정하면 dev 서버를 재시작해야 한다.** `register()` 는 프로세스당 1회만 실행되고 HMR 은 인터셉터를 재등록하지 않는다. 재시작하지 않으면 목이 조용히 낡은 채로 남는다.
2. **`MOCK_DOWNSTREAM` 은 `true` · `false` 만 허용한다.** `ture` 같은 오타는 기동 실패로 드러난다 (`mocks/env.ts`). 목이 꺼진 줄 모르고 실 백엔드를 호출하는 사고가 가장 찾기 어렵기 때문에 의도적으로 그렇게 만들어 두었다.

### 주요 화면

| URL                      | 내용                                                         |
|--------------------------|--------------------------------------------------------------|
| `/`                      | 글 목록                                                      |
| `/post/[id]`             | 글 상세                                                      |
| `/search`                | 검색                                                         |
| `/login`                 | 로그인                                                       |
| `/admin`, `/admin/write` | 관리 화면 (목 미커버 — B·C 경로 필요)                        |
| `/util/*`                | 부가 도구 (crontab · cidr · regex · barcode 등, 백엔드 무관) |

### 디버깅

`dev` 스크립트는 `next dev --inspect` 라 인스펙터가 서버 프로세스에 직접 열린다 (기본 9229). IntelliJ 설정은 → [디버깅 가이드](./debug.md).

---

## 5. apps/ui-docs 실행 (디자인 시스템 확인)

```shell
pnpm dev:docs         # = pnpm -F ui-docs dev → http://localhost:3020
PORT=3021 pnpm dev:docs   # 3020 이 이미 점유된 경우
```

**백엔드도 환경변수도 필요 없다.** blog (:3000) 와 포트가 달라 동시에 띄워도 충돌하지 않는다.

> ⚠️ **3020 은 흔히 겹친다.** 같은 구조에서 분기한 `deleo-one-ui` 의 `apps/ui-docs` 도 3020 을 쓴다.
> 그쪽을 띄워 둔 상태면 `EADDRINUSE: address already in use :::3020` 로 기동에 실패한다.
> 브라우저에 화면이 보이더라도 타이틀이 `@deleo/ui 컴포넌트 문서` 면 **다른 프로젝트를 보고 있는 것**이다
> — 이 앱의 타이틀은 `@hvy/ui 컴포넌트 문서`다. `PORT=3021` 로 띄우거나 `lsof -nP -iTCP:3020 -sTCP:LISTEN` 으로 점유 프로세스를 확인한다.

이 앱의 워크스페이스 의존은 `@hvy/ui` 하나뿐이다. 그래서 **이 앱이 뜬다는 사실 자체가 UI 계층이 프레임워크에 오염되지 않았다는 증명**이 된다 (`packages/ui/README.md` 의 설계 의도).

### 화면 구조

| URL                  | 내용                                                            |
|----------------------|-----------------------------------------------------------------|
| `/`                  | 배럴 export 전수 갤러리 — `@hvy/ui` 가 무엇을 내보내는지 한눈에 |
| `/[category]/[slug]` | 개별 컴포넌트 문서 (Preview / Code / Props 탭)                  |

사이드바 목차는 `src/app/_docs/registry.ts` 의 `DOCS` 배열에서 파생된다 — 등록 순서가 곧 표시 순서다. Code 탭에 보이는 코드는 데모 파일 원문을 fs 로 읽어 공급하므로 **보이는 코드 = 실행되는 코드**다.

### 테마 전환

우상단 셀렉트 또는 URL `?theme=` 로 전환한다. 사용 가능한 값 4종:

| 값          | 내용                                      |
|-------------|-------------------------------------------|
| `default`   | 기본 테마 (URL 에 query 를 남기지 않는다) |
| `compact`   | 조밀 배치                                 |
| `blog`      | 블로그 라이트                             |
| `blog-dark` | 블로그 다크                               |

```
http://localhost:3020/?theme=blog-dark
```

### @hvy/ui 를 고치면서 확인하기

`packages/ui/src` 를 수정하면 dist 빌드 없이 즉시 HMR 된다 (`transpilePackages`). 컴포넌트를 손볼 때는 blog 대신 ui-docs 를 띄워 두는 편이 빠르다 — 백엔드 의존이 없고 데모가 이미 다 있다.

새 문서를 추가하는 방법 (정의 파일 1개 + registry import 1줄)은 → [apps/ui-docs/README.md](../apps/ui-docs/README.md).

---

## 6. 검증 명령

| 명령                 | 내용                                                                                         |
|----------------------|----------------------------------------------------------------------------------------------|
| `pnpm check`         | Biome 린트·포맷 검사 (ESLint 대체). 자동 수정은 `pnpm check:fix`                             |
| `pnpm typecheck`     | 전 워크스페이스 `tsc --noEmit` 병렬 실행                                                     |
| `pnpm test`          | vitest — `packages/**` 와 `apps/**/*.test.ts` (환경 `node`, DOM 없음)                        |
| `pnpm test:blog`     | `apps/blog` 유틸 테스트 — vitest 가 아니라 `node --test` 로 `.test.js` 스위트를 돈다         |
| `pnpm verify:tokens` | 디자인 토큰 강제 — hex·색함수·Tailwind 기본 팔레트·명세 밖 font-weight·미정의 토큰 참조 검사 |
| `pnpm build`         | `apps/blog` 프로덕션 빌드 (`output: 'standalone'`)                                           |
| `pnpm verify`        | 위 전부 일괄 — PR 전 게이트                                                                  |

`pnpm verify:tokens` 는 `bg-dl-primry` 같은 **오타 토큰**을 잡는 것이 핵심이다. Tailwind 는 미정의 유틸리티를 조용히 버려서 CSS 가 한 줄도 안 나오고 화면만 어긋난다.

---

## 7. 트러블슈팅

| 증상                                                              | 원인·해결                                                                                            |
|-------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `apps/blog` 에서 `pnpm install` 이 실패                           | `catalog:` · `workspace:*` 는 루트에서만 해석된다. 루트로 올라가 설치                                |
| 클론 직후 `node_modules` 가 없다                                  | 정상. `pnpm install` 부터 시작                                                                       |
| `Ignored build scripts` 경고                                      | 정상. `allowBuilds` 의 명시적 판단 결과                                                              |
| 목을 켰는데 실 백엔드를 호출한다                                  | ① `mocks/` 수정 후 dev 서버 재시작 누락 ② admin 경로 요청(목 미커버 → bypass)                        |
| `MOCK_DOWNSTREAM 은 'true' \| 'false' 만 허용합니다` 로 기동 실패 | 오타. 의도된 실패다                                                                                  |
| `EADDRINUSE: address already in use :::3020`                      | 다른 프로젝트(예: `deleo-one-ui` 의 ui-docs)가 같은 포트를 쓴다. `PORT=3021 pnpm dev:docs` 로 우회   |
| ui-docs 화면이 내 수정과 다르다                                   | 타이틀 확인. `@deleo/ui 컴포넌트 문서` 면 다른 프로젝트다                                            |
| 포트 정리                                                         | blog 3000 / ui-docs 3020 / 디버거 9229. 점유 확인은 `lsof -nP -iTCP:3020 -sTCP:LISTEN`               |
| pnpm 버전 불일치 경고                                             | `npm i -g pnpm@11.20.0`                                                                              |
| standalone 산출물 경로를 못 찾겠다                                | 모노레포화로 한 단계 깊어졌다: `apps/blog/.next/standalone/apps/blog/server.js` (Dockerfile 과 동일) |

---

## 치트시트

```shell
# 최초 1회
nvm use && npm i -g pnpm@11.20.0
cd blog-nextjs && pnpm install

# 일상 개발
pnpm dev                              # blog          :3000 (원격 백엔드)
MOCK_DOWNSTREAM=true pnpm dev         # blog + MSW 목  :3000 (백엔드 불필요)
BLOG_URL_DEV=http://localhost:9090 pnpm dev   # blog + 로컬 hvy-blog
pnpm dev:docs                         # ui-docs       :3020

# 커밋 전
pnpm check:fix && pnpm verify
```
