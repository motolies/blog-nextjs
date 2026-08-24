import * as Sentry from '@sentry/nextjs';

type TransportOptions = Parameters<typeof Sentry.createTransport>[0];
type Transport = ReturnType<typeof Sentry.createTransport>;

/**
 * 운영 빌드 여부 — NODE_ENV 는 next build 가 번들에 인라인하므로 next dev·vitest 에선 항상 false 다.
 * 브라우저·서버 Sentry.init 이 이 값으로 전송 여부를 가른다 (dev 의 로컬 오류가 운영 GlitchTip 에 섞이지 않게).
 */
export const isProductionBuild = process.env.NODE_ENV === 'production';

/**
 * 아무것도 내보내지 않는 transport — SDK 는 켠 채로 네트워크만 끊는다.
 *
 * `enabled: false` 를 쓰지 않는 이유: core 의 isEnabled() 게이트가 getTraceData() 까지 막아
 * axiosClient 의 traceparent 생성이 사라진다 (@sentry/core utils/traceData.js). `beforeSend: () => null`
 * 은 오류 이벤트만 버리고 세션(browserSessionIntegration)·client report 는 그대로 전송한다.
 * transport 만 바꾸면 propagation context 는 살아 있고 이벤트·세션·리포트 전부 여기서 소멸한다.
 */
export function makeNoopTransport(options: TransportOptions): Transport {
  return Sentry.createTransport(options, () => Promise.resolve({}));
}
