'use client';

import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import Link from 'next/link';
import { BarList } from '@/components/common/chart/BarList';
import { formatCompact, formatRelativeTime, truncateMiddle } from '@/lib/statFormat';
import type { HealthStats, SchedulerHealthState, SchedulerStatus } from '@/types/stats';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { DashboardWidget } from './DashboardWidget';

interface HealthSectionProps {
  query: UseQueryResult<HealthStats>;
}

export function HealthSection({ query }: HealthSectionProps) {
  return (
    <>
      <DashboardWidget
        title="최근 오류"
        caption="24시간 · 클릭하면 시스템 로그로"
        query={query}
        isEmpty={(data) => data.recentErrors.length === 0}
        empty={{ message: '지난 24시간 오류가 없습니다' }}
        errorMessage="오류 목록을 불러오지 못했습니다."
      >
        {(data) => (
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeaderCell>시각</TableHeaderCell>
                <TableHeaderCell>경로</TableHeaderCell>
                <TableHeaderCell>예외</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentErrors.map((error) => (
                <TableRow key={error.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatUtcToLocal(error.createdAt, 'MM-dd HH:mm')}
                  </TableCell>
                  <TableCell>
                    {/* traceId 로 시스템 로그를 바로 필터링한다 — 토스트의 traceId 복사 흐름과 같은 목적지 */}
                    {error.traceId ? (
                      <Link
                        href={`/admin/system-log?traceId=${error.traceId}`}
                        className="text-dl-primary-ink hover:underline"
                        title={error.requestUri ?? undefined}
                      >
                        {truncateMiddle(error.requestUri ?? error.methodName ?? '-', 28)}
                      </Link>
                    ) : (
                      <span title={error.requestUri ?? undefined}>
                        {truncateMiddle(error.requestUri ?? '-', 28)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell title={error.stackTraceHead ?? undefined}>
                    {truncateMiddle(error.stackTraceHead ?? '-', 40)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashboardWidget>

      <DashboardWidget
        title="느린 엔드포인트"
        caption="24시간 p95 · 5회 이상 호출"
        query={query}
        isEmpty={(data) => data.slowEndpoints.length === 0}
        empty={{ message: '집계할 만큼의 호출이 없습니다' }}
        errorMessage="응답시간 통계를 불러오지 못했습니다."
      >
        {(data) => (
          <BarList
            ariaLabel="느린 엔드포인트 p95"
            formatValue={(value) => `${formatCompact(value)}ms`}
            items={data.slowEndpoints.map((endpoint) => ({
              id: `${endpoint.httpMethodType}-${endpoint.uriPattern}`,
              label: truncateMiddle(endpoint.uriPattern, 32),
              labelText: endpoint.uriPattern,
              value: endpoint.p95ProcessTime,
              hint: `${endpoint.requestCount}회`,
              tone: 'warning' as const,
            }))}
          />
        )}
      </DashboardWidget>

      <DashboardWidget
        title="스케줄러 마지막 실행"
        // 라벨이 "정상"이 아니라 "마지막 실행"인 것은 정직성 문제다 — 아래 주석 참고
        caption="성공 여부는 알 수 없음"
        query={query}
        isEmpty={(data) => data.schedulers.length === 0}
        empty={{ message: '등록된 스케줄러가 없습니다' }}
        errorMessage="스케줄러 상태를 불러오지 못했습니다."
      >
        {(data) => (
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeaderCell>잡</TableHeaderCell>
                <TableHeaderCell>마지막 실행</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.schedulers.map((job) => (
                <TableRow key={job.lockName}>
                  <TableCell title={job.cronExpression ?? undefined}>{job.displayName}</TableCell>
                  <TableCell
                    className="whitespace-nowrap"
                    title={job.lockedAt ? formatUtcToLocal(job.lockedAt) : undefined}
                  >
                    {formatRelativeTime(job.lockedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge tone={stateTone(job)} size="xs">
                      {STATE_LABEL[job.state]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashboardWidget>

      <DashboardWidget
        title="외부 API 실패"
        caption="24시간 · Jira · Claude · Slack 등"
        query={query}
        isEmpty={(data) => data.externalApiFailures.length === 0}
        empty={{ message: '외부 호출 실패가 없습니다' }}
        errorMessage="외부 API 통계를 불러오지 못했습니다."
      >
        {(data) => (
          <BarList
            ariaLabel="외부 API 실패 건수"
            items={data.externalApiFailures.map((api) => ({
              id: `${api.httpMethodType}-${api.uriPattern}`,
              label: truncateMiddle(api.uriPattern, 32),
              labelText: api.uriPattern,
              value: api.failureCount,
              hint: `/ ${api.callCount}회`,
              tone: 'danger' as const,
            }))}
          />
        )}
      </DashboardWidget>
    </>
  );
}

/**
 * shedlock 은 "실행했다"만 증언하고 "성공했다"는 말하지 않는다.
 * AbstractScheduler.proceedScheduler() 가 예외를 삼키고 로그만 남기는데,
 * 실패해도 ShedLock 은 정상 해제되어 locked_at 이 갱신되기 때문이다.
 * 그래서 배지 문구도 "정상"이 아니라 지연 여부만 말한다.
 */
const STATE_LABEL: Record<SchedulerHealthState, string> = {
  RUNNING: '실행 중',
  OK: '주기 내',
  STALE: '지연',
  NEVER_RUN: '실행 기록 없음',
  DISABLED: '사용 안 함',
};

function stateTone(job: SchedulerStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' {
  switch (job.state) {
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
