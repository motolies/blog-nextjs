# 인증 시스템 (BFF)

이 문서는 `blog-nextjs`의 얕은 BFF 인증 구조를 설명합니다.

## 개요

브라우저는 더 이상 Java 백엔드(`api.hvy.kr`)를 직접 호출하지 않습니다.
모든 브라우저 요청은 `blog-nextjs`의 `/api/*`로 들어오고, Next API route가 Java 백엔드로 프록시합니다.

인증 쿠키도 Spring이 아니라 Next가 소유합니다.

### 주요 특징

- 브라우저는 same-origin `/api/*`만 호출
- Next Route Handler(BFF)가 Java 백엔드로 프록시
- 서버 컴포넌트는 Next 쿠키를 읽어 Java 백엔드로 직접 서버 호출
- 브라우저 인증 쿠키는 `hvy_access_token`
- 쿠키 속성은 `HttpOnly + SameSite=Lax + Path=/ + Secure(운영)`

## 인증 흐름

### 로그인

1. 브라우저가 `POST /api/auth/login` 호출
2. Next Route Handler(`app/api/auth/login/route.ts`)가 Spring `/api/auth/login` 호출
3. Spring 응답의 `Set-Cookie: Authorization=...`에서 JWT 추출
4. Next가 `hvy_access_token` 쿠키를 다시 발급
5. 브라우저는 Spring 쿠키가 아니라 Next 쿠키만 유지

### CSR

1. 브라우저가 `/api/*` 호출
2. Next BFF가 `hvy_access_token` 쿠키를 읽음
3. Java 백엔드로 `Authorization: Bearer <jwt>` 헤더 주입
4. 백엔드 응답을 브라우저로 그대로 전달

### 서버 컴포넌트(SSR)

1. 브라우저가 페이지 요청 시 `hvy_access_token`을 Next로 전송
2. 서버 컴포넌트가 `buildBackendAuthConfig(await headers())`로 인증 헤더 생성
3. Next 서버가 Java 백엔드로 직접 호출
4. 브라우저와 서버 컴포넌트 모두 동일한 JWT 기준으로 권한 판정
5. `/admin/*`는 `app/admin/layout.tsx`가 프로필 조회로 서버에서 가드 — 미인증이면 HTML 없이 `/login`으로 307

## 쿠키 정책

브라우저 인증 쿠키:

```text
Name: hvy_access_token
HttpOnly: true
SameSite: Lax
Path: /
Secure: true (production only)
Domain: 없음 (host-only)
```

Spring의 기존 `Authorization` 쿠키는 다른 프론트 호환성을 위해 백엔드에 남겨둘 수 있지만, `blog-nextjs` 브라우저 인증에는 사용하지 않습니다.

## 코드 구조

```text
src/
├── lib/
│   ├── authCookie.ts        # Next 인증 쿠키 파싱/발급
│   ├── backendUrl.ts        # 서버용 Java 백엔드 URL 결정
│   ├── ssrRequestAuth.ts    # 서버 컴포넌트/Route Handler -> Java Authorization 헤더 생성
│   ├── requestHeaders.ts    # headers()/Request.headers 공용 헤더 읽기
│   └── serverProfile.ts     # 서버에서 프로필 조회 (admin 가드용, 401/403 은 null)
├── app/
│   ├── api/auth/login/route.ts  # 로그인 커스텀 BFF
│   ├── api/[...path]/route.ts   # 일반 API 프록시
│   └── admin/layout.tsx         # 관리자 서버 가드 (미인증 -> /login)
└── service/
    └── axiosClient.ts       # 브라우저는 same-origin, 서버는 직접 백엔드 호출
```

## 운영 메모

- 배포 후에는 기존 Spring 쿠키 대신 Next 쿠키를 쓰므로 재로그인이 필요할 수 있습니다.
- `/api/file/*` 다운로드/이미지도 BFF 프록시를 통과합니다.
- logout, refresh token, 서버 세션 저장소는 현재 범위에 포함하지 않습니다.
