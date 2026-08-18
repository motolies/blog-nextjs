# @hvy/ui

shadcn 방식 헤드리스 컴포넌트 + 기본 테마 — **프레임워크 중립 UI 계층.**
deleo-one-ui 의 `@deleo/ui` 에서 분기했다 (2026-08 원본 HEAD 기준 동기화 유지 — 하단 "원본과의 차이" 참조).

## 왜 별도 패키지인가

의존은 radix·cva·clsx·react-virtual·lucide (peer)뿐이고 `next/*`, `@tanstack/react-query`, axios 를 **import 하지 않는다** — 그래야 다른 앱이 UI만 가져다 쓸 수 있다. 데이터 계층 배선 (HTTP 호출·URL 상태)은 앱 (apps/blog)이 맡는다.

의존이 `@hvy/ui` 하나뿐인 [`apps/ui-docs`](../../apps/ui-docs/README.md)가 이 중립성의 살아있는 증명이다 — 그 앱이 빌드되는 한 중립성은 유지되고 있다.

## 여기 두는 것 / 두면 안 되는 것 — Primitive vs Composite

접근성·포커스 트랩·키보드 조작·가상 스크롤처럼 **틀리면 조용히 위험하거나 어려운** 코드만 중앙 관리한다 (Primitive). 화면 조합물 (검색 폼, 상세 패널 등)은 앱이 소유하고 자유롭게 수정한다 (Composite).

판정 실례: `apps/blog/src/components/common/BlogDataGrid.tsx` — 서버 fetch·검색 파라미터·클라 정렬은 앱이 갖고, 표·컬럼 설정·선택·편집은 여기 것을 쓴다. **그것들을 데이터 계층에 배선하는 일**만 앱이 한다.

| 디렉터리 | 내용 |
|---|---|
| `src/components/` | 버튼·셀렉트·데이트피커·파일업로드·숫자입력·토스트 등 29종 + blog 추가 2종(Accordion·Combobox). **표는 셋으로 가른다**: 수백 행 조회·서버 페이징은 `DataGrid`, 라벨·값 쌍 상세 폼은 `FormGrid`, 열 머리가 있는 5~20행 참조 데이터만 정적 `Table` 이다. 지속 안내 배너는 `InlineNotice`(토스트=휘발·ErrorState=전면 대체와 다른 층), 행 액션·오버플로 메뉴는 `DropdownMenu`(내비게이션 금지 — 아이템이 하나뿐이면 패널을 열지 않고 트리거가 그대로 그 아이템의 버튼이 된다), 상세 폼 섹션 3중주(Card+CardHeader+FormGrid)는 `FormSection` 이 흡수한다. 기간 프리셋 산식은 `presetRange`(datePresets.ts) 가 중앙 소유한다 — 라벨은 앱이 붙인다. 모달은 Confirm/Content/Picker **3유형** — 규격이 서로 달라 아무거나 골라 쓰면 명세와 어긋난다. Confirm 창은 훅이 둘로 갈린다: 취소+확인은 `useConfirm()`, 취소 없는 단일 버튼 알림은 `useAlert()` 다. 상세 폼은 `FormGrid` + `Field`/`FieldValue` |
| `src/grid/` | DataGrid(가상 스크롤)·TreeGrid·툴바·컬럼 설정·인라인 편집·빈 상태(GridEmptyOverlay)·밀도 5단(gridDensity). 순수 로직(`columnLayout.ts`·`gridEditing.ts`)은 React 무의존 — vitest 환경이 node(DOM 없음)라 **여기 있는 것만 단위 테스트가 가능**하다 |
| `src/worktabs/` | 작업 탭 바 — **밀집 카드 탭**(IDE 관례). 그리드 탭(`components/tabs.tsx`, 밑줄형)과는 한 화면에 함께 나올 수 있어 시각 언어를 합치지 않는다. 순수 상태 계산(`workTabsState.ts`, 테스트 있음) + 오버플로/드래그/컨텍스트 메뉴. URL·라우터는 앱이 배선한다 |
| `src/icons/` | lucide-react 전달형 래퍼 `<Icon icon={X} size>` — 크기 토큰(size-dl-ic-*)과 a11y 규약만 강제. 문자열 레지스트리 없음(트리셰이킹 유지) |
| `src/theme/` | 토큰 원본(`default.css`)과 테마 파일들 — 레포에서 hex가 허용되는 **유일한 예외 지점** |
| `src/lib/` · `src/dnd/` · `src/form/` | `cn`·`useTokenPx` 등 유틸, 리스트 재정렬, 폼 오류 포커스 |

## 규칙

| 규칙 | 왜 | 강제 수단 |
|---|---|---|
| `next/*`·react-query·axios import 금지 | 프레임워크 중립이 깨지면 어느 앱에도 이식 불가 | `biome.json` noRestrictedImports |
| 컴포넌트에 hex/rgb 리터럴·Tailwind 기본 팔레트(`bg-black` 등)·명세 밖 font-weight 금지 | 런타임 테마 주입이 불가능해진다. 실제 유출 경로는 hex보다 기본 팔레트 유틸이었다 | `pnpm verify:tokens` — 예외는 `src/theme/**`뿐 |
| 테마 = Tier 1 재정의뿐 — 색 33키 + 스케일 5키(`--dl-scale-*`) = 38키 | 사이즈 축은 Tier 2가 스케일에서 calc로 유도한다 — 개별 치수를 테마에 넣으면 공식과 어긋난 값이 조용히 생긴다 | verify:tokens 키 집합 동일성 검사 |
| 브랜드 채움 위 **글자**는 `-fg`, 같은 자리의 **도형**(체크·라디오 점·knob)은 `-mark`, 밝은 표면 위 브랜드색 글자는 `-ink` | 글자는 읽어야 하고 도형은 형태만 보이면 된다(WCAG 도 4.5:1 vs 3:1) | verify:tokens WCAG 대비 검사(래칫 기준선 포함) |
| JS가 숫자로 알아야 하는 값(그리드 행 높이 등)은 `useTokenPx()`로 토큰에서 읽기 | 숫자를 코드에 박으면 테마를 바꿔도 화면이 안 바뀐다 | 리뷰 |

토큰 구조 (2티어)·테마 작성법의 정본은 [`src/theme/default.css`](src/theme/default.css) 헤더 주석이다.

### 폼 컨트롤 상태 계약 (mode · lock · masking)

폼 컨트롤 전원이 따르는 계약이다 — **새 컨트롤을 추가하면 아래 의무를 전부 이행해야 한다.** 합성 규칙의 코드 정본은 `src/components/fieldState.ts`, 타입 회귀 방어는 `contract.test.tsx`.

**상태 축은 셋이고 서로 직교한다:**

| 축 | 타입 | 의미 | FormData | 배색 |
|---|---|---|---|---|
| `mode` | `'edit' \| 'view' \| 'disabled'` | 폼 상태. **비활성 표기는 이 축 하나다** — 컨트롤의 `disabled` boolean prop 은 타입에서 제거됐다 | edit O · view X(DOM 없음) · disabled X(네이티브 규약) | disabled → `dl-field-locked` |
| `lock` | `boolean` | 시스템 채움 **영구 불변** — **모든 mode 를 이긴다** | **O** (readOnly — 값 전송·복사 O) | `dl-field-locked` + 자물쇠 아이콘 + 안내문 재표시 |
| `masking` | `boolean` (Input·Textarea 만) | **서버가 이미 마스킹해 내려준** 개인정보 값 선언 | **X** (`name` 미전달 — 마스킹값 저장 사고의 구조적 방어) | `dl-field-locked` + `dl-field-masked`(기울임) |

- **병합**: 컨트롤 명시 `mode` prop > `Field` > `FormMode` > `'edit'` — 폼이 view/disabled 여도 특정 칸만 `mode="edit"` 로 살릴 수 있다. 컨트롤은 `useFieldControl()` 이 돌려주는 `state` 하나로 렌더한다.
- **data 속성 계약**: 컨트롤 루트가 `data-mode` 를, lock 이면 `data-locked`, masking 이면 `data-masked` 를 방출한다.
- **어도먼트**: `Input` 은 `prefix`/`suffix` 와 `clearable`(×) 을 받는다. 우측 슬롯 우선순위는 자물쇠 > × > suffix, 최대 2슬롯. `Select`·`MultiSelect`·`DatePicker`·`DateTimePicker` 도 `clearable` 을 받는다(Range 2종은 과밀이라 제외). `Input` 의 `clearable` 은 제어형 전용.
- **`FormMode` 는 폼에만 감는다** — 그리드 크롬은 내부에서 edit 로 핀되어 있다. `Button` 은 모드를 소비하지 않는다 — "다시 편집" 버튼이 잠기면 빠져나올 수 없다.
- 읽기 전용 축은 넷이고 서로 직교한다: `FieldValue` · `lock` · `masking` · `mode`. 정의 원문은 `fieldState.ts`·`form-mode.tsx`·`field.tsx` 헤더 주석.

## 진입점과 소비자

| export | 내용 |
|---|---|
| `.` | 컴포넌트·그리드·아이콘·훅 배럴 |
| `./theme/*.css` | 테마 파일 — 앱이 `@import` + `<html data-theme="...">` 두 가지 모두 필요 |

deps: `radix-ui`·`class-variance-authority`·`clsx`·`tailwind-merge` / peer: `react`·`react-dom`·`@tanstack/react-virtual`·`lucide-react`. 소비자: `apps/blog`, `apps/ui-docs`.

- 컴포넌트 문서·데모·화면 대조: `pnpm dev:docs` → :3020 ([apps/ui-docs](../../apps/ui-docs/README.md)).

## 원본과의 차이 (deleo-one-ui `@deleo/ui` 에서 분기)

- **아이콘**: 자체 스프라이트 42종 대신 lucide-react 전달형(`<Icon icon={X}>`) — 앱이 이미 lucide 81종을 직접 쓴다. `Button.icon`·`IconButton.icon`·`Tab.icon`·`DropdownMenuItem.icon`·`GridEmpty.icon`·`ColumnDef.rowAction.icon` 이 전부 `LucideIcon` 타입이다. `ICON_NAMES` 레지스트리 미export.
- **테마**: `oms.css` 미이식. 대신 `blog.css`(라이트, 파랑 브랜드)·`blog-dark.css`(One Dark 계열, 중립 램프 역전 + 채움 위 어두운 글자) 2종 추가.
- **blog 추가 컴포넌트**: `Accordion`(조합형 4파트), `Combobox`(피커형 — onPick 콜백), Button `ghost` variant(hover 공통 규칙의 유일한 예외 — button.test.ts 에 못 박음).
- **DataGrid 확장**: `onRowActivate`(행 클릭 보조 열기)·`rowClassName`·`maxHeight: number | 'auto'`.
- **미이식**: 원본의 `verify:boundaries`·GritQL raw 폼 요소 금지 규칙(앱 코드가 아직 raw 요소를 씀), `useWorkTabsPreference`(원본에서도 index 미export).
