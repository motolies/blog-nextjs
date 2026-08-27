import * as Sentry from '@sentry/nextjs';
import { tagTraceId } from '@/lib/sentryEvent';
import { isProductionBuild, makeNoopTransport } from '@/lib/sentryTransport';

const dsn = process.env.SENTRY_DSN;

/**
 * 브라우저 Sentry 초기화 — Next 가 client 번들 진입점에서 자동 로드한다.
 * (src/ 디렉터리 앱이므로 반드시 src/instrumentation-client.ts 여야 한다)
 *
 * - tracesSampleRate 미설정 = Tracing without Performance — 스팬은 만들지 않고 propagation context 만 유지.
 * - 내비게이션 단위 traceId 갱신은 기본 integration 인 browserTracingIntegration 이 담당한다 —
 *   Next 가 파일 끝의 onRouterTransitionStart 훅을 클라이언트 내비게이션마다 호출하고
 *   (captureRouterTransitionStart) 그때 새 traceId 를 만든다.
 * - pageload 의 traceId 는 SSR 이 심은 <meta name="sentry-trace"> 를 이어받는다 (withSentryConfig 의
 *   clientTraceMetadata 주입, Next ≥15 자동) — 서버 렌더의 백엔드 호출과 같은 traceId.
 * - tracePropagationTargets: [] — TwP 에서도 same-origin XHR 에 sentry-trace 가 자동 부착되는
 *   것을 차단한다. 전파는 axiosClient 가 주입하는 W3C traceparent 단일 헤더로 통일한다.
 * - 운영 빌드에서만 전송 — next dev 의 로컬 오류·세션이 운영 이슈에 섞이지 않게 한다.
 *   enabled:false 는 getTraceData() 까지 꺼 traceparent 가 사라지므로 transport 를 no-op 으로 바꾼다
 *   (src/lib/sentryTransport.ts 참조).
 * - Session Replay 미사용 확정 — integration 을 추가하지 않으면 번들에도 들어오지 않는다.
 */
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  ...(isProductionBuild ? {} : { transport: makeNoopTransport }),
  // 이벤트 environment 태그 — 빌드타임 인라인 (next.config.ts env). 로컬 검증 시 SENTRY_ENVIRONMENT=local
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  // release 는 withSentryConfig 의 release.name(=VERSION)이 빌드 시 번들에 주입한다
  tracePropagationTargets: [],
  sendDefaultPii: false,
  maxBreadcrumbs: 50,
  // trace_id 를 태그로 복사 — GlitchTip 에서 BFF 이벤트·백엔드 tb_system_log 와 같은 traceId 로 검색된다
  beforeSend: tagTraceId,
  // 실사용자 오류가 아닌 브라우저/확장 노이즈 — 운영하며 필요 시 추가한다
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
    /^AbortError/,
    'Non-Error promise rejection captured',
  ],
  denyUrls: [
    /^chrome(-extension)?:\/\//i,
    /^moz-extension:\/\//i,
    /^safari(-web)?-extension:\/\//i,
  ],
});

// 클라이언트 내비게이션마다 traceId 를 갱신한다 — Next 가 이 export 를 자동으로 연결한다
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
