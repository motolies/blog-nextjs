import * as Sentry from '@sentry/nextjs';
import { tagTraceId } from './src/lib/sentryEvent';
import { isProductionBuild, makeNoopTransport } from './src/lib/sentryTransport';

const dsn = process.env.SENTRY_DSN;

/**
 * Node 런타임(SSR·API 라우트) Sentry 초기화 — src/instrumentation.ts 의 register() 가 import 한다.
 *
 * - tracesSampleRate 미설정 = Tracing without Performance —
 *   스팬/트랜잭션은 만들지 않지만 propagation context(traceId)는 유지되어 getTraceData() 가 동작한다.
 * - tracePropagationTargets: [] — SDK 의 sentry-trace/baggage 자동 주입을 차단한다.
 *   트레이스 전파는 W3C traceparent 단일 헤더로 통일한다 (src/lib/traceparent.ts + axiosClient).
 * - 운영 빌드에서만 전송 — next dev 의 로컬 오류가 운영 이슈에 섞이지 않게 한다.
 *   enabled:false 는 getTraceData() 까지 꺼 traceparent 가 사라지므로 transport 를 no-op 으로 바꾼다
 *   (src/lib/sentryTransport.ts 참조).
 */
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  ...(isProductionBuild ? {} : { transport: makeNoopTransport }),
  // 이벤트 environment 태그 — 로컬에서 운영 GlitchTip 으로 검증할 땐 SENTRY_ENVIRONMENT=local 로 분리한다
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  // release 는 withSentryConfig 의 release.name(=VERSION)이 빌드 시 번들에 주입한다
  tracePropagationTargets: [],
  // 기본값도 false 지만 명시 — IP/쿠키를 이벤트에 싣지 않는다
  sendDefaultPii: false,
  maxBreadcrumbs: 50,
  // BFF 가 Bearer 토큰·쿠키를 다루므로 요청 헤더에서 민감값을 한 번 더 걷어낸 뒤,
  // trace_id 를 태그로 복사해 GlitchTip 에서 백엔드 tb_system_log.trace_id 로 검색되게 한다
  beforeSend(event) {
    const headers = event.request?.headers;
    if (headers) {
      delete headers.cookie;
      delete headers.authorization;
    }
    return tagTraceId(event);
  },
});
