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
`registry.test.ts`(vitest)가 데모 파일 실존·slug 유일성·EXPORT_INFO href 유효성에 더해
**barrel 의 런타임 export 전량이 EXPORT_INFO 에 등록됐는지**를 검사한다 — 개요 화면의
"데모 없음" 배지는 사람이 볼 때만 드러나기 때문이다(worktabs 10종이 배지를 단 채 방치된 적이 있다).

## 데모 목데이터 — 숫자에 의도가 있다

`src/client/ui-test/mock-posts.ts` 가 그리드·결합 시나리오 데모의 공용 데이터다.
값은 전부 **인덱스에서 파생**한다 — `Math.random()`·`Date.now()` 를 쓰면 서버 렌더와
클라이언트 하이드레이션이 다른 값을 만들어 hydration mismatch 가 난다.
(같은 함정이 `new Date(y,m,d)` + `toISOString()`, `Intl...resolvedOptions().timeZone`
처럼 **환경에 따라 갈리는 계산** 전반에 있다 — 필요하면 마운트 후에 계산한다.)

아래 숫자는 임의값이 아니라 검증 장치다. **줄이거나 늘리면 데모가 확인하던 동작이 사라진다.**

| 숫자 | 이유 |
| --- | --- |
| 게시글 57건 | 페이지당 20건 기준 3페이지 + **부분 끝 페이지**(17건) → Pager 경계 동작이 눈에 보인다 |
| 태그 12종 | `searchThreshold`(10) 초과 — 셀 편집기 안에서도 검색 입력이 붙는다 |
| 첫 행 태그 7개 | 선택 요약(칩)은 문턱 없이 1개부터 붙지만, 칩이 **줄바꿈될 만큼** 있어야 요약 영역의 감김·스크롤이 열자마자 보인다 |
| 편집 데모 30건 | 스크롤이 생겨 "가상 스크롤로 밀려난 에디터의 커밋 유지"를 확인할 수 있다 |
| 상태 5종 | `Badge` 의 tone 유니온 5종(neutral·primary·success·warning·danger)과 **1:1** |
| 작성자 8명 · 카테고리 3종 | 주기가 서로소라 세 축의 조합이 한쪽으로 쏠리지 않는다 |
| 조회수 `12000 + (i % 9) * 3500` | 9주기 변화 — 천단위 구분자와 우측 정렬을 같은 열에서 대조한다 |
| 태그 절반이 value ≠ label | view 모드가 "코드가 아니라 라벨을 그린다"를 눈으로 증명하는 조건 |

도메인 어휘를 또 바꾸게 되면 **어휘만 갈아끼우고 이 표의 관계는 보존**한다.

## 플레이그라운드 컨트롤

`src/client/ui-test/playground.tsx` 가 컨트롤 6종(`EnumControl`·`BoolControl`·`TextControl`·
`NumberControl`·`MultiEnumControl`·`ControlGroup`)과 레이아웃(`PlaygroundGrid`)을 준다.
컨트롤 자체를 `@hvy/ui` 로 만드는 **도그푸딩**이고, 무엇을 쓸 수 있고 슬라이더를 왜 두지 않는지는
그 파일 머리말이 정본이다.

코드 스니펫은 `src/client/ui-test/code-snippet.ts` 의 `jsxTag()` 가 조립한다 —
**props 객체가 바로 아래 실제 JSX 의 거울**이라 둘을 눈으로 대조할 수 있다.
규칙(false·undefined 는 사라진다, `expr()` 은 중괄호, 72자 넘으면 줄바꿈)은
`code-snippet.test.ts` 가 고정한다.

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
- blog 추가 문서 5종: accordion · combobox · calendar · column-settings ·
  list-reorder(foundations) — 원본에 없음
- 원본 문서 37종 전체 동기화(2026-08 HEAD) — work-tabs 포함(worktabs 이식 완료),
  number-input·file-upload·기간 피커 2종·checkbox-group·stat-tile·form-section·
  dropdown-menu·inline-notice·table 신규 유입
- Dockerfile·docker-compose 미이식 (blog 는 ui-docs 를 배포하지 않는다 — 로컬 전용)
- 데모 샘플 데이터를 **블로그 도메인으로 전면 교체** — 게시글·카테고리·태그·작성자 기준
  (`src/client/ui-test/mock-posts.ts`). 데이터의 **숫자와 임계값 관계는 원본 그대로**다(아래 절)
