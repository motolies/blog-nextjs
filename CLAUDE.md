# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
- 가능한 모든 대답은 한글로 합니다.

## 프로젝트 개요

한국어로 작성된 개인 블로그 Next.js 프론트엔드 애플리케이션입니다. Redux-Saga를 사용한 상태 관리, 표준 CKEditor5를 이용한 글 작성 기능, 그리고 Material-UI를 사용한 사용자 인터페이스로 구성되어 있습니다. Next.js 15와 Turbopack을 사용하여 최적화된 개발 경험을 제공합니다.

## 개발 명령어

### 기본 개발 환경
```bash
# 의존성 설치 및 개발 서버 실행 (Turbopack 사용)
npm ci
npm run dev
```

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 코드 검증
npm run lint
```

### Docker 환경
```bash
# 개발용 단일 아키텍처 빌드
docker build --no-cache -t docker.hvy.kr/blog-front .

# 프로덕션용 다중 아키텍처 빌드
docker buildx create --name jarvis
docker buildx use jarvis
docker buildx inspect --bootstrap
docker buildx build --platform linux/amd64,linux/arm64 --no-cache --push -t docker.hvy.kr/blog-front .
```

## 아키텍처 구조

### 상태 관리 (Redux-Saga 패턴)
- **Store**: `src/store/index.jsx`에서 Redux 스토어 설정
- **Actions**: `src/store/actions/`에 도메인별 액션 정의
- **Reducers**: `src/store/reducers/`에 상태 업데이트 로직
- **Sagas**: `src/store/sagas/`에 비동기 로직 및 API 호출
- **Types**: `src/store/types/`에 액션 타입 상수 정의

도메인: category, common, post, tag, user, file

### 레이아웃 시스템
- **CommonLayout**: 일반 사용자용 레이아웃 (`src/components/layout/common/`)
- **AdminLayout**: 관리자용 레이아웃 (`src/components/layout/admin/`)
- `_app.jsx`에서 경로에 따라 자동 레이아웃 선택 (`/admin` 경로는 AdminLayout)

### API 통신
- **axiosClient**: `src/service/axiosClient.js`에서 중앙 집중식 HTTP 클라이언트
- **Services**: `src/service/`에 도메인별 API 서비스 모듈
- 백엔드 URL은 `next.config.js`에서 환경별 설정 (개발: `api.hvy.kr`, 프로덕션: 내부 `blogback:8080`)
- 응답 인터셉터를 통한 중첩 데이터 구조 자동 해제

### 인증 시스템
- 쿠키 기반 세션 인증
- `_app.jsx`의 `getInitialProps`에서 서버사이드 인증 상태 확인
- `/admin` 경로 접근시 자동 로그인 페이지 리다이렉션

### CKEditor 통합
- 표준 CKEditor5 패키지 사용 (`ckeditor5: 46.1.0`)
- `DynamicEditor.jsx`에서 동적 임포트로 SSR 이슈 해결
- 파일 업로드 컴포넌트와 연동
- 한국어 번역 및 다양한 플러그인 설정

## 주요 페이지 구조

### 공개 페이지
- `/`: 홈페이지 (포스트 목록)
- `/post/[id]`: 개별 포스트 상세
- `/search`: 검색 결과
- `/login`: 로그인

### 관리자 페이지 (`/admin`)
- `/admin`: 관리자 대시보드
- `/admin/write`: 새 글 작성
- `/admin/write/[id]`: 글 수정
- `/admin/categories`: 카테고리 관리
- `/admin/tags`: 태그 관리

## 컴포넌트 패턴

### 검색 시스템
- `SearchEngineComponent`: 통합 검색 인터페이스
- `SearchFilter`, `SearchCategory`, `SearchTag`: 필터링 옵션
- `SearchResult`: 검색 결과 표시
- `src/model/searchObject.js`: 검색 조건 모델

### 에디터 시스템
- `DynamicEditor`: CKEditor5 래퍼 컴포넌트
- `FileUploadComponent`, `MultipleFileUploadComponent`: 파일 업로드
- 확인 다이얼로그: `DeleteConfirm`, `PublicConfirm`

### UI 컴포넌트
- Material-UI 기반 디자인 시스템
- Apache Echarts 구성 
- `CategoryTreeView`: 계층형 카테고리 트리
- `TagComponent`, `TagGroupComponent`: 태그 표시 및 관리
- `PreviewDialog`: 글 미리보기

## 스타일링

### CSS 구조
- `global.css`: 전역 스타일
- `d2coding-subset.css`: 한국어 폰트 (D2Coding)
- `rainbow.css`: 코드 하이라이팅
- `ck5.custom.css`: CKEditor 커스텀 스타일
- `PostComponent.module.css`: 포스트 컴포넌트 전용 CSS 모듈

## 유틸리티 함수

- `base64Util.js`: Base64 인코딩/디코딩
- `fileLink.js`: 파일 링크 생성
- `uuidUtil.js`: UUID 생성 (tsid-ts 사용)
- `usePostNavigationShortcut.js`: 키보드 단축키 훅

## 중요 설정 파일

- `next.config.js`: Next.js 설정, API 프록시, 환경변수, Turbopack 최적화
- `package.json`: 의존성 관리, Turbopack 스크립트 설정
- `Dockerfile`: 멀티스테이지 빌드, Node.js 22-alpine 기반
- `PROJECT_RULES.md`: 코드 포맷팅 및 프로젝트 규칙
- `.github/workflows/buildx.yml`: GitHub Actions 빌드 파이프라인 (캐시 최적화)

## 개발 시 주의사항

### CKEditor5 관련
- 표준 CKEditor5 패키지를 사용하므로 별도 빌드 불필요
- SSR 환경에서 CKEditor5는 `DynamicEditor`를 통한 동적 로딩 필수
- `import('ckeditor5')`로 클라이언트 사이드에서만 로드

### Turbopack 최적화
- 개발 및 프로덕션 빌드에서 Turbopack 사용으로 빠른 개발 경험
- HMR(Hot Module Replacement) 성능 대폭 향상
- `next.config.js`에서 Turbopack 비호환 설정 제거됨

### 상태 관리 패턴
- 모든 비동기 액션은 Saga를 통해 처리
- 액션 타입은 `REQUEST`, `SUCCESS`, `FAILURE` 패턴 사용
- 서버사이드 렌더링시 `SERVER_*` 액션 타입으로 구분

### API 통신
- `axiosClient`의 응답 인터셉터가 `response.data.data` 구조를 자동으로 평면화
- 개발 환경에서는 외부 API(`api.hvy.kr`), 프로덕션에서는 내부 서비스(`blogback:8080`) 사용

### 라우팅 및 인증
- `/admin` 경로는 인증 확인 후 접근 가능
- `getInitialProps`를 통한 서버사이드 인증 상태 관리
- 로그인 상태는 Redux store의 `user.isAuthenticated`에서 관리

### 환경 분리
- 개발/프로덕션 환경별 백엔드 URL 자동 전환
- Docker 환경에서는 내부 서비스명 사용
- Node.js 디버깅은 개발 환경에서 `--inspect` 옵션 활성화

### 주요 라이브러리
- mui 시리즈 컴포넌트를 주로 사용하며 버전에 맞는 문서를 확인하여 관리
- 컴포넌트의 CSS를 직접 수정하지 않음 