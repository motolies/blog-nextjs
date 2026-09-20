'use client';

import { Badge, EmptyState, ErrorState } from '@hvy/ui';
import { variantLabel, variantTone } from './advisorLabels';
import { useAdvicePrompt } from './advisorQueries';
import { JsonPre } from './JsonPre';

/**
 * 판단 상세 "프롬프트 원문" 서브탭 — 서브탭이 열렸을 때만(`enabled`) `GET /advices/{id}/prompt` 를 부른다.
 * variant(LIVE·LLM_NOMEM …)마다 입력 payload · options · 모델 원 출력 세 블록을 `<pre>` 로 그린다(api-log 스타일).
 * 원문은 run 기준으로 저장되므로 판단을 삭제해도 남는다 — 삭제 확인 문구가 이를 말한다.
 */
export function AdvicePromptPanel({ adviceId, enabled }: { adviceId: string; enabled: boolean }) {
  const query = useAdvicePrompt(adviceId, enabled);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <span className="block h-4 w-1/3 animate-pulse rounded-dl-badge bg-dl-option-hover motion-reduce:animate-none" />
        <span className="block h-40 w-full animate-pulse rounded-dl-container bg-dl-option-hover motion-reduce:animate-none" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState message="프롬프트 원문을 불러오지 못했습니다." onRetry={query.refetch} />;
  }

  const entries = Object.entries(query.data);
  if (entries.length === 0) {
    return (
      <EmptyState
        message="저장된 프롬프트 원문이 없습니다"
        hint="QUANT_TOPN 처럼 LLM 을 부르지 않는 변형이거나 원문 저장이 꺼진 run 입니다"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map(([variant, row]) => (
        <section key={variant} className="flex flex-col gap-2">
          <h3 className="flex flex-wrap items-center gap-2 text-dl-sm font-semibold text-dl-fg">
            <Badge tone={variantTone(variant)} size="sm">
              {variantLabel(variant)}
            </Badge>
            <span className="text-dl-fg-muted">
              {row.promptVersion} · run #{row.runId}
            </span>
            <span className="font-dl-mono text-dl-fg-muted text-dl-xs wrap-anywhere">
              system sha256 {row.systemSha256}
            </span>
          </h3>
          <h4 className="text-dl-xs font-semibold text-dl-fg-muted">입력 payload</h4>
          <JsonPre value={row.userPayload} maxHeightClass="max-h-[50vh]" />
          <h4 className="text-dl-xs font-semibold text-dl-fg-muted">호출 옵션</h4>
          <JsonPre value={row.optionsJson} maxHeightClass="max-h-[30vh]" />
          <h4 className="text-dl-xs font-semibold text-dl-fg-muted">모델 원 출력</h4>
          <JsonPre value={row.rawOutput} maxHeightClass="max-h-[50vh]" />
        </section>
      ))}
    </div>
  );
}
