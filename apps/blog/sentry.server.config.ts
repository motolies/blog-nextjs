import * as Sentry from '@sentry/nextjs';

/**
 * Node 런타임(SSR·API 라우트) Sentry 초기화 — src/instrumentation.ts 의 register() 가 import 한다.
 *
 * - tracesSampleRate 미설정 = Tracing without Performance —
 *   스팬/트랜잭션은 만들지 않지만 propagation context(traceId)는 유지되어 getTraceData() 가 동작한다.
 * - tracePropagationTargets: [] — SDK 의 sentry-trace/baggage 자동 주입을 차단한다.
 *   트레이스 전파는 W3C traceparent 단일 헤더로 통일한다 (src/lib/traceparent.ts + axiosClient).
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.NODE_ENV,
  // release 는 withSentryConfig 의 release.name(=VERSION)이 빌드 시 번들에 주입한다
  tracePropagationTargets: [],
  // 기본값도 false 지만 명시 — IP/쿠키를 이벤트에 싣지 않는다
  sendDefaultPii: false,
  maxBreadcrumbs: 50,
  // BFF 가 Bearer 토큰·쿠키를 다루므로 요청 헤더에서 민감값을 한 번 더 걷어낸다
  beforeSend(event) {
    const headers = event.request?.headers;
    if (headers) {
      delete headers.cookie;
      delete headers.authorization;
    }
    return event;
  },
});
