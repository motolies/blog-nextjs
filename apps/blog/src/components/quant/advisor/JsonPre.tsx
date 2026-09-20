import { prettyJson } from './kpiFormat';

/**
 * 원문 블록 — `api-log` 상세 다이얼로그의 `<pre>` 스타일을 그대로 쓴다(프롬프트 원문·metadata·채팅 본문).
 * `break-all` + `whitespace-pre-wrap` 이라 JSON 긴 토큰도 다이얼로그 폭 안에서 꺾인다(가로 넘침 함정 회피).
 * `'use client'` 가 없다 — 순수 표시.
 */
export function JsonPre({
  value,
  maxHeightClass = 'max-h-[40vh]',
}: {
  value: string | Record<string, unknown> | unknown[] | null | undefined;
  /** 본문 높이 상한 — 다이얼로그 안 여러 블록이면 낮게, 단독이면 높게. */
  maxHeightClass?: string;
}) {
  const text = prettyJson(value ?? null);
  return (
    <pre
      className={`m-0 ${maxHeightClass} overflow-auto whitespace-pre-wrap break-all rounded-dl-container bg-dl-grid-header p-3 font-dl-mono text-dl-fg text-dl-xs`}
    >
      {text || '-'}
    </pre>
  );
}
