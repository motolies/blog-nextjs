import { describe, expect, it } from 'vitest';
import { sentryTraceToTraceparent, traceparentToSentryTrace } from './traceparent';

const TRACE_ID = 'aabbccddeeff00112233445566778899';
const SPAN_ID = '1122334455667788';

describe('sentryTraceToTraceparent', () => {
  it('sampled 플래그와 무관하게 flags 를 01 로 고정한다', () => {
    expect(sentryTraceToTraceparent(`${TRACE_ID}-${SPAN_ID}-1`)).toBe(
      `00-${TRACE_ID}-${SPAN_ID}-01`,
    );
    expect(sentryTraceToTraceparent(`${TRACE_ID}-${SPAN_ID}-0`)).toBe(
      `00-${TRACE_ID}-${SPAN_ID}-01`,
    );
  });

  it('TwP 의 deferred(sampled 자리 없음) 형식도 변환한다', () => {
    expect(sentryTraceToTraceparent(`${TRACE_ID}-${SPAN_ID}`)).toBe(`00-${TRACE_ID}-${SPAN_ID}-01`);
  });

  it('불량 입력은 undefined 를 반환한다', () => {
    expect(sentryTraceToTraceparent(undefined)).toBeUndefined();
    expect(sentryTraceToTraceparent('')).toBeUndefined();
    expect(sentryTraceToTraceparent('not-a-trace')).toBeUndefined();
    expect(sentryTraceToTraceparent(`${TRACE_ID.slice(0, 31)}-${SPAN_ID}-1`)).toBeUndefined();
    expect(sentryTraceToTraceparent(`${TRACE_ID.toUpperCase()}-${SPAN_ID}-1`)).toBeUndefined();
  });

  it('all-zero traceId/spanId 는 W3C 무효 값이라 거부한다', () => {
    expect(sentryTraceToTraceparent(`${'0'.repeat(32)}-${SPAN_ID}-1`)).toBeUndefined();
    expect(sentryTraceToTraceparent(`${TRACE_ID}-${'0'.repeat(16)}-1`)).toBeUndefined();
  });
});

describe('traceparentToSentryTrace', () => {
  it('flags 최하위 비트를 sampled 로 해석한다', () => {
    expect(traceparentToSentryTrace(`00-${TRACE_ID}-${SPAN_ID}-01`)).toBe(
      `${TRACE_ID}-${SPAN_ID}-1`,
    );
    expect(traceparentToSentryTrace(`00-${TRACE_ID}-${SPAN_ID}-00`)).toBe(
      `${TRACE_ID}-${SPAN_ID}-0`,
    );
    // 0xff 처럼 다른 비트가 켜져 있어도 sampled 비트만 본다
    expect(traceparentToSentryTrace(`00-${TRACE_ID}-${SPAN_ID}-ff`)).toBe(
      `${TRACE_ID}-${SPAN_ID}-1`,
    );
  });

  it('문자열이 아니거나 형식이 어긋나면 undefined 를 반환한다', () => {
    expect(traceparentToSentryTrace(undefined)).toBeUndefined();
    expect(traceparentToSentryTrace(['00', TRACE_ID, SPAN_ID, '01'])).toBeUndefined();
    expect(traceparentToSentryTrace(`01-${TRACE_ID}-${SPAN_ID}-01`)).toBeUndefined(); // 미지원 version
    expect(traceparentToSentryTrace(`00-${TRACE_ID}-${SPAN_ID}`)).toBeUndefined(); // flags 누락
    expect(traceparentToSentryTrace(`00-${'0'.repeat(32)}-${SPAN_ID}-01`)).toBeUndefined();
  });

  it('두 함수는 라운드트립이 성립한다', () => {
    const traceparent = sentryTraceToTraceparent(`${TRACE_ID}-${SPAN_ID}`);
    expect(traceparentToSentryTrace(traceparent)).toBe(`${TRACE_ID}-${SPAN_ID}-1`);
  });
});
