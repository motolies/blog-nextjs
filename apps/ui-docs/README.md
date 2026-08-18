# apps/ui-docs

`@hvy/ui` 디자인 시스템의 문서·데모 앱 — **로컬 전용**(포트 3020, Docker 미포함).

## 왜 Storybook이 아닌가

Tailwind 4의 `@source`가 워크스페이스 패키지(packages/ui/src)를 스캔하는 파이프라인을
Storybook이 재현하지 못한다. 이 앱은 실제 Next 앱이라 `theme.css`의
`@import '@hvy/ui/theme/*.css'` + `@source` 조합을 프로덕션과 동일하게 태운다 —
이 앱이 빌드된다는 것 자체가 `@hvy/ui` 프레임워크 중립성의 살아있는 증명이다
(워크스페이스 의존이 `@hvy/ui` 하나뿐).

## 구조 — 레지스트리 파생

라우트 파일은 3개뿐이고 문서 전체가 `src/app/_docs/registry.ts`의 `DOCS` 배열에서 파생된다.

```
src/app/_docs/<name>.tsx        문서 정의 (메타 + 데모 참조 + props 표) — 'use client' 금지
src/app/_docs/registry.ts       DOCS 배열 — 등록 순서가 사이드바 순서
src/client/ui-test/docs/demos/  실행되는 데모 ('use client')
src/server/ui-test/demo-source.ts  데모 원문을 fs로 읽어 Code 탭에 공급 (보이는 코드 = 실행되는 코드)
```

**새 문서 추가 = 정의 파일 1개 + registry import 1줄.** props 표는 `definePropRows<P>()`로
실제 Props 타입의 keyof를 강제해 표의 부패를 typecheck가 잡는다.
`registry.test.ts`(vitest)가 데모 파일 실존·slug 유일성·EXPORT_INFO href 유효성을 검사한다.

## 실행

```shell
pnpm dev:docs              # = pnpm -F ui-docs dev, :3020
pnpm -F ui-docs typecheck
```

테마 전환은 우상단 셀렉트 또는 `?theme=` 쿼리 — `default` · `compact` · `blog` · `blog-dark`
(목록의 진실 소스는 `src/shared/theme.ts` 의 `THEMES`).

로컬 개발 절차 전반은 [로컬 개발 가이드](../../docs/local-development.md) 참고.

## 원본과의 차이 (deleo-one-ui apps/ui-docs 에서 분기)

- 패키지명 `@deleo/ui` → `@hvy/ui`, oms 테마 제거 (blog·blog-dark 테마 추가)
- 아이콘 문서·데모를 lucide 전달형 `<Icon icon={X}>` 기준으로 재작성 — 데모의 QA 아이콘
  이름도 lucide 로 치환(save→Save, delete→Trash2, question→CircleHelp 등)
- blog 추가 문서 2종: accordion·combobox (원본에 없음)
- 원본 문서 37종 전체 동기화(2026-08 HEAD) — work-tabs 포함(worktabs 이식 완료),
  number-input·file-upload·기간 피커 2종·checkbox-group·stat-tile·form-section·
  dropdown-menu·inline-notice·table 신규 유입
- Dockerfile·docker-compose 미이식 (blog 는 ui-docs 를 배포하지 않는다 — 로컬 전용)
- 데모 샘플 데이터의 주문 도메인 어휘는 동작 무관이라 유지 — 블로그 도메인 교체는 후속 과제
