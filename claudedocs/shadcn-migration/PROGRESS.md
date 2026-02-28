# 작업 진행상황: MUI → shadcn/ui 마이그레이션 (MRTTable PoC)

## 요약
MUI v6 + material-react-table 기반 프로젝트에서 shadcn/ui + TanStack Table로의 마이그레이션 PoC를 진행했다.
핵심 DataTable 컴포넌트(`ShadcnDataTable.tsx`)를 새로 구현하고, 기존 MRTTable을 사용하던 5개 파일(7개 인스턴스) 모두 마이그레이션 완료. 빌드 검증 통과.

## 완료된 작업
- [x] Tailwind v4 + shadcn/ui + TypeScript 기반 설정
  - `tsconfig.json` (allowJs: true — 기존 JSX와 공존)
  - `postcss.config.mjs` (`@tailwindcss/postcss`)
  - `src/styles/global.css` (Tailwind v4 @import + shadcn CSS 변수)
  - `src/lib/utils.ts` (cn() 유틸리티)
- [x] shadcn 컴포넌트 설치
  - `src/components/ui/button.tsx`
  - `src/components/ui/badge.tsx` — success/warning/info/error 커스텀 변형 추가
  - `src/components/ui/table.tsx`
  - `src/components/ui/dropdown-menu.tsx`
  - Radix UI 패키지: `@radix-ui/react-slot`, `class-variance-authority`, `@radix-ui/react-dropdown-menu`
- [x] `src/components/common/ShadcnDataTable.tsx` 구현
  - MRT 컬럼 어댑터: `Cell`(대문자)→`cell`, `muiTableHeadCellProps.align`→`meta.headerAlign`
  - DynamicSearchFields(기존 MUI 컴포넌트) CommonJS `require()`로 재사용
  - 서버/클라이언트 페이지네이션, 정렬, summaryRow, Row Actions
  - 컬럼 표시/숨김 토글(D&D 대신 DropdownMenu), 컬럼 리사이즈, 컬럼 핀
  - `getRowClassName`: Tailwind 클래스 문자열 반환
- [x] 5개 파일 마이그레이션 완료
  - `src/pages/admin/system-log.jsx` — Chip→Badge, Box/Typography→div/h4
  - `src/pages/admin/api-log.jsx` — 동일 패턴
  - `src/pages/admin/memo.jsx` — Box+sx hover→div+Tailwind, IconButton→Button+Trash2
  - `src/pages/admin/sprint.jsx` — getRowClassName sx객체→Tailwind 문자열, MRTTable 2개→ShadcnDataTable
  - `src/components/memo/CategoryManagementPanel.jsx` — IconButton→ActionButton+Pencil/Trash2
- [x] TypeScript 빌드 오류 수정 (`ShadcnDataTable.tsx:231` ColumnDef discriminated union 문제 → `as ColumnDef<TData>`)
- [x] `npm run build` 성공 ✅

## 미완료 작업 (이번 PoC 이후 단계)
- [ ] DynamicSearchFields.jsx — shadcn 전환 (현재 MUI 기반 유지)
- [ ] DateRangePicker — shadcn DatePicker + date-fns로 교체 (moment.js 제거)
- [ ] Dialog/Modal — shadcn Dialog로 교체
- [ ] notistack → sonner (Toast 알림)
- [ ] TreeView (카테고리 트리) — Radix Collapsible 기반 커스텀
- [ ] 유틸리티 페이지 및 나머지 페이지 MUI 제거
- [ ] 아이콘 전환: MUI Icons → lucide-react 완전 대체
- [ ] MUI 패키지 완전 제거

## 현재 상태
- 브랜치: `design`
- 모든 변경사항 미커밋 (git add/commit 안 함)
- 빌드: ✅ 정상 (TypeScript 오류 없음)
- 기존 MRTTable.jsx는 삭제하지 않고 유지 중 (안전 마진)

### 미커밋 변경 파일 목록
```
M  next.config.js           (변경 확인 필요 - 마이그레이션 중 변경됐을 수 있음)
M  package.json / package-lock.json  (신규 패키지 추가)
M  src/components/memo/CategoryManagementPanel.jsx
M  src/pages/admin/api-log.jsx
M  src/pages/admin/memo.jsx
M  src/pages/admin/sprint.jsx
M  src/pages/admin/system-log.jsx
M  src/styles/global.css
?? .bkit/
?? next-env.d.ts
?? postcss.config.mjs
?? src/components/common/ShadcnDataTable.tsx
?? src/components/ui/  (button.tsx, badge.tsx, table.tsx, dropdown-menu.tsx)
?? src/lib/utils.ts
?? tsconfig.json
```

## 핵심 결정사항

### 1. Column D&D → Column Visibility Toggle
- 사용자 결정: "해당 칼럼을 보였다 안보였다 정도로 개선해도 상관없음"
- D&D(DnD) 대신 DropdownMenuCheckboxItem으로 컬럼 표시/숨김 토글
- 구현 난이도 대폭 감소

### 2. TypeScript 도입 (allowJs: true)
- 기존 JSX 파일은 유지하고, 새로 만드는 파일만 TSX
- `tsconfig.json`에 `"allowJs": true`로 혼용

### 3. MRTTable PoC 먼저
- 가장 핵심 컴포넌트인 DataTable을 먼저 검증

### 4. DynamicSearchFields 재사용 전략
- MUI 기반 기존 컴포넌트를 ShadcnDataTable 안에서 CommonJS `require()`로 가져와 재사용
- SPACING_CONFIG에 Tailwind 클래스 + MUI 숫자값 병행 유지

### 5. getRowClassName 반환값 변경
- MRTTable: `{backgroundColor: '#f0f0f0'}` (sx 객체)
- ShadcnDataTable: `'bg-gray-100'` (Tailwind 클래스 문자열)

## 발생한 문제와 해결

### TypeScript 빌드 오류
```
Type error: Property 'accessorKey' is optional in type '...' but required in type 'AccessorKeyColumnDefBase<TData, unknown>'
```
- 원인: `ColumnDef<TData>`가 discriminated union이라 `accessorKey`와 `id`가 조건부 스프레드로 분기될 때 TypeScript가 타입 추론 실패
- 해결: `const tanstackCol = { ... } as ColumnDef<TData>` 타입 단언으로 해결
- 위치: `ShadcnDataTable.tsx:231`

### Chip 컬러 → Badge variant 매핑
- MUI Chip: `color="primary"` (GET), `"success"` (POST), `"warning"` (PUT), `"error"` (DELETE)
- shadcn Badge: `variant="info"`, `"success"`, `"warning"`, `"error"`
- `badge.tsx`에 커스텀 variant 추가 (success/warning/info/error)

## 다음 세션에서 할 일
1. `next.config.js` 변경사항 확인 (의도치 않은 변경인지 확인)
2. 변경사항 커밋: `git add`로 신규 파일/변경 파일 스테이징 후 커밋
3. dev 서버(`npm run dev`) 실행 후 실제 화면에서 5개 페이지 동작 확인
   - `/admin/system-log`, `/admin/api-log` — 검색/페이지네이션/배지 확인
   - `/admin/memo` — 삭제 버튼 아이콘, 컨텐츠 클릭 → 수정 다이얼로그 확인
   - `/admin/sprint` — getRowClassName 조건부 색상(bg-gray-100, bg-blue-50, bg-red-50) 확인
   - `/admin/memo` → 카테고리 관리 탭 — 수정/삭제 아이콘 버튼 확인
4. 이후 다음 마이그레이션 단계 결정 (DynamicSearchFields 또는 Dialog 등)
