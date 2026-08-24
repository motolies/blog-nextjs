import { showToast } from '@hvy/ui';
import { getApiErrorTraceId } from './apiError';

/** 액션이 있는 토스트는 누를 시간이 필요하다 — 기본 3초 대신 8초 */
const TRACE_TOAST_DURATION_MS = 8000;

/**
 * API 실패 토스트 — traceId 가 있으면 앞 8자를 제목에 보이고 '복사' 액션으로 전체 값을 클립보드에 넣는다.
 * 사용자가 신고한 traceId 로 admin/system-log 의 Trace ID 검색 → 백엔드 스택트레이스까지 바로 이어진다.
 * traceId 를 못 구하면(로컬 예외·헤더 없음) 일반 오류 토스트와 동일하게 동작한다.
 */
export function showApiErrorToast(message: string, error?: unknown): void {
  const traceId = getApiErrorTraceId(error);
  if (!traceId) {
    showToast(message, 'error');
    return;
  }
  showToast(message, 'error', {
    title: `trace ${traceId.slice(0, 8)}`,
    action: { label: 'traceId 복사', onClick: () => copyTraceId(traceId) },
    durationMs: TRACE_TOAST_DURATION_MS,
  });
}

// 클립보드 거부(권한·비보안 컨텍스트)를 unhandled rejection 으로 흘리면 Sentry 노이즈가 된다 — 토스트로 알린다
function copyTraceId(traceId: string): void {
  const write = navigator.clipboard?.writeText(traceId);
  if (!write) {
    showToast('클립보드 API를 사용할 수 없습니다.', 'error');
    return;
  }
  write.catch(() => showToast('traceId 복사에 실패했습니다.', 'error'));
}
