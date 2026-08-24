import { describe, expect, it } from 'vitest';
import { tagTraceId } from './sentryEvent';

const TRACE_ID = 'aabbccddeeff00112233445566778899';

describe('tagTraceId', () => {
  it('contexts.trace.trace_id 를 tags.traceId 로 복사한다', () => {
    const event = { contexts: { trace: { trace_id: TRACE_ID } } };
    expect(tagTraceId(event)).toEqual({
      contexts: { trace: { trace_id: TRACE_ID } },
      tags: { traceId: TRACE_ID },
    });
  });

  it('trace_id 가 없으면 이벤트를 그대로 돌려준다', () => {
    const noTrace = { contexts: { trace: {} } };
    expect(tagTraceId(noTrace)).toBe(noTrace);
    const noContexts = { tags: { source: 'axios' } };
    expect(tagTraceId(noContexts)).toBe(noContexts);
  });

  it('이미 tags.traceId 가 있으면 덮어쓰지 않는다', () => {
    const event = {
      contexts: { trace: { trace_id: TRACE_ID } },
      tags: { traceId: 'manual-trace-id' },
    };
    expect(tagTraceId(event)).toBe(event);
    expect(tagTraceId(event).tags.traceId).toBe('manual-trace-id');
  });

  it('기존 다른 태그는 유지한 채 traceId 만 추가한다', () => {
    const event = {
      contexts: { trace: { trace_id: TRACE_ID } },
      tags: { source: 'bff-proxy', route: '/api/post' },
    };
    expect(tagTraceId(event).tags).toEqual({
      source: 'bff-proxy',
      route: '/api/post',
      traceId: TRACE_ID,
    });
  });
});
