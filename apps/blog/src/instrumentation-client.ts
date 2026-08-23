import * as Sentry from '@sentry/nextjs';

/**
 * 브라우저 Sentry 초기화 — Next 가 client 번들 진입점에서 자동 로드한다.
 * (src/ 디렉터리 앱이므로 반드시 src/instrumentation-client.ts 여야 한다)
 *
 * - tracesSampleRate 미설정 = Tracing without Performance — traceId 는 페이지로드당 1개 유지.
 * - tracePropagationTargets: [] — TwP 에서도 same-origin XHR 에 sentry-trace 가 자동 부착되는
 *   것을 차단한다. 전파는 axiosClient 가 주입하는 W3C traceparent 단일 헤더로 통일한다.
 * - Session Replay 미사용 확정 — integration 을 추가하지 않으면 번들에도 들어오지 않는다.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.NODE_ENV,
  // release 는 withSentryConfig 의 release.name(=VERSION)이 빌드 시 번들에 주입한다
  tracePropagationTargets: [],
  sendDefaultPii: false,
  maxBreadcrumbs: 50,
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

// SPA 내비게이션을 SDK 에 알린다 — 라우트 전환마다 propagation context 가 갱신되어
// traceId 가 페이지로드 단위가 아니라 내비게이션 단위로 나뉜다 (TwP 한계 완화)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
