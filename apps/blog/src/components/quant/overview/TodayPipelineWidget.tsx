'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { RunStatusBadge } from '@/components/quant/RunStatusBadge';
import { formatDurationMs } from '@/lib/quant/format';
import { kstDateOf } from '@/lib/quant/kstDate';
import { QUANT_ROUTES, runHref } from '@/lib/quant/routes';
import { stepsOf } from '@/lib/quant/steps';
import { formatRelativeTime } from '@/lib/statFormat';
import type { CollectJobType, CollectRunResponse } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { StepStrip } from './StepStrip';

/** 오늘 위젯이 보는 스케줄 잡 — 이 순서로 그린다(하루의 시간 순서: 마스터 → 해외 → 거시 → 뉴스 → DAILY). */
const TODAY_JOBS: readonly CollectJobType[] = [
  'MASTER',
  'HOLIDAY',
  'OVERSEAS_DAILY',
  'MACRO',
  'NEWS',
  'DAILY',
];

/**
 * 오늘 실행된 잡별 최신 run. `targetDate == 오늘` 또는 `startedAt` 의 KST 날짜가 오늘 —
 * OVERSEAS_DAILY 처럼 targetDate 가 전 거래일을 가리킬 수 있어 둘 중 하나면 오늘 것으로 본다.
 * 응답은 startedAt DESC 라 잡별 첫 항목이 최신이다.
 */
export function pickTodayRuns(
  runs: readonly CollectRunResponse[],
  today: string,
): CollectRunResponse[] {
  const latest = new Map<CollectJobType, CollectRunResponse>();
  for (const run of runs) {
    if (!TODAY_JOBS.includes(run.jobType)) continue;
    if (run.targetDate !== today && kstDateOf(run.startedAt) !== today) continue;
    if (!latest.has(run.jobType)) latest.set(run.jobType, run);
  }
  return TODAY_JOBS.flatMap((jobType) => {
    const run = latest.get(jobType);
    return run ? [run] : [];
  });
}

export function TodayPipelineWidget({
  query,
  today,
}: {
  query: UseQueryResult<CollectRunResponse[]>;
  today: string;
}) {
  const router = useRouter();
  return (
    <DashboardWidget
      id="quant-today"
      title="오늘 파이프라인"
      caption={`${today} KST · 잡별 최신 run`}
      query={query}
      isEmpty={(runs) => pickTodayRuns(runs, today).length === 0}
      empty={{
        message: '오늘 실행된 수집이 없습니다',
        hint: 'MASTER 05:30 · OVERSEAS 06:30(화~토) · MACRO 06:35 · NEWS 06:40 · DAILY 18:30(평일)',
      }}
      errorMessage="수집 run 을 불러오지 못했습니다."
      actions={
        <Link
          href={QUANT_ROUTES.collect}
          className="text-dl-xs text-dl-primary-ink hover:underline"
        >
          전체 이력
        </Link>
      }
    >
      {(runs) => (
        <ul className="flex flex-col gap-3">
          {pickTodayRuns(runs, today).map((run) => {
            const steps = stepsOf(run.metadata);
            return (
              <li key={run.runId} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    href={runHref('STOCK', run.runId)}
                    className="font-semibold text-dl-primary-ink hover:underline wrap-anywhere"
                  >
                    {run.jobDescription}
                  </Link>
                  <RunStatusBadge status={run.status} />
                  <span
                    className="text-dl-xs text-[color:var(--admin-text-faint)]"
                    title={formatUtcToLocal(run.startedAt)}
                  >
                    {formatRelativeTime(run.startedAt)}
                    {run.durationMs !== null
                      ? ` · ${formatDurationMs(run.durationMs)}`
                      : ' · 진행 중'}
                  </span>
                </div>
                {steps.length > 0 ? (
                  <StepStrip
                    steps={steps}
                    label={`${run.jobDescription} 단계`}
                    onSelect={() => router.push(runHref('STOCK', run.runId))}
                  />
                ) : run.errorMessage ? (
                  <p
                    className="line-clamp-2 text-dl-xs text-dl-danger-ink wrap-anywhere"
                    title={run.errorMessage}
                  >
                    {run.errorMessage}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardWidget>
  );
}
