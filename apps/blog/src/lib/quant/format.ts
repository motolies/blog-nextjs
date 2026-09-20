/**
 * run 수치 표기 — 소요 시간·토큰·비용. React 무의존 순수 함수.
 */
import { formatCompact } from '../statFormat';

/** 소요 시간 — 850ms · 12.3초 · 4분 05초 · 1시간 12분. null 은 아직 끝나지 않았거나 기록이 없다. */
export function formatDurationMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}초`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 ${String(Math.floor(seconds % 60)).padStart(2, '0')}초`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 ${String(minutes % 60).padStart(2, '0')}분`;
}

/** 토큰 수 — 1,234 / 12.3천 / 1.2만. 0 은 '0'. */
export function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return formatCompact(value);
}

/**
 * LLM 비용. `advisor.cost.*` 단가가 0 이면 백엔드가 비용을 계산하지 않아 항상 0 이다 —
 * 그 0 을 "무료"로 오독하지 않도록 '단가 미설정' 으로 쓴다. BigDecimal 이 문자열로 올 수 있어 Number 로 받는다.
 */
export function formatCostUsd(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '단가 미설정';
  const cost = Number(value);
  if (!Number.isFinite(cost) || cost === 0) return '단가 미설정';
  return `$${cost.toFixed(4)}`;
}

/** "호출 / 실패" — API 호출 수 옆에 실패를 붙인다. 실패 0 은 숫자를 감추지 않고 그대로 보여준다. */
export function formatCallsWithFailures(calls: number, failures: number): string {
  return `${formatCompact(calls)} / ${formatCompact(failures)}`;
}
