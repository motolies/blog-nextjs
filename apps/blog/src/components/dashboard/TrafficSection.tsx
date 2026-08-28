'use client';

import {
  Badge,
  InlineNotice,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@hvy/ui';
import type { UseQueryResult } from '@tanstack/react-query';
import Link from 'next/link';
import { BarList } from '@/components/common/chart/BarList';
import { Sparkline } from '@/components/common/chart/Sparkline';
import { summarize } from '@/lib/chartScale';
import { formatCompact, truncateMiddle } from '@/lib/statFormat';
import type { TrafficStats } from '@/types/stats';
import { DashboardTable } from './DashboardTable';
import { DashboardWidget } from './DashboardWidget';

interface TrafficSectionProps {
  query: UseQueryResult<TrafficStats>;
  days: number;
}

export function TrafficSection({ query, days }: TrafficSectionProps) {
  return (
    <>
      <DashboardWidget
        title="방문 추이"
        caption={`최근 ${days}일 · 로그 보존 60일`}
        query={query}
        errorMessage="트래픽 추이를 불러오지 못했습니다."
      >
        {(data) => <TrendBody data={data} days={days} />}
      </DashboardWidget>

      <DashboardWidget
        title="많이 읽힌 글"
        caption={`최근 ${days}일 기준`}
        query={query}
        isEmpty={(data) => data.popularPostsRecent.length === 0}
        empty={{
          message: '기간 내 조회된 글이 없습니다',
          hint: '조회수 수집이 막 시작됐다면 며칠 뒤에 채워집니다',
        }}
        errorMessage="인기 글을 불러오지 못했습니다."
      >
        {(data) => (
          /* 자유텍스트가 "제목" 한 열뿐이고 숫자 3열은 max-content 가 유계라,
             auto 레이아웃이 남는 폭을 전부 제목에 몰아준다 — fixed 보다 이쪽이 낫다. */
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>제목</TableHeaderCell>
                {/* 40rem 미만에서 숨긴다 — 4열 중 폭 대비 정보가치가 가장 낮고, 이 열이
                    비우는 자리가 제목 실폭을 7자/줄에서 13자/줄로 늘린다.
                    th·td 를 같은 경계에서 숨겨야 접근성 트리의 표가 직사각형을 유지한다. */}
                <TableHeaderCell className="hidden sm:table-cell">카테고리</TableHeaderCell>
                <TableHeaderCell className="text-right">조회</TableHeaderCell>
                <TableHeaderCell className="text-right">방문자</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.popularPostsRecent.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    {/* 목적이 "읽기"가 아니라 "고치기"이므로 편집 화면으로 보낸다 */}
                    <Link
                      href={`/admin/write/${post.id}`}
                      className="wrap-anywhere text-dl-primary-ink hover:underline"
                    >
                      {post.subject}
                    </Link>
                    {/* 숨긴 카테고리의 대체 표시. sm 이상에서는 display:none 이라 접근성 트리에서
                        제거되어 카테고리 열과 상호배타가 된다 — sr-only 를 쓰면 트리에 남아 이중 낭독된다. */}
                    <span className="mt-0.5 block text-dl-xs text-[color:var(--admin-text-faint)] sm:hidden">
                      {post.categoryName ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{post.categoryName ?? '-'}</TableCell>
                  {/* 숫자 셀에는 wrap-anywhere 를 걸지 않는다 — "1,234" 가 "1,2" / "34" 로 쪼개진다 */}
                  <TableCell className="text-right tabular-nums">
                    {formatCompact(post.viewCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCompact(post.visitorCount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DashboardTable>
        )}
      </DashboardWidget>

      <DashboardWidget
        title="많이 불린 경로"
        caption="숫자 세그먼트는 {id} 로 묶음"
        query={query}
        isEmpty={(data) => data.topRequestUris.length === 0}
        empty={{ message: '기간 내 요청 기록이 없습니다' }}
        errorMessage="경로 통계를 불러오지 못했습니다."
      >
        {(data) => (
          <BarList
            ariaLabel="많이 불린 경로"
            items={data.topRequestUris.map((uri, index) => ({
              id: uri.uriPattern,
              label: truncateMiddle(uri.uriPattern, 36),
              labelText: uri.uriPattern,
              value: uri.requestCount,
              hint: `${uri.avgProcessTime}ms`,
              seriesIndex: index,
            }))}
          />
        )}
      </DashboardWidget>
    </>
  );
}

function TrendBody({ data, days }: { data: TrafficStats; days: number }) {
  const visitorPoints = data.dailyTrend.map((row) => ({
    label: row.date,
    value: row.visitorCount,
  }));
  const viewPoints = data.dailyTrend.map((row) => ({ label: row.date, value: row.postViewCount }));
  const stats = summarize(visitorPoints);

  // "아무도 안 읽었다"와 "아직 측정을 안 한다"는 완전히 다른 이야기다.
  // 이 구분이 없으면 beacon 배포 직후의 정상적인 0 선을 버그로 오해하게 된다.
  if (data.collectionStartedAt === null) {
    return (
      <InlineNotice tone="info">
        조회수 수집이 아직 시작되지 않았습니다. 조회 비콘이 배포되면 이 자리에 추이가 그려집니다.
      </InlineNotice>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Sparkline points={visitorPoints} ariaLabel={`최근 ${days}일 일별 방문자`} tone="primary" />
      <Sparkline points={viewPoints} ariaLabel={`최근 ${days}일 일별 포스트 조회`} tone="warning" />
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-dl-sm text-[color:var(--admin-text-muted)]">
        <Figure label="기간 방문자" value={formatCompact(stats.total)} />
        <Figure label="일평균" value={formatCompact(Math.round(stats.avg))} />
        <Figure
          label="최고일"
          value={stats.peak ? `${stats.peak.label} · ${formatCompact(stats.peak.value)}` : '-'}
        />
        <Badge tone="neutral" size="xs">
          {data.timeZone}
        </Badge>
      </dl>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <dt className="text-dl-xs text-[color:var(--admin-text-faint)]">{label}</dt>
      <dd className="font-semibold text-[color:var(--admin-text)]">{value}</dd>
    </span>
  );
}
