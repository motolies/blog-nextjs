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
 * flags 는 항상 '01'(sampled) 고정.
 *
 * 원래 근거는 "백엔드 스팬 유실 방지" 였으나 백엔드에서 span exporter 를 걷어내(2026-08-30 Zipkin 제거)
 * 지금은 이 플래그가 무엇을 유실시키지 않는다. 그래도 '01' 로 고정하는 이유가 둘 남는다.
 *   · TwP 모드의 sentry-trace 는 sampled 자리가 비어 있을 수(deferred) 있어 변환 시 어차피 채워야 한다.
 *   · 백엔드(Micrometer OTel 의 ParentBased 샘플러)는 인바운드 sampled 플래그를 로컬 샘플링 확률보다
 *     우선하므로, 훗날 exporter 를 붙이는 날 이 파일을 다시 손대지 않아도 된다.
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
