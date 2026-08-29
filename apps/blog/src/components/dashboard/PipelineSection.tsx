'use client';

import { Badge, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import { formatCompact, formatRelativeTime } from '@/lib/statFormat';
import type { HotDealSiteStat, PipelineStats } from '@/types/stats';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { DashboardTable } from './DashboardTable';
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
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>사이트</TableHeaderCell>
                {/* TableHeaderCell 기본값이 whitespace-nowrap 이라 헤더가 컬럼 하한을 박는다 */}
                <TableHeaderCell className="whitespace-normal">마지막 수집</TableHeaderCell>
                <TableHeaderCell className="text-right">수집</TableHeaderCell>
                <TableHeaderCell className="text-right">알림</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.hotDealSites.map((site) => (
                // key 는 siteCode 가 아니라 siteId 다 — siteCode 는 스크래퍼 종류라 고유하지 않고
                // 뽐뿌 국내/해외가 같은 PPOMPPU 를 공유한다(/admin/hot-deal-sites 의 getRowId 와 같은 전략).
                <TableRow key={site.siteId}>
                  <TableCell>
                    {/* flex-wrap 이 없으면 이 셀의 min-content 가 "이름 + gap + 배지" 합산이 되어
                        컬럼 하한이 배지 폭만큼 커진다 — 배지를 아래 줄로 떨어뜨릴 수 있게 둔다 */}
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="wrap-anywhere">{site.siteName}</span>
                      {site.enabled ? null : (
                        <Badge tone="neutral" size="xs">
                          꺼짐
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  {/* whitespace-nowrap 제거 + flex-wrap — 위와 같은 이유로 "지연" 배지가 접힐 수 있어야 한다 */}
                  <TableCell
                    title={site.lastScrapedAt ? formatUtcToLocal(site.lastScrapedAt) : undefined}
                  >
                    <span className="flex flex-wrap items-center gap-2">
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
          </DashboardTable>

          {/* 좁은 화면에서는 2열 격자 — flex-wrap + gap-x-6(24px)이면 항목 폭이 제각각이라
              들쭉날쭉 접히고 375px 에서 gap 이 과하다. sm 이상은 기존 흐름 배치를 유지한다. */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-dl-sm sm:flex sm:flex-wrap sm:gap-x-6">
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
    // min-w-0 — 격자 트랙 안에서 이 항목이 내용 폭 아래로 줄어들 수 있어야 한다
    <span className="flex min-w-0 items-baseline gap-1">
      <dt className="text-dl-xs text-[color:var(--admin-text-faint)]">{label}</dt>
      <dd className="font-semibold text-[color:var(--admin-text)]">{value}</dd>
    </span>
  );
}
