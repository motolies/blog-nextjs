/**
 * W3C traceparent 변환 유틸 — 트레이스 전파를 traceparent 단일 헤더로 통일하기 위한 순수 함수.
 *
 * sentry-trace 형식: `<32hex traceId>-<16hex spanId>[-<0|1>]` (sampled 자리는 비어 있을 수 있다)
 * traceparent 형식: `00-<32hex traceId>-<16hex spanId>-<2hex flags>` (W3C Trace Context)
 */

const TRACE_ID_RE = /^[0-9a-f]{32}$/;
const SPAN_ID_RE = /^[0-9a-f]{16}$/;
const ALL_ZERO_TRACE_ID = '0'.repeat(32);
const ALL_ZERO_SPAN_ID = '0'.repeat(16);

/**
 * sentry-trace → W3C traceparent.
 *
 * flags 는 항상 '01'(sampled) 고정 — 백엔드(Micrometer OTel 의 ParentBased 샘플러)는 인바운드 sampled
 * 플래그를 로컬 샘플링 확률(prod 1.0)보다 우선하므로 '00' 을 보내면 prod Zipkin 스팬이 유실된다. 또한 TwP 모드의
 * sentry-trace 는 sampled 자리가 비어 있을 수(deferred) 있어 변환 시 강제로 채운다.
 */
export function sentryTraceToTraceparent(sentryTrace: string | undefined): string | undefined {
  if (!sentryTrace) return undefined;
  const [traceId, spanId] = sentryTrace.split('-');
  if (!isValidIds(traceId, spanId)) return undefined;
  return `00-${traceId}-${spanId}-01`;
}

/**
 * W3C traceparent → sentry-trace. BFF 가 인바운드 traceparent 로 Sentry 트레이스를 이어
 * (Sentry.continueTrace) BFF 이벤트가 브라우저와 같은 traceId 를 갖게 할 때 쓴다.
 */
export function traceparentToSentryTrace(traceparent: unknown): string | undefined {
  if (typeof traceparent !== 'string') return undefined;
  const [version, traceId, spanId, flags] = traceparent.split('-');
  if (version !== '00' || !isValidIds(traceId, spanId) || !/^[0-9a-f]{2}$/.test(flags ?? '')) {
    return undefined;
  }
  const sampled = (Number.parseInt(flags, 16) & 0x01) === 1 ? '1' : '0';
  return `${traceId}-${spanId}-${sampled}`;
}

// traceId/spanId 형식 검증 — all-zero 는 W3C 스펙상 무효 값이다
function isValidIds(traceId: string | undefined, spanId: string | undefined): boolean {
  return (
    !!traceId &&
    !!spanId &&
    TRACE_ID_RE.test(traceId) &&
    SPAN_ID_RE.test(spanId) &&
    traceId !== ALL_ZERO_TRACE_ID &&
    spanId !== ALL_ZERO_SPAN_ID
  );
}

/** traceparent 에서 32hex traceId 만 꺼낸다 — 토스트/로그 노출용. 형식이 어긋나면 undefined. */
export function traceIdFromTraceparent(traceparent: unknown): string | undefined {
  const sentryTrace = traceparentToSentryTrace(traceparent);
  return sentryTrace?.split('-')[0];
}
