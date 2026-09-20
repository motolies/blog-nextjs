'use client';

import { cn } from '@hvy/ui';
import { stepStatusLabel, stepStatusTone } from '@/lib/quant/runStatus';
import { describeStepSummary, summarizeSteps } from '@/lib/quant/steps';
import type { RunStep } from '@/types/quant';

/**
 * 파이프라인 단계 세그먼트 스트립 — Badge 10개 대신 flex-1 N등분 막대.
 *
 * 각 세그먼트는 `button` + `aria-label="PRICE 실패"` 라 스크린리더·키보드가 단계 단위로 닿는다(UX 리뷰 요구).
 * 클릭은 전부 같은 목적지(run 상세)로 간다 — 단계별 상세는 없고 "어디서 깨졸나" 를 가리키는 손가락이다.
 * 색은 dl 의미색 면(500 계열)만 쓴다 — 글자가 아니라 형태이므로 `-ink` 가 아니다(badge.tsx 규칙의 반대편).
 *
 * **히트 영역과 시각 높이를 분리한다**: 버튼은 24px(`h-6`, 아이콘 축과 같은 DataGrid `size-6` 선례)이고
 * 색 막대는 그 안의 `<span>` 8px 다 — 8px 막대를 그대로 버튼으로 두면 터치·마우스로 정확히 누르기 어렵다.
 */
const SEGMENT_TONE: Record<string, string> = {
  success: 'bg-dl-success',
  danger: 'bg-dl-danger',
  warning: 'bg-dl-warning',
  primary: 'bg-dl-primary',
  neutral: 'bg-dl-outline-border',
};

export function StepStrip({
  steps,
  onSelect,
  label,
}: {
  steps: readonly RunStep[];
  onSelect: (step: RunStep) => void;
  /** 그룹 이름 — "DAILY 단계" 처럼 어느 run 의 단계인지. */
  label: string;
}) {
  const summary = summarizeSteps(steps);
  return (
    <div className="flex flex-col gap-1">
      {/* biome-ignore lint/a11y/useSemanticElements: 세그먼트 묶음은 role=group 이 맞다 — <fieldset> 은 폼 요소다 */}
      <div role="group" aria-label={label} className="flex gap-px">
        {steps.map((step) => {
          const tone = stepStatusTone(step.status);
          return (
            <button
              key={step.step}
              type="button"
              aria-label={`${step.step} ${stepStatusLabel(step.status)}${step.reason ? ` — ${step.reason}` : ''}`}
              title={`${step.step} · ${stepStatusLabel(step.status)}${step.reason ? ` · ${step.reason}` : ''}`}
              onClick={() => onSelect(step)}
              className={cn(
                'group/seg flex h-6 min-w-0 flex-1 cursor-pointer items-center rounded-dl-badge',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dl-primary',
                // 첫/끝 막대만 바깥 모서리를 둥글게 — 막대들이 이어져 하나의 필 모양이 된다
                '[&:first-child>span]:rounded-l-dl-pill [&:last-child>span]:rounded-r-dl-pill',
              )}
            >
              <span
                className={cn(
                  'block h-2 w-full transition-opacity group-hover/seg:opacity-80',
                  SEGMENT_TONE[tone] ?? SEGMENT_TONE.neutral,
                )}
              />
            </button>
          );
        })}
      </div>
      <p className="text-dl-xs text-[color:var(--admin-text-muted)] wrap-anywhere">
        {describeStepSummary(summary)}
      </p>
    </div>
  );
}
