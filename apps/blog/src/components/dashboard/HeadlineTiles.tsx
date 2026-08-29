'use client';

import { StatTile } from '@hvy/ui';
import Link from 'next/link';
import { Skeleton } from '@/components/common/Skeleton';
import { formatCompact, formatDelta } from '@/lib/statFormat';
import type { HealthStats, PipelineStats, SchedulerStatus, TrafficStats } from '@/types/stats';

/**
 * 상단 요약 타일 4개.
 *
 * 타일이 4개인 것은 .admin-stat-grid 가 12컬럼이기 때문이다 — 5개는 12를 나누지 못한다.
 *
 * 이동이 필요한 타일은 StatTile 의 onClick 을 쓰지 않고 <Link> 로 감싼다.
 * onClick 을 주면 <button aria-pressed> 로 렌더되는데, aria-pressed 는 "토글 상태"를 뜻하므로
 * 링크에 붙이면 거짓말이 된다. 컴포넌트 문서도 onClick 을 화면 내 필터 숏컷으로 한정한다.
 * onClick 없는 StatTile 은 <div> 라 <a><div/></a> 가 유효한 HTML 이다.
 */

interface HeadlineTilesProps {
  traffic: { data: TrafficStats | undefined; isPending: boolean; isError: boolean };
  health: { data: HealthStats | undefined; isPending: boolean; isError: boolean };
  pipeline: { data: PipelineStats | undefined; isPending: boolean; isError: boolean };
}

const TILE_SPAN = 'col-span-12 sm:col-span-6 xl:col-span-3';

export function HeadlineTiles({ traffic, health, pipeline }: HeadlineTilesProps) {
  const visitorDelta = traffic.data
    ? formatDelta(traffic.data.todayVisitors, traffic.data.yesterdayVisitors)
    : null;
  const viewDelta = traffic.data
    ? formatDelta(traffic.data.todayPostViews, traffic.data.yesterdayPostViews)
    : null;

  const errorCount = health.data
    ? health.data.recentErrorCount +
      health.data.externalApiFailures.reduce((sum, api) => sum + api.failureCount, 0)
    : 0;

  const staleJobs = health.data ? health.data.schedulers.filter(isStale) : [];
  const totalJobs = health.data?.schedulers.length ?? 0;

  return (
    <div className="admin-stat-grid">
      <div className={TILE_SPAN}>
        <StatTile
          label="오늘 방문자"
          hint={cell(traffic, visitorDelta ? `어제 대비 ${visitorDelta.text}` : undefined)}
          value={value(traffic, () => formatCompact(traffic.data?.todayVisitors ?? 0))}
        />
      </div>

      <div className={TILE_SPAN}>
        <StatTile
          label="오늘 조회"
          hint={cell(traffic, viewDelta ? `어제 대비 ${viewDelta.text}` : undefined)}
          value={value(traffic, () => formatCompact(traffic.data?.todayPostViews ?? 0))}
        />
      </div>

      {/*
        ?status=FAIL — pickLogFilters 가 URL 필터를 만나면 날짜 기본값을 비우므로
        전체 기간 FAIL 이 최신순으로 뜬다. idx_system_log_status_created (status, created_at DESC) 가
        정확히 이 쿼리를 위한 인덱스다.
        타일 숫자는 시스템 + 외부 API 합계인데 목적지는 시스템 로그뿐이다 —
        외부 API 실패분은 아래 "외부 API 실패" 위젯이 담당한다.
      */}
      <Link
        href="/admin/system-log?status=FAIL"
        className={`block rounded-dl-container ${TILE_SPAN}`}
      >
        <StatTile
          label="24시간 오류"
          hint={cell(health, '시스템 + 외부 API')}
          tone={errorCount > 0 ? 'danger' : 'success'}
          value={value(health, () => formatCompact(errorCount))}
        />
      </Link>

      <a href="#pipelines" className={`block rounded-dl-container ${TILE_SPAN}`}>
        <StatTile
          label="지연 파이프라인"
          hint={cell(
            pipeline,
            staleJobs.length > 0 ? (
              // displayName 은 백엔드 문자열이라 길이 계약이 없다. 카멜케이스 락 이름이 오면
              // 줄바꿈 기회가 0 인데, StatTile 은 .admin-stat-grid 의 그리드 아이템(min-width:auto)이라
              // min-content 가 트랙을 넘기면 격자째 넘쳐 overflow-x:hidden 에 잘린다.
              <span className="wrap-anywhere">
                {staleJobs.map((job) => job.displayName).join(', ')}
              </span>
            ) : (
              '마지막 실행 기준'
            ),
          )}
          tone={staleJobs.length > 0 ? 'warning' : 'success'}
          value={value(health, () => `${staleJobs.length}/${totalJobs}`)}
        />
      </a>
    </div>
  );
}

/** STALE 과 NEVER_RUN 만 문제로 센다. DISABLED 는 의도적으로 꺼둔 것이다. */
function isStale(job: SchedulerStatus): boolean {
  return job.state === 'STALE' || job.state === 'NEVER_RUN';
}

/**
 * 로딩 중에도 타일 껍데기를 그대로 두고 숫자만 맥동시킨다 —
 * 타일을 통째로 빼면 격자가 접혔다 펴지며 레이아웃이 튄다.
 */
function value(
  state: { isPending: boolean; isError: boolean },
  render: () => string,
): React.ReactNode {
  if (state.isPending) {
    return <Skeleton variant="text" className="w-16" />;
  }
  if (state.isError) {
    return '—';
  }
  return render();
}

function cell(state: { isPending: boolean; isError: boolean }, hint?: React.ReactNode) {
  if (state.isPending) {
    return undefined;
  }
  return state.isError ? '불러오지 못함' : hint;
}
