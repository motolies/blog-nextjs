'use client';

import { Badge, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import { formatCompact, formatRelativeTime } from '@/lib/statFormat';
import type { HotDealSiteStat, PipelineStats } from '@/types/stats';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { DashboardWidget } from './DashboardWidget';

interface PipelineSectionProps {
  query: UseQueryResult<PipelineStats>;
}

/** 수집 주기가 10분이므로 이 시간을 넘겨 조용하면 이상하다. */
const STALE_MINUTES = 60;

export function PipelineSection({ query }: PipelineSectionProps) {
  return (
    <DashboardWidget
      id="pipelines"
      title="사이드 파이프라인"
      caption="24시간 · 사이트별 마지막 수집"
      query={query}
      errorMessage="파이프라인 현황을 불러오지 못했습니다."
    >
      {(data) => (
        <div className="flex flex-col gap-4">
          {/*
            총합이 아니라 사이트별로 분해해 보여주는 것이 이 표의 요점이다.
            HotDealService 는 사이트별 예외를 삼키고 다음 사이트로 넘어가므로,
            총 수집 건수만 보면 한 사이트의 스크래퍼가 깨져도 나머지가 숫자를 채워 가려진다.
          */}
          <Table size="sm">
            <TableHead>
              <TableRow>
                <TableHeaderCell>사이트</TableHeaderCell>
                <TableHeaderCell>마지막 수집</TableHeaderCell>
                <TableHeaderCell className="text-right">수집</TableHeaderCell>
                <TableHeaderCell className="text-right">알림</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.hotDealSites.map((site) => (
                <TableRow key={site.siteCode}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {site.siteName}
                      {site.enabled ? null : (
                        <Badge tone="neutral" size="xs">
                          꺼짐
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell
                    className="whitespace-nowrap"
                    title={site.lastScrapedAt ? formatUtcToLocal(site.lastScrapedAt) : undefined}
                  >
                    <span className="flex items-center gap-2">
                      {formatRelativeTime(site.lastScrapedAt)}
                      {isSiteStale(site) ? (
                        <Badge tone="danger" size="xs">
                          지연
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCompact(site.scrapedCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCompact(site.notifiedCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-dl-sm">
            <Figure label="활성 키워드" value={formatCompact(data.enabledKeywordCount)} />
            <Figure
              label="알림 비율"
              value={
                data.hotDealNotifiedRatio === null
                  ? '-'
                  : `${data.hotDealNotifiedRatio.toFixed(1)}%`
              }
            />
            <Figure label="메모" value={`${formatCompact(data.memo.activeCount)}건`} />
            <Figure label="메모 최근 작성" value={formatRelativeTime(data.memo.lastCreatedAt)} />
            <Figure label="Jira 이슈" value={formatCompact(data.jira.issueCount)} />
            <Figure label="Jira 워크로그" value={formatRelativeTime(data.jira.lastWorklogAt)} />
          </dl>
        </div>
      )}
    </DashboardWidget>
  );
}

/** 꺼둔 사이트는 조용한 것이 정상이므로 지연으로 세지 않는다. */
function isSiteStale(site: HotDealSiteStat): boolean {
  if (!site.enabled) {
    return false;
  }
  if (site.lastScrapedAt === null) {
    return true;
  }
  const elapsedMinutes = (Date.now() - new Date(site.lastScrapedAt).getTime()) / 60_000;
  return elapsedMinutes > STALE_MINUTES;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <dt className="text-dl-xs text-[color:var(--admin-text-faint)]">{label}</dt>
      <dd className="font-semibold text-[color:var(--admin-text)]">{value}</dd>
    </span>
  );
}
