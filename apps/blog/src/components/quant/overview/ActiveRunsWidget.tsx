'use client';

import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useConfirm,
} from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import { Ban, Ellipsis, Eye, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { RunStatusBadge } from '@/components/quant/RunStatusBadge';
import type { RunActions } from '@/components/quant/useRunActions';
import { type AdvisorDisabled, isAdvisorDisabled } from '@/hooks/useQuant';
import { formatDurationMs } from '@/lib/quant/format';
import { runHref } from '@/lib/quant/routes';
import { isFailureLike, isTerminal } from '@/lib/quant/runStatus';
import {
  advisorRerunArgs,
  describeBackfillRequest,
  isTickersTruncated,
  restoreBackfillRequest,
} from '@/lib/quant/stepRetry';
import { formatRelativeTime } from '@/lib/statFormat';
import type { AdvisorRunResponse, CollectRunResponse, RunModule } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';

/** 최근 실패 창 — 배너와 같은 24시간. */
const RECENT_WINDOW_MS = 24 * 3600 * 1000;

export type ActiveRow =
  | { module: 'STOCK'; run: CollectRunResponse }
  | { module: 'ADVISOR'; run: AdvisorRunResponse };

/**
 * RUNNING 전부 + 24시간 안에 끝난 FAILED/PARTIAL/CANCELED. 시작 시각 DESC.
 * 종료 시각이 없는(취소 직후 등) 실패 run 은 시작 시각으로 판정한다.
 */
export function pickActiveRows(
  collect: readonly CollectRunResponse[] | undefined,
  advisor: readonly AdvisorRunResponse[] | AdvisorDisabled | undefined,
  now: Date = new Date(),
): ActiveRow[] {
  const cutoff = now.getTime() - RECENT_WINDOW_MS;
  const recent = (run: { status: string; startedAt: string; finishedAt: string | null }) => {
    if (run.status === 'RUNNING') return true;
    if (!isFailureLike(run.status)) return false;
    return new Date(run.finishedAt ?? run.startedAt).getTime() >= cutoff;
  };
  const rows: ActiveRow[] = [];
  for (const run of collect ?? []) if (recent(run)) rows.push({ module: 'STOCK', run });
  if (advisor && !isAdvisorDisabled(advisor)) {
    for (const run of advisor) if (recent(run)) rows.push({ module: 'ADVISOR', run });
  }
  return rows.sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt));
}

const MODULE_LABEL: Record<RunModule, string> = { STOCK: '수집', ADVISOR: 'AI' };

export function ActiveRunsWidget({
  collect,
  advisor,
  today,
  actions,
}: {
  collect: UseQueryResult<CollectRunResponse[]>;
  advisor: UseQueryResult<AdvisorRunResponse[] | AdvisorDisabled>;
  today: string;
  actions: RunActions;
}) {
  const router = useRouter();
  const askConfirm = useConfirm();

  // 두 쿼리를 한 위젯으로 합친다 — advisor 는 꺼져 있거나(404→disabled) 실패해도 stock 쪽은 보여야 한다.
  const combined = {
    data: collect.data === undefined ? undefined : pickActiveRows(collect.data, advisor.data),
    isPending: collect.isPending,
    isFetching: collect.isFetching || advisor.isFetching,
    isError: collect.isError,
    refetch: () => {
      collect.refetch();
      advisor.refetch();
    },
  };

  const handleCancel = async (row: ActiveRow) => {
    const ok = await askConfirm({
      message: `${row.run.jobDescription} run #${row.run.runId} 를 취소합니다. 다음 종목/단계 경계에서 멈추고 저장된 데이터는 남습니다.`,
      confirmLabel: '취소 요청',
    });
    if (ok) await actions.cancel(row.module, row.run);
  };

  const handleRerun = async (row: ActiveRow) => {
    if (row.module === 'STOCK') {
      const body = restoreBackfillRequest(row.run) ?? {};
      const ok = await askConfirm({
        message: `${row.run.jobDescription} 을 같은 인자로 다시 실행합니다 — ${describeBackfillRequest(body)}. 체크포인트 커서부터 이어받습니다.${row.run.jobType === 'DAILY' ? ' DAILY 는 오늘(KST) 기준 증분 수집입니다.' : ''}`,
        confirmLabel: '재실행',
      });
      if (ok) await actions.rerunStock(row.run, false);
      return;
    }
    const args = advisorRerunArgs(row.run, today);
    const ok = await askConfirm({
      message: `${row.run.jobDescription} 을 다시 실행합니다 (${args.baseDate ? `기준일 ${args.baseDate}` : '오늘 기준'}).${row.run.jobType === 'ADVISE' ? ' 이미 LIVE 판단이 있으면 SKIPPED 로 닫힙니다.' : ''}`,
      confirmLabel: '재실행',
    });
    if (ok) await actions.rerunAdvisor(row.run, today);
  };

  return (
    <DashboardWidget
      id="quant-active"
      title="실행 중 / 최근 실패"
      caption="RUNNING 전부 · 24시간 내 실패·부분·취소"
      query={combined}
      isEmpty={(rows) => rows.length === 0}
      empty={{ message: '실행 중이거나 24시간 내 실패한 run 이 없습니다' }}
      errorMessage="run 목록을 불러오지 못했습니다."
    >
      {(rows) => (
        <div className="flex flex-col gap-2">
          {advisor.isError ? (
            <p className="text-dl-xs text-dl-danger-ink">
              AI 판단 run 은 불러오지 못했습니다 — 수집 run 만 표시합니다.
            </p>
          ) : null}
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>잡</TableHeaderCell>
                <TableHeaderCell className="whitespace-normal">시작</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  <span className="sr-only">작업</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const terminal = isTerminal(row.run.status);
                const truncated = row.module === 'STOCK' && isTickersTruncated(row.run);
                return (
                  <TableRow key={`${row.module}-${row.run.runId}`}>
                    <TableCell>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={row.module === 'STOCK' ? 'primary' : 'neutral'} size="xs">
                          {MODULE_LABEL[row.module]}
                        </Badge>
                        <span className="wrap-anywhere">{row.run.jobDescription}</span>
                        <span className="text-dl-xs text-[color:var(--admin-text-faint)]">
                          #{row.run.runId}
                        </span>
                      </span>
                      {row.run.errorMessage ? (
                        <span
                          className="mt-0.5 block line-clamp-1 text-dl-xs text-[color:var(--admin-text-muted)] wrap-anywhere"
                          title={row.run.errorMessage}
                        >
                          {row.run.errorMessage}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell title={formatUtcToLocal(row.run.startedAt)}>
                      {formatRelativeTime(row.run.startedAt)}
                      {row.run.durationMs !== null ? (
                        <span className="block text-dl-xs text-[color:var(--admin-text-faint)]">
                          {formatDurationMs(row.run.durationMs)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <RunStatusBadge status={row.run.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <IconButton
                            icon={Ellipsis}
                            label={`run #${row.run.runId} 작업`}
                            size="xs"
                            iconSize="sm"
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            icon={Eye}
                            onSelect={() => router.push(runHref(row.module, row.run.runId))}
                          >
                            상세
                          </DropdownMenuItem>
                          {terminal ? (
                            <DropdownMenuItem
                              icon={RotateCcw}
                              disabled={truncated}
                              onSelect={() => handleRerun(row)}
                            >
                              {truncated
                                ? '재실행 불가 — 종목 20개 초과, 수동 실행 탭에서 재지정'
                                : '재실행'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              icon={Ban}
                              destructive
                              onSelect={() => handleCancel(row)}
                            >
                              취소
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DashboardTable>
        </div>
      )}
    </DashboardWidget>
  );
}
