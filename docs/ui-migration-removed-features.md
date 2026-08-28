# @hvy/ui 마이그레이션에서 제거된 기능

2026-08-21, apps/blog 의 마이그레이션 호환 래퍼들을 제거하고 `@hvy/ui`(packages/ui) 직접 사용으로
전환하면서, **@hvy/ui 에 대응물이 없어 함께 제거된 기능**의 목록이다. 재구현이 필요해지면
이 문서의 "재구현 시 참고" 항목(마지막 구현이 있던 파일·삭제 커밋)에서 원본을 복원할 수 있다.

각 항목: **무엇이 제거됐나 / 원래 어디서 쓰였나 / 재구현 시 참고**

---

## 1. 트리 검색어 필터링 (+ 페이지 상단 트리 검색바) — **재구현 완료**

- **제거됐던 것**: 트리 노드 검색어 필터링(`searchQuery`/`searchFields`), 매칭 노드 하이라이트(노란 배경),
  매칭 자손을 가진 조상 노드 표시 유지 로직. 이에 따라 `/admin/master-code` 와 `/admin/categories`
  페이지 상단의 트리 검색바도 함께 제거됐다.
- **사용처**: `components/master-code/MasterCodePage.tsx`, `pages/admin/categories.tsx`
- **현재**: 위 권고대로 앱 계층에 재구현했다 — `lib/treeSearch.ts`(순수 필터·매칭 분할, 단위 테스트 있음)
  + `hooks/useTreeSearch.ts`(검색어·펼침 상태) + `components/common/tree/`(검색바·글자 강조).
  앱이 `nodes` 를 필터링해 `TreeGrid` 에 넘긴다.
  구 구현과 다른 점 둘: 하이라이트가 행 배경이 아니라 **일치 글자만** 칠하고(`bg-dl-warning-bg` —
  구 `bg-yellow-500/8` 은 이제 verify-tokens 에 걸린다), 항상-펼침 대신 **검색 중에만** 결과 경로를
  펼친다(사용자가 접어 둔 상태는 검색어를 지우면 그대로 돌아온다).

## 2. 트리 3상태 체크박스

- **제거**: `checkable`/`checkedIds`/`onCheckedChange` — checked/unchecked/indeterminate 전파
  (`computeCheckState`·`buildCheckStateMap`·`getAllDescendantIds`).
- **사용처**: **0곳** — 마이그레이션 시점에 이미 죽은 기능이었다.
- **재구현 시 참고**: 위와 동일한 tree-view.tsx.

## 3. 트리 "항상 펼침" 모드

- **제거**: `collapsible={false}` (화살표 숨김 + 전체 항상 펼침).
- **대체**: 초기 로드 시 전체 id 를 `expanded` Set 에 수집(= 전체 펼침 상태로 시작) + 접기 가능.
  화살표가 보이고 사용자가 접을 수 있게 되는 **동작 변화**가 있다.
- **사용처**: MasterCodeTree, CategoryTreeView (두 곳 모두 항상-펼침으로 쓰고 있었다).

## 4. 트리 렌더 슬롯·유틸 축소

- **제거**: `renderLabel`/`renderIcon`/`renderBadge`/`nodeClassName` 4슬롯 분해,
  `getNodeId`/`getNodeChildren` 커스터마이징(→ `children` 프로퍼티·string id 고정),
  `getExpandedIdsToDepth(depth)` 깊이 제한 펼침(실사용은 Infinity 뿐이라 전체 수집으로 대체),
  좌측 세로 가이드라인·hover 시 x-이동 등 시각 요소, `emptyMessage` 문구형 빈 상태(→ `GridEmpty` 계약).
- **대체**: `TreeGrid` 의 `renderRow(node, depth)` 단일 슬롯에서 앱이 인라인 조합.

## 5. confirm 다이얼로그의 icon / title 헤더

- **제거**: 확인 모달의 아이콘·제목 줄(`icon`/`iconClassName`/`title` props).
  @hvy/ui QA alert 규격은 헤더 없이 본문(message)만 둔다. 래퍼 시절에도 이미
  `@deprecated` 로 받기만 하고 버려지던 값이라 화면 변화는 없다.
- **사용처(표기만 남아 있던 곳)**: PostModifyComponent(LogOut/Undo2), MasterCodePage(RefreshCw),
  DeleteConfirm 프리셋(CircleAlert), PublicConfirm 프리셋(AlertTriangle).
- **동작 변화**: `useConfirm()` promise 방식 전환으로 모달 위 모달 요청은 자동 거절(false)된다 —
  현 화면에는 동시 트리거 경로가 없어 실사용 영향 없음.
- **재구현 시 참고**: `apps/blog/src/components/confirm/ConfirmDialog.tsx` (삭제 커밋 c13851d 의 부모).

## 6. Skeleton 로딩 플레이스홀더

- **제거**: 자리-흉내(skeleton) 로딩 UX → @hvy/ui `Spinner`(불확정 인디케이터)로 대체.
- **사용처**: `/admin/master-code`(트리 로딩). `/admin/sprint`(3블록)·`/admin/stats`(카드 5+차트)도
  사용처였으나 **두 화면 자체가 삭제됐다**(→ 11번 항목).
- **재구현 시 참고**: `apps/blog/src/components/ui/skeleton.tsx` (13줄 — `animate-pulse` div).
  재구현한다면 hex 금지 규칙에 맞춰 `bg-dl-option-hover` 등 dl 토큰으로.

## 7. BlogDataGrid 어댑터의 미승계 props

구 ShadcnDataTable 표면을 유지하던 673줄 어댑터(`BlogDataGrid.tsx`, 삭제 커밋 3bc3331 의 부모)를
해체하면서 아래 props 는 대응물 없이 소멸했다. 데이터 배선(서버 페이징·레이스 가드·검색 정리)은
`lib/gridSearch.ts`·`hooks/useServerGrid.ts`·`hooks/useClientGrid.ts`·
`components/common/grid/` 로 재구성됐다.

| 제거된 prop | 비고 |
|---|---|
| `density` | 밀도는 dl-scale 테마 축이 가져갔다 (DataGrid `density` prop 은 별개로 존재) |
| `mobileCardView` + 컬럼의 `mobilePrimary`/`mobileHidden`/`mobileLabel` | 모바일 카드 뷰 — admin 은 데스크톱 중심이라 승계 안 함 |
| `enableColumnReorder` | 컬럼 순서는 ColumnSettingsDialog 가 가져갔다 |
| `renderToolbar` | GridToolbar 조립(`GridPagingBar`)로 대체 |
| `headerAlign`/`footerAlign` | ColumnDef 에 없음 — `align` 하나로 통일 |
| `getRowId(row, index)` 의 index 인자·`JSON.stringify` 폴백 | 전 페이지가 `String(row.id)` 명시 |
| `summaryRow` (표 밖 칩 목록) | DataGrid 네이티브 `footer={{cells}}` sticky 합계행으로 **대체** — 시각 변화 있음 |

## 8. admin 전용 shadcn 팔레트 재정의

- **제거**: `global.css` 의 admin 전용 HSL 재정의(`--primary: 209 91% 46%` ≈ #0b76e0 등
  라이트/다크 각 19키)와 레거시 shadcn 토큰 전체(`--background`·`--muted`… + `@theme inline` 브리지).
- **대체**: dl 단일 팔레트(`--color-dl-*`). admin 의 primary 가 #0b76e0 → #1f8bea 로 미세하게 밝아지고,
  다크의 보조 텍스트(`text-dl-fg-muted` #9da5b4)가 구 `muted-foreground`(#6b7280)보다 밝아진다(대비 개선 방향).
- **보존**: 구 `--radius`(1rem) 파생 rounded-md/lg/xl/2xl 스케일은 리터럴로 고정해 모서리 시각을 유지했고,
  색 없는 `border` 유틸리티의 기본색은 `border-color: var(--color-dl-border)` 유니버설 규칙이 잇는다.

## 9. shadcn data-slot 오버라이드 (원래도 죽은 코드)

- **제거**: `global.css` 의 `[data-slot="…"]` 셀렉터 라이트/다크 오버라이드 약 160줄.
- **비고**: @hvy/ui 는 `data-slot` 속성을 방출하지 않아 **마이그레이션 시점에 이미 아무 DOM 에도
  매치되지 않던** 규칙이었다. 기록 목적으로만 남긴다 — 재구현 대상 아님.

## 10. 유지 판정 (제거하지 않은 것과 그 사유)

- **`editor/FileUploadComponent.tsx`**: @hvy/ui `FileUpload` 는 단일 파일(`File | null`)·폼 필드형
  (파일명 박스+버튼) 계약이다. 이 컴포넌트는 `multiple` + 선택 즉시 업로드하는 버튼형이라 계약이
  달라 교체하지 않았다. 이미 @hvy/ui Button 기반이라 shadcn 잔재도 아니다.
- **`post/PostPreviewDialog.tsx`**: 래퍼가 아니라 sanitize 로직을 가진 앱 조합물(Composite).
- **`common/DynamicSearchFields.tsx`**: 앱 소유 검색 폼 Composite — @hvy/ui DateRangePicker 직결,
  Enter 검색 내재화, shadcn 센티널 리네임(`__SELECT_EMPTY__`) 등 정비 후 유지.
- **새 grid 헬퍼들**(`gridSearch`/`useServerGrid`/`useClientGrid`/`GridPagingBar`/`useGridSettings`):
  packages/ui README 의 Primitive/Composite 원칙상 "데이터 계층 배선"은 앱 소유가 맞다 —
  어댑터가 아니라 @hvy/ui 타입을 직접 노출하는 앱 컴포지트다.

## 11. `/admin/stats` · `/admin/sprint` 화면 삭제

2026-08-21 추가분. 위 1~10번이 "컨트롤 교체 과정에서 대응물이 없어 빠진 기능"이라면,
이 항목은 **화면 단위 삭제**다.

- **제거**: 관리자 화면 2개와 그 전용 코드.

  | 화면 | 내용 |
  |---|---|
  | `/admin/stats` | 요약 카드 5종(총 포스트·총 조회수·오늘 조회수·카테고리·태그), 일별 조회수 추이(line), 카테고리 분포(pie), 태그 분포 Top 20(bar), 인기 포스트 Top 10 표 |
  | `/admin/sprint` | 연도별 스프린트 스토리포인트 차트, 작업자×스프린트 집계표, 이슈 드릴다운 목록 |

- **함께 삭제된 것**: `service/statsService.ts` · `service/sprintService.ts` ·
  `types/stats.ts` · `types/sprint.ts` · `package.json` 의 `echarts`·`echarts-for-react`
  (두 화면이 유일한 사용처였다). 사이드바 Operations 그룹 2항목, `adminRouteMeta` 2키,
  대시보드 Quick Access 2항목, 대시보드 통계 카드 "업무 흐름"도 함께 정리했다.

- **삭제 사유**: 두 화면이 `@hvy/ui` 마이그레이션에서 가장 크게 누락된 지점이었다.
  `StatCard` 를 자체 구현(→ `StatTile` 미사용)하고 raw `<table>` 을 쓰며(→ `Table` 미사용),
  Tailwind 기본 팔레트(`bg-sky-500`·`bg-slate-50/80`·`text-white` 등)를 `dark:` 짝 없이
  써서 다크 모드에서 표 대비가 **1.1:1**(사실상 안 보임)이었다. 전환 비용보다 화면을
  접는 편이 낫다고 판단했다.

- **백엔드는 남아 있다**: `/api/stats/admin/**` · 스프린트 API 는 그대로다.
  재구현하려면 서비스 계층부터 다시 만들면 된다.

> ### ✅ 2026-08-28 재구현 완료 — `/admin` 대시보드로 흡수
>
> `/admin/stats` 를 되살리는 대신 **대시보드 자체를 개편**해 그 자리를 대신하게 했다.
> 위에 적힌 실패 원인을 각각 이렇게 막았다:
>
> | 지난번 실패 | 이번 대응 |
> |---|---|
> | `StatCard` 자체 구현 | `@hvy/ui` `StatTile` 사용 |
> | raw `<table>` | `@hvy/ui` `Table` 사용 |
> | Tailwind 기본 팔레트(`bg-sky-500`·`text-white`) | 색은 `global.css` 의 `--admin-chart-*` 에만 두고 tsx 는 `var()` 문자열로만 소비 |
> | 다크 대비 1.1:1 | 라이트/다크 팔레트를 따로 선언하고 실측 대비율을 토큰 주석에 기록 |
> | echarts 재설치 | **설치하지 않음.** 인라인 SVG 미니킷(`components/common/chart/`)으로 대체 — 테마 전환이 CSS 캐스케이드로 처리돼 배선이 필요 없다 |
>
> 백엔드도 `/overview` 단일 엔드포인트를 `/summary` `/traffic` `/health` `/pipeline` 넷으로 나눴고
> (갱신 주기·비용·실패 격리가 다르다), 죽어 있던 `tb_post.view_count` 계측을 beacon 으로 되살렸다.
> `Skeleton`(§6)도 이때 함께 재구현했다.

- **재구현 시 참고**: 삭제 커밋의 부모에서 `apps/blog/src/pages/admin/stats.tsx`(283줄),
  `apps/blog/src/pages/admin/sprint.tsx`(462줄)를 복원할 수 있다. 다만 그대로 되살리면
  같은 대비 문제가 재발한다 — 요약 카드는 `StatTile`, 표는 `Table`/`DataGrid`,
  색은 dl 토큰으로 다시 짜야 한다. 차트는 echarts 재설치가 필요하고, 차트 자체 색·
  `textStyle` 도 테마를 따라가게 배선해야 한다(라이트 고정이면 다크에서 묻힌다).

## 12. 메모 화면의 알약형 탭 시각

- **제거**: `/admin/memo` 의 `TabList`·`Tab` 에 걸려 있던 className 덮어쓰기
  (`rounded-2xl bg-white/70 p-1.5 shadow-sm` + `rounded-xl data-[state=active]:bg-dl-primary
  data-[state=active]:shadow-[...]`). 밑줄형인 `@hvy/ui` `Tabs` 기본 시각을 알약형으로
  바꿔 놓은 것이었다.
- **대체**: `Tabs` 기본 시각(밑줄형)을 그대로 쓴다. `packages/ui/README.md` 기준으로
  알약형(밀집 카드 탭)은 `WorkTabs` 의 시각 언어이고 `Tabs` 는 밑줄형이 정본이라,
  덮어쓰기를 걷어낸 것이 곧 계약 복귀다.
- **부수 효과**: 덮어쓰기 안의 `bg-white/70` 에 `dark:` 짝이 없어 **다크 모드에서 탭 바가
  흰색으로 남고 탭 라벨 대비가 1.17:1**(사실상 안 보임)이었다. 이 문제가 함께 해소됐다.
- **재구현 시 참고**: 알약형이 다시 필요하면 `WorkTabs`(`packages/ui/src/worktabs/`)를 쓴다.

## 13. util 화면의 자체 배너·뱃지 시각

- **제거**: `pages/util/mermaid.tsx` 의 오류 배너 2곳(`bg-red-50 border-red-200 text-red-700`),
  `pages/util/regex-tester.tsx` 의 호환성 경고 배너 3종(error/warning/info)과 보라색 뱃지
  (`bg-purple-100 text-purple-800`), `pages/util/cidr.tsx` 의 대역 뱃지(amber/green 조합).
- **대체**: 배너는 `InlineNotice`(tone: error·warning·info), 뱃지는 `Badge`
  (tone: danger·warning·success·primary·neutral). 색이 dl 팔레트로 바뀐다 —
  **보라 계열은 dl 팔레트에 없어 브랜드색(primary)으로 대체됐다.**
- **왜 대비가 고쳐지나**: `badge.tsx` 주석대로 틴트 배경 위 글자는 500 계열이 아니라
  **잉크 토큰**(`*-ink`)이라 AA 를 만족한다. 또 구 뱃지는 다크 배경을 `rgba(…, 0.12)`
  반투명으로 줘서 부모(파란 선택 행)가 비쳐 올라와 1.34:1 이 됐는데, `Badge` 의
  `bg-dl-*-bg` 는 불투명이라 부모 배경에 영향받지 않는다.

## 14. 그라디언트 장식과 자체 색 조합 (팔레트 정리 잔여분)

`scripts/verify-tokens.mjs` 의 apps/blog 제외를 해제하면서 팔레트 유출 255건을 dl 토큰으로
수렴시켰다. 그 과정에서 사라진 시각 요소들이다.

- **브랜드 로고 칩의 2색 그라디언트**: `bg-[linear-gradient(135deg,#0d7ff2,#7dd3fc)]` →
  단색 `bg-dl-primary`. 공개 헤더(`layout/common/Header.tsx`)와 `/util` 카드 아이콘 2곳.
- **표면 그라디언트**: `UtilityLayout` 의 2단 그라디언트 패널, `cidr`·`crontab` 가이드 패널의
  135deg 그라디언트 → `bg-dl-surface` 단색 + `shadow-dl-card`.
- **커스텀 그림자 수치**: `shadow-[0_18px_40px_rgba(15,23,42,0.06)]` 류 →
  `shadow-dl-card`·`shadow-dl-menu`·`shadow-dl-action` 토큰. 그림자 깊이가 테마 규격으로 통일된다.
- **의미색 세분화 상실**: 마스터코드 트리의 자식 노드 아이콘이 `text-fuchsia-600`(보라) →
  `text-dl-fg-muted`(중립). 루트/자식 구분은 아이콘 **모양**(Folder vs Code)이 계속 담당한다.

### 정당한 예외로 남긴 것 (`// token-exempt:` 주석)

전부 dl 토큰으로 바꿀 수 없는 것들이라, **파일 제외가 아니라 그 줄 옆에 사유를 적는 방식**으로
남겼다 — 파일 통째 제외가 어떻게 되는지는 이 프로젝트가 이미 겪었다(apps/blog 제외 →
유출 255건 축적). 예외는 셋뿐이다:

| 유형 | 위치 | 사유 |
|---|---|---|
| dl 토큰이 도달 못 하는 픽셀 | `PostComponent` 이미지 팝업 배경, `mermaid` 샘플 코드의 style 지시문 | `window.open` 별도 document · mermaid 가 그리는 SVG |
| 기능이 색을 규정 | `barcode` 흑백 2곳 | 바코드·QR 스캐너 인식 요건 |
| 색 문자열이지만 지정이 아니라 판별 | `PostComponent` 의 IDE 테마 코드블록 감지 4곳 | CKEditor 산출물 `rgb(…)` 비교문 |

### 승격한 것

정규식 매치 하이라이트 8색(`HIGHLIGHT_COLORS`)은 파일 안 hex 배열에서 앱 팔레트
(`styles/global.css` 의 `--regex-hl-1..8`)로 올렸다. 브랜드색이 아니라 **서로 구분되는 것**이
목적인 기능색이라 dl 팔레트로 대체할 수 없고, `@hvy/ui` 테마(Tier 1 색 33키)에 넣으면
앱 도메인이 UI 패키지로 새어 들어간다 — `--admin-*`·`--public-*` 와 같은 층이 제자리다.
함께 `--regex-hl-fg` 를 만들어 하이라이트 위 글자색을 못 박았다. 기존에는 글자색을
상속시켜 **다크에서 밝은 하이라이트 배경 위 밝은 글자**가 되던 버그가 있었다.
