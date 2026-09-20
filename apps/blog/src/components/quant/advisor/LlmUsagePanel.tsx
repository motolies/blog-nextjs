'use client';

import { StatTile } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Sparkline } from '@/components/common/chart/Sparkline';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { type AdvisorDisabled, isAdvisorDisabled } from '@/hooks/useQuant';
import { formatTokens } from '@/lib/quant/format';
import {
  dailyTokenSeries,
  hasCostPricing,
  summarizeUsage,
  totalTokens,
  USAGE_WINDOW_DAYS,
  USAGE_WINDOW_LABEL,
  type UsageWindow,
} from '@/lib/quant/usage';
import { formatCompact } from '@/lib/statFormat';
import type { AdvisorRunResponse } from '@/types/quant';
import { ADVISOR_DISABLED_EMPTY } from './advisorLabels';

const WINDOWS: readonly UsageWindow[] = ['today', 'week', 'month'];

/**
 * LLM 사용량 — advisor run(limit 500) 을 클라에서 접는다(`lib/quant/usage.ts`).
 * 타일 3개(오늘/7일/30일: 값=입력+출력 토큰, 힌트=호출·추론·캐시) + 30일 일별 토큰 스파크라인.
 * 비용은 보조 표기다 — `advisor.cost.*` 단가가 0 이면 항상 0 이라 합이 0 이면 "단가 미설정" 으로 쓴다.
 * 색은 `Sparkline` 이 `--admin-chart-*` var 로만 받는다(verify:tokens).
 */
export function LlmUsagePanel({
  query,
  today,
}: {
  query: UseQueryResult<AdvisorRunResponse[] | AdvisorDisabled>;
  today: string;
}) {
  const runs = isAdvisorDisabled(query.data) ? [] : (query.data ?? []);
  const summary = useMemo(() => summarizeUsage(runs, today), [runs, today]);
  const series = useMemo(
    () => dailyTokenSeries(runs, today, USAGE_WINDOW_DAYS.month),
    [runs, today],
  );
  const month = summary.month;

  return (
    <DashboardWidget
      id="advisor-llm-usage"
      title="LLM 사용량"
      caption={`최근 run ${runs.length}건 기준 · KST 일 단위 · 토큰 = 입력+출력`}
      query={query}
      isEmpty={(data) => isAdvisorDisabled(data)}
      empty={ADVISOR_DISABLED_EMPTY}
      errorMessage="LLM 사용량을 불러오지 못했습니다."
    >
      {() => (
        <div className="flex flex-col gap-4">
          <div className="admin-stat-grid">
            {WINDOWS.map((window) => {
              const totals = summary[window];
              return (
                <div key={window} className="col-span-12 sm:col-span-4">
                  <StatTile
                    label={`${USAGE_WINDOW_LABEL[window]} 토큰`}
                    hint={
                      <span className="wrap-anywhere">
                        호출 {formatCompact(totals.llmCalls)}회 · 추론{' '}
                        {formatTokens(totals.reasoningTokens)} · 캐시{' '}
                        {formatTokens(totals.cachedTokens)}
                      </span>
                    }
                    value={formatTokens(totalTokens(totals))}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-1">
            <Sparkline
              points={series}
              ariaLabel="최근 30일 일별 LLM 토큰(입력+출력)"
              formatValue={(value) => formatTokens(value)}
            />
            <p className="text-dl-xs text-[color:var(--admin-text-faint)]">
              30일 합계 {formatTokens(totalTokens(month))} · 비용{' '}
              {hasCostPricing(month) ? `$${month.costUsd.toFixed(4)}` : '단가 미설정'}
              {hasCostPricing(month)
                ? ''
                : ' (advisor.cost.input/output-per-1m-usd 가 0 — 토큰·호출 수가 1차 지표)'}
            </p>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
}
