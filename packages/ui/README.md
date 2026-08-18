# @hvy/ui

shadcn 방식 헤드리스 컴포넌트 + 기본 테마 — **프레임워크 중립 UI 계층.**
deleo-one-ui 의 `@deleo/ui` 에서 분기했다 (worktabs 제외, 아이콘은 lucide 전달형으로 개조).

## 왜 별도 패키지인가

의존은 radix·cva·clsx·react-virtual·lucide(peer)뿐이고 `next/*`, `@tanstack/react-query`, axios 를
**import 하지 않는다** — 그래야 다른 앱이 UI만 가져다 쓸 수 있다.
데이터 계층 배선(HTTP 호출·URL 상태)은 앱(apps/blog)이 맡는다.

의존이 `@hvy/ui` 하나뿐인 [`apps/ui-docs`](../../apps/ui-docs/README.md)가 이 중립성의
살아있는 증명이다 — 그 앱이 빌드되는 한 중립성은 유지되고 있다.

## 여기 두는 것 / 두면 안 되는 것 — Primitive vs Composite

접근성·포커스 트랩·키보드 조작·가상 스크롤처럼 **틀리면 조용히 위험하거나 어려운** 코드만
중앙 관리한다(Primitive). 화면 조합물(검색 폼, 상세 패널 등)은 앱이 소유하고 자유롭게 수정한다(Composite).

| 디렉터리 | 내용 |
|---|---|
| `src/components/` | 버튼·셀렉트·데이트피커·토스트 등 22종. 모달은 Confirm/Content/Picker **3유형** — 규격이 서로 달라 아무거나 골라 쓰면 명세와 어긋난다. 상세 폼은 `FormGrid` + `Field`/`FieldValue` |
| `src/grid/` | DataGrid(가상 스크롤)·TreeGrid·툴바·컬럼 설정·인라인 편집. 순수 로직(`columnLayout.ts`·`gridEditing.ts`)은 React 무의존 — vitest 환경이 node(DOM 없음)라 **여기 있는 것만 단위 테스트가 가능**하다 |
| `src/icons/` | lucide-react 전달형 래퍼 `<Icon icon={X} size>` — 크기 토큰(size-dl-ic-*)과 a11y 규약만 강제. 문자열 레지스트리 없음(트리셰이킹 유지) |
| `src/theme/` | 토큰 원본(`default.css`)과 테마 파일들 — 레포에서 hex가 허용되는 **유일한 예외 지점** |
| `src/lib/` · `src/dnd/` · `src/form/` | `cn`·`useTokenPx` 등 유틸, 리스트 재정렬, 폼 오류 포커스 |

## 규칙

| 규칙 | 왜 | 강제 수단 |
|---|---|---|
| `next/*`·react-query·axios import 금지 | 프레임워크 중립이 깨지면 어느 앱에도 이식 불가 | `biome.json` noRestrictedImports |
| 컴포넌트에 hex/rgb 리터럴·Tailwind 기본 팔레트(`bg-black` 등)·명세 밖 font-weight 금지 | 런타임 테마 주입이 불가능해진다 | `pnpm verify:tokens` — 예외는 `src/theme/**`뿐 |
| 테마 = Tier 1 재정의뿐 — 색 26키 + 스케일 5키(`--dl-scale-*`) = 31키 | 사이즈 축은 Tier 2가 스케일에서 calc로 유도한다 | verify:tokens 키 집합 동일성 검사 |
| JS가 숫자로 알아야 하는 값(그리드 행 높이 등)은 `useTokenPx()`로 토큰에서 읽기 | 숫자를 코드에 박으면 테마를 바꿔도 화면이 안 바뀐다 | 리뷰 |

토큰 구조(2티어)·테마 작성법의 정본은 [`src/theme/default.css`](src/theme/default.css) 헤더 주석이다.
폼 컨트롤 3모드(FieldMode) 계약의 정본은 `src/components/form-mode.tsx`·`field.tsx` 헤더 주석이다.

## 진입점과 소비자

| export | 내용 |
|---|---|
| `.` | 컴포넌트·그리드·아이콘·훅 배럴 |
| `./theme/*.css` | 테마 파일 — 앱이 `@import` + `<html data-theme="...">` 두 가지 모두 필요 |

deps: `radix-ui`·`class-variance-authority`·`clsx`·`tailwind-merge` /
peer: `react`·`react-dom`·`@tanstack/react-virtual`·`lucide-react`.
소비자: `apps/blog`(Gate 3 이후), `apps/ui-docs`.

- 컴포넌트 문서·데모·화면 대조: `pnpm dev:docs` → :3020 ([apps/ui-docs](../../apps/ui-docs/README.md)).
- 원본과의 차이: worktabs 미이식(블로그에 해당 UI 없음), oms.css 미이식, 아이콘 스프라이트 → lucide 전달형.
