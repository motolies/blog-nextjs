'use client';

import { Select } from '@hvy/ui';
import { useState } from 'react';
import {
  useHealthStats,
  usePipelineStats,
  useSummaryStats,
  useTrafficStats,
} from '@/hooks/useDashboard';
import { ContentStatusTiles } from './ContentStatusTiles';
import { HeadlineTiles } from './HeadlineTiles';
import { HealthBanner } from './HealthBanner';
import { HealthSection } from './HealthSection';
import { PipelineSection } from './PipelineSection';
import { TrafficSection } from './TrafficSection';

/**
 * 대시보드 루트.
 *
 * <b>왜 서버 컴포넌트가 아니라 클라이언트인가.</b>
 * axiosClient 는 X-Client-Timezone 헤더를 브라우저에서만 주입한다. 서버에서 부르면
 * ClientTimeZoneResolver 가 UTC 로 폴백해 "오늘"의 경계가 UTC 자정이 된다 —
 * KST 로는 오전 9시 이전에 "오늘 방문자"가 전날을 가리키게 된다.
 * 그 밖에도 기간 전환·위젯별 재시도·폴링이 전부 클라이언트 경계를 요구한다.
 *
 * 로그 집계가 느려져도 콘텐츠 타일은 떠야 하므로 쿼리를 넷으로 나눠 독립 실패시킨다.
 */

const RANGE_OPTIONS = [
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
  { value: '60', label: '최근 60일' },
];

export function DashboardClient() {
  // 로그 보존이 60일이라 그 이상은 고를 수 없게 둔다 — 고를 수 있으면 빈 구간을 데이터로 오해한다
  const [days, setDays] = useState('30');
  const trafficDays = Number(days);

  const summary = useSummaryStats();
  const traffic = useTrafficStats(trafficDays);
  const health = useHealthStats();
  const pipeline = usePipelineStats();

  return (
    <div className="flex flex-col gap-4">
      <HealthBanner health={health.data} pipeline={pipeline.data} />

      <HeadlineTiles traffic={traffic} health={health} pipeline={pipeline} />

      <div className="flex items-center justify-end">
        <Select
          value={days}
          onValueChange={setDays}
          options={RANGE_OPTIONS}
          placeholder="기간 선택"
          aria-label="조회 기간"
        />
      </div>

      <div className="admin-split-layout" data-size="wide">
        <div className="flex min-w-0 flex-col gap-4">
          <TrafficSection query={traffic} days={trafficDays} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <HealthSection query={health} />
        </div>
      </div>

      <PipelineSection query={pipeline} />

      <ContentStatusTiles query={summary} />
    </div>
  );
}
