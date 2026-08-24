/**
 * Sentry 이벤트 가공 순수 함수 — @sentry/nextjs 를 import 하지 않아 vitest node 환경에서 가볍게 검증한다.
 * 브라우저(instrumentation-client.ts)·서버(sentry.server.config.ts) beforeSend 가 공유한다.
 */

type TraceTaggable = {
  contexts?: { trace?: { trace_id?: string } };
  tags?: Record<string, unknown>;
};

/**
 * 이벤트의 contexts.trace.trace_id 를 tags.traceId 로 복사한다.
 * GlitchTip 이슈 검색은 태그를 대상으로 하므로, 백엔드 tb_system_log.trace_id 와 같은 값으로 이벤트를 찾을 수 있게 된다.
 * 이미 tags.traceId 가 있으면 덮어쓰지 않는다.
 */
export function tagTraceId<E extends TraceTaggable>(event: E): E {
  const traceId = event.contexts?.trace?.trace_id;
  if (!traceId || event.tags?.traceId) return event;
  return { ...event, tags: { ...event.tags, traceId } };
}
