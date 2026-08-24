import * as Sentry from '@sentry/nextjs';
import { sentryTraceToTraceparent } from './traceparent';

/**
 * 현재 propagation context 의 traceId 로 W3C traceparent 를 만든다 —
 * 브라우저(pageload/navigation)·SSR(요청 isolation scope) 양쪽에서 동작한다.
 * axiosClient 인터셉터와 raw fetch(sitemap.xml) 가 같은 함수를 써서 백엔드 전파 경로를 단일화한다.
 */
export function currentTraceparent(): string | undefined {
  return sentryTraceToTraceparent(Sentry.getTraceData()['sentry-trace']);
}
