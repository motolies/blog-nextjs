'use client';

import {
  Badge,
  IconButton,
  InlineNotice,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useConfirm,
} from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { RunStatusBadge } from '@/components/quant/RunStatusBadge';
import type { RunActions } from '@/components/quant/useRunActions';
import { type AdvisorDisabled, isAdvisorDisabled } from '@/hooks/useQuant';
import { formatDurationMs } from '@/lib/quant/format';
import { jobLabel } from '@/lib/quant/jobCatalog';
import { formatRelativeTime } from '@/lib/statFormat';
import type {
  AdvisorGateResponse,
  AdvisorRunResponse,
  CollectRunResponse,
  ManualTrigger,
  RunModule,
} from '@/types/quant';
import type { HealthStats, SchedulerHealthState, SchedulerStatus } from '@/types/stats';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { adviseConfirmMessage } from './GateWidget';

/** HealthSection.stateTone 과 같은 표 — 스케줄러 상태 라벨·톤은 대시보드와 같아야 한다. */
const STATE_LABEL: Record<SchedulerHealthState, string> = {
  RUNNING: '실행 중',
  OK: '주기 내',
  STALE: '지연',
  NEVER_RUN: '실행 기록 없음',
  DISABLED: '사용 안 함',
};

function stateTone(
  state: SchedulerHealthState,
): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' {
  switch (state) {
    case 'RUNNING':
      return 'primary';
    case 'OK':
      return 'success';
    case 'STALE':
      return 'danger';
    case 'NEVER_RUN':
      return 'warning';
    default:
      return 'neutral';
  }
}

export type TriggerGroup = {
  key: string;
  trigger: ManualTrigger;
  /** 같은 잡을 가리키는 스케줄러 행들(eventfeed am/pm → NEWS 는 2행). */
  schedulers: SchedulerStatus[];
};

/**
 * `manualTrigger` 가 있는 행을 (module, jobTypes) 로 묶는다 — 같은 NEWS 를 두 cron 이 부르므로 버튼은 하나여야 한다.
 * `undefined`(백엔드 구버전)와 `null`(수동 실행 대상 아님)을 가른다: 전부 undefined 면 안내 배너.
 */
export function groupTriggers(schedulers: readonly SchedulerStatus[]): {
  groups: TriggerGroup[];
  legacyBackend: boolean;
} {
  const legacyBackend =
    schedulers.length > 0 && schedulers.every((s) => s.manualTrigger === undefined);
  const groups = new Map<string, TriggerGroup>();
  for (const scheduler of schedulers) {
    const trigger = scheduler.manualTrigger;
    if (!trigger) continue;
    const key = `${trigger.module}:${trigger.jobTypes.join('+')}`;
    const group = groups.get(key);
    if (group) group.schedulers.push(scheduler);
    else groups.set(key, { key, trigger, schedulers: [scheduler] });
  }
  return { groups: [...groups.values()], legacyBackend };
}

/** 그룹의 대표 잡(첫 jobType)의 최신 run — 상태 칩·소요 표시용. */
function latestRunFor(
  trigger: ManualTrigger,
  collect: readonly CollectRunResponse[] | undefined,
  advisor: readonly AdvisorRunResponse[] | AdvisorDisabled | undefined,
): CollectRunResponse | AdvisorRunResponse | undefined {
  const jobType = trigger.jobTypes[0];
  if (trigger.module === 'STOCK') return collect?.find((run) => run.jobType === jobType);
  if (!advisor || isAdvisorDisabled(advisor)) return undefined;
  return advisor.find((run) => run.jobType === jobType);
}

export function SchedulerTriggerWidget({
  health,
  collect,
  advisor,
  gate,
  actions,
}: {
  health: UseQueryResult<HealthStats>;
  collect: UseQueryResult<CollectRunResponse[]>;
  advisor: UseQueryResult<AdvisorRunResponse[] | AdvisorDisabled>;
  gate: UseQueryResult<AdvisorGateResponse | AdvisorDisabled>;
  actions: RunActions;
}) {
  const askConfirm = useConfirm();

  const handleTrigger = async (group: TriggerGroup) => {
    const { module, jobTypes } = group.trigger;
    // ADVISE 만 confirm — 게이트 사유·SKIPPED 예고·마감 알림을 먼저 보인다. 나머지는 409 보호·취소 가능이라 바로 간다(핫딜 선례).
    if (module === 'ADVISOR' && jobTypes.includes('ADVISE')) {
      const current = gate.data && !isAdvisorDisabled(gate.data) ? gate.data : null;
      const ok = await askConfirm({
        message: adviseConfirmMessage(current),
        confirmLabel: '지금 판단 실행',
      });
      if (!ok) return;
    }
    await actions.triggerSequence(module as RunModule, jobTypes);
  };

  return (
    <DashboardWidget
      id="quant-schedulers"
      title="스케줄러"
      caption="수집·판단 잡 · 지금 실행"
      query={health}
      isEmpty={(data) =>
        groupTriggers(data.schedulers).groups.length === 0 &&
        !groupTriggers(data.schedulers).legacyBackend
      }
      empty={{ message: '수동 실행할 수 있는 스케줄러가 없습니다' }}
      errorMessage="스케줄러 상태를 불러오지 못했습니다."
    >
      {(data) => {
        const { groups, legacyBackend } = groupTriggers(data.schedulers);
        if (legacyBackend) {
          return (
            <InlineNotice tone="muted">
              백엔드 구버전 — 수동 실행 버튼은 배포 후 표시됩니다.
            </InlineNotice>
          );
        }
        return (
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>잡</TableHeaderCell>
                <TableHeaderCell className="whitespace-normal">최근 run</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  <span className="sr-only">실행</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => {
                const latest = latestRunFor(group.trigger, collect.data, advisor.data);
                const busy = group.trigger.jobTypes.some((jobType) =>
                  actions.isBusy(`trigger:${group.trigger.module}:${jobType}`),
                );
                const label = group.trigger.jobTypes
                  .map((jobType) => jobLabel(group.trigger.module, jobType))
                  .join(' → ');
                return (
                  <TableRow key={group.key}>
                    <TableCell>
                      <span className="flex flex-col gap-1">
                        <span className="font-semibold wrap-anywhere">{label}</span>
                        {group.schedulers.map((scheduler) => (
                          <span
                            key={scheduler.lockName}
                            className="flex flex-wrap items-center gap-1.5 text-dl-xs text-[color:var(--admin-text-muted)]"
                            title={scheduler.cronExpression ?? undefined}
                          >
                            <span className="wrap-anywhere">{scheduler.displayName}</span>
                            <Badge tone={stateTone(scheduler.state)} size="xs">
                              {STATE_LABEL[scheduler.state]}
                            </Badge>
                          </span>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {latest ? (
                        <span className="flex flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <RunStatusBadge status={latest.status} />
                            <span className="text-dl-xs text-[color:var(--admin-text-faint)]">
                              #{latest.runId}
                            </span>
                          </span>
                          <span
                            className="text-dl-xs text-[color:var(--admin-text-muted)]"
                            title={formatUtcToLocal(latest.startedAt)}
                          >
                            {formatRelativeTime(latest.startedAt)}
                            {latest.durationMs !== null
                              ? ` · ${formatDurationMs(latest.durationMs)}`
                              : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="text-dl-xs text-[color:var(--admin-text-faint)]">
                          최근 50건에 없음
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <IconButton
                        icon={Play}
                        label={`${label} 지금 실행`}
                        title={`${label} 지금 실행`}
                        size="xs"
                        iconSize="sm"
                        tone="primary"
                        disabled={busy}
                        onClick={() => handleTrigger(group)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DashboardTable>
        );
      }}
    </DashboardWidget>
  );
}
