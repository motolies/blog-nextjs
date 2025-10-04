# 인증 시스템 (Authentication)

이 문서는 블로그 애플리케이션의 쿠키 기반 인증 시스템에 대해 설명합니다.

## 목차

1. [개요](#개요)
2. [백엔드 인증 방식](#백엔드-인증-방식)
3. [프론트엔드 인증 구조](#프론트엔드-인증-구조)
4. [SSR vs CSR 인증 플로우](#ssr-vs-csr-인증-플로우)
5. [크로스 도메인 인증](#크로스-도메인-인증)
6. [코드 구조](#코드-구조)

## 개요

블로그 애플리케이션은 **쿠키 기반 세션 인증**을 사용합니다. JWT 토큰이 쿠키에 저장되며, SSR(Server-Side Rendering)과 CSR(Client-Side Rendering) 모두에서 동일한 인증 메커니즘을 사용합니다.

### 주요 특징

- ✅ 쿠키 기반 인증 (HttpOnly, Secure, SameSite=None)
- ✅ SSR/CSR 통합 인증 플로우
- ✅ Redux-Saga를 통한 상태 관리
- ✅ 크로스 도메인 개발 환경 지원
- ✅ 자동 인증 상태 동기화

## 백엔드 인증 방식

백엔드는 두 가지 방식으로 JWT 토큰을 수신할 수 있습니다:

### 1. Authorization 헤더 (우선순위 높음)

```http
Authorization: Bearer <jwt-token>
```

- `Bearer ` 접두사를 제거하고 JWT 토큰으로 사용
- 우선적으로 확인하는 방식

### 2. Authorization 쿠키 (대체 방식)

```http
Cookie: Authorization=<jwt-token>
```

- Authorization 헤더가 없을 경우 쿠키에서 토큰 추출
- 토큰 값을 직접 사용 (Bearer 접두사 없음)

### 쿠키 보안 설정

백엔드에서 설정하는 쿠키 속성:

```
HttpOnly: true        # JavaScript 접근 차단 (XSS 방어)
Secure: true          # HTTPS만 전송
SameSite: None        # 크로스 도메인 허용
Max-Age: <session>    # 세션 만료 시간
```

## 프론트엔드 인증 구조

### Axios Client 설정

모든 HTTP 요청에 쿠키를 자동으로 포함시키기 위한 설정:

```javascript
// src/service/axiosClient.js
const axiosClient = axios.create({
    baseURL: process.env.BLOG_URL_DEV || process.env.BLOG_URL_PROD,
    withCredentials: true,  // 쿠키 자동 전송
})
```

`withCredentials: true` 설정으로:
- 브라우저가 자동으로 쿠키를 요청에 포함
- CORS 설정과 함께 작동
- SSR/CSR 모두 일관된 동작

### Redux 상태 관리

```javascript
// src/store/reducers/userReducers.jsx
{
    isAuthenticated: false,  // 인증 상태
    isLoading: false,        // 로딩 상태
    user: {},                // 사용자 정보
    error: ''                // 에러 메시지
}
```

### 액션 타입

```javascript
// 클라이언트 사이드 액션
LOAD_USER_REQUEST          // CSR 사용자 정보 요청
LOAD_USER_REQUEST_SUCCESS  // 성공
LOAD_USER_REQUEST_ERROR    // 실패

// 서버 사이드 액션
SERVER_LOAD_USER_REQUEST_SUCCESS  // SSR 사용자 정보 성공
```

## SSR vs CSR 인증 플로우

### SSR (Server-Side Rendering)

페이지에 직접 접근할 때 서버에서 인증 확인:

```javascript
// src/pages/_app.jsx - getInitialProps
const cookie = req?.headers?.cookie

if (cookie) {
    // 백엔드가 Cookie에서 Authorization을 직접 읽음
    const headers = { Cookie: cookie }

    const res = await service.user.profile({ headers })
    store.dispatch({
        type: SERVER_LOAD_USER_REQUEST_SUCCESS,
        user: res.data,
    })
}
```

**SSR 플로우:**
```
1. 브라우저 → Next.js 서버 (쿠키 포함)
2. Next.js → 백엔드 API (Cookie 헤더 전달)
3. 백엔드 → Authorization 쿠키 읽기 → 인증 확인
4. 백엔드 → 사용자 정보 반환
5. Redux Store → 초기 상태 설정 (__NEXT_REDUX_WRAPPER_HYDRATE__)
6. 클라이언트로 HTML + 초기 상태 전달
```

### CSR (Client-Side Rendering)

SPA 네비게이션 또는 컴포넌트 마운트 시:

```javascript
// src/pages/_app.jsx - useEffect
useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthenticated) {
        dispatch({ type: LOAD_USER_REQUEST })
    }
}, [])
```

**CSR 플로우:**
```
1. 컴포넌트 마운트 → LOAD_USER_REQUEST 디스패치
2. Saga → service.user.profile() 호출
3. axiosClient → withCredentials: true로 쿠키 자동 포함
4. 백엔드 → Authorization 쿠키 읽기 → 인증 확인
5. 백엔드 → 사용자 정보 반환
6. Saga → LOAD_USER_REQUEST_SUCCESS 디스패치
7. Redux Store 업데이트
```

### 페이지별 SSR 인증

개별 페이지에서도 SSR 인증이 필요한 경우:

```javascript
// src/pages/post/[id].jsx - getServerSideProps
const cookie = context.req?.headers?.cookie
const headers = cookie ? { Cookie: cookie } : undefined

const post = await service.post.getPost(
    { postId },
    headers ? { headers } : undefined
)
```

## 크로스 도메인 인증

### 개발 환경 설정

로컬 개발 시 크로스 도메인 인증:

```
프론트엔드: http://localhost:3000
백엔드:     https://api.hvy.kr
```

### 작동 조건

1. **백엔드 쿠키 설정:**
   ```
   SameSite=None
   Secure=true
   ```

2. **프론트엔드 설정:**
   ```javascript
   withCredentials: true
   ```

3. **CORS 설정:**
   - 백엔드에서 `Access-Control-Allow-Origin` 허용
   - `Access-Control-Allow-Credentials: true`

### 환경별 백엔드 URL

```javascript
// next.config.js
const BACKEND_URL = {
    BLOG_URL_DEV: 'http://localhost:9090',  // 로컬 개발
    // BLOG_URL_DEV: 'https://api.hvy.kr',  // 원격 개발
    BLOG_URL_PROD: 'https://api.hvy.kr',     // 외부 운영
    BLOG_URL_PROD_INTERNAL: 'http://blogback:8080',  // 내부 운영
}
```

## 코드 구조

### 핵심 파일

```
src/
├── pages/
│   └── _app.jsx                    # SSR 인증 진입점
├── service/
│   ├── axiosClient.js              # HTTP 클라이언트 설정
│   └── userService.js              # 사용자 API 서비스
└── store/
    ├── types/userTypes.jsx         # 액션 타입 정의
    ├── actions/userActions.js      # (선택) 액션 크리에이터
    ├── sagas/userSagas.jsx         # 비동기 로직
    └── reducers/userReducers.jsx   # 상태 관리
```

### 서비스 레이어 패턴

모든 서비스 메서드는 `config` 파라미터를 받아 SSR 헤더 전달을 지원:

```javascript
// src/service/userService.js
const userService = {
    profile: (config) => {
        return axiosClient.get(`/api/auth/profile`, config)
    },
}

// SSR에서 사용
await service.user.profile({ headers: { Cookie: cookie } })

// CSR에서 사용 (config 생략)
await service.user.profile()
```

### Redux-Saga 인증 로직

```javascript
// src/store/sagas/userSagas.jsx
function* loadUser() {
    try {
        const auth = yield call(service.user.profile)
        yield put({
            type: LOAD_USER_REQUEST_SUCCESS,
            payload: auth.data
        })
    } catch (err) {
        yield put({
            type: LOAD_USER_REQUEST_ERROR,
            payload: 'Login failed'
        })
    }
}

function* serverLoadUser({ user }) {
    // SSR에서 가져온 사용자 정보를 Redux에 저장
    yield put({
        type: LOAD_USER_REQUEST_SUCCESS,
        payload: user
    })
}
```

### 관리자 페이지 보호

```javascript
// src/pages/_app.jsx - useEffect
useEffect(() => {
    if (router.pathname.startsWith('/admin') && !isAuthenticated) {
        router.push('/login')
    }
}, [router.query.q, isAuthenticated])
```

**인증 플로우:**
```
1. /admin 페이지 접근 시도
2. isAuthenticated 상태 확인
3. 미인증 → /login으로 리다이렉트
4. 인증됨 → 페이지 렌더링
```

## 로그인 프로세스

### 1. RSA 공개키 요청

```javascript
// src/store/sagas/userSagas.jsx
const rsa = yield call(service.user.shake)
const publicKey = rsa.data.publicKey
```

### 2. 비밀번호 암호화

```javascript
import forge from "node-forge"

function encryptPassword(resPublicKey, pass) {
    const publicKey = forge.pki.publicKeyFromPem(
        '-----BEGIN PUBLIC KEY----- ' + resPublicKey + ' -----END PUBLIC KEY-----'
    )
    const encData = publicKey.encrypt(pass, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha1.create() }
    })
    return forge.util.encode64(encData)
}
```

### 3. 로그인 요청

```javascript
const auth = yield call(service.user.login, {
    username,
    encPassword,
    publicKey
})

yield put({
    type: USER_LOGIN_REQUEST_SUCCESS,
    payload: auth.data
})
```

### 4. 쿠키 저장

- 백엔드에서 `Set-Cookie` 헤더로 응답
- 브라우저가 자동으로 쿠키 저장
- 이후 모든 요청에 자동 포함

## 보안 고려사항

### 1. XSS 방어
- `HttpOnly` 쿠키로 JavaScript 접근 차단
- CKEditor 컨텐츠 sanitization

### 2. CSRF 방어
- SameSite 쿠키 정책
- (필요시) CSRF 토큰 추가 가능

### 3. 전송 보안
- `Secure` 플래그로 HTTPS 강제
- 운영 환경 HTTPS 필수

### 4. 세션 관리
- 적절한 세션 타임아웃 설정
- 로그아웃시 쿠키 삭제

## 디버깅

### SSR 쿠키 로깅

```javascript
// src/pages/_app.jsx
if (cookie) {
    const keys = cookie.split(';').map(s => s.split('=')[0].trim())
    console.log('[SSR] Incoming Cookie keys:', keys.join(','))
}
```

### 인증 실패 로깅

```javascript
catch (err) {
    console.log('서버사이드 인증 실패:', err?.response?.status || err.message)
}
```

### 브라우저 개발자 도구

1. **Network 탭**: Cookie 헤더 확인
2. **Application 탭**: 저장된 쿠키 확인
3. **Redux DevTools**: 인증 상태 추적

## 트러블슈팅

### SSR에서 인증 실패

**증상:** 직접 URL 접근시 인증되지 않음

**해결:**
- `_app.jsx` getInitialProps에서 쿠키 전달 확인
- 백엔드 CORS 설정 확인
- 쿠키 도메인/경로 설정 확인

### CSR에서 인증 실패

**증상:** 네비게이션 후 인증 상태 손실

**해결:**
- `withCredentials: true` 설정 확인
- 백엔드 `Access-Control-Allow-Credentials` 확인
- Redux 상태 초기화 로직 확인

### 크로스 도메인 쿠키 전송 안됨

**증상:** localhost → api.hvy.kr 쿠키 전송 실패

**해결:**
- 백엔드 쿠키 `SameSite=None` 설정 확인
- 백엔드 쿠키 `Secure=true` 설정 확인
- HTTPS 사용 여부 확인 (Secure 쿠키는 HTTPS 필수)

## 참고 자료

- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)
- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
