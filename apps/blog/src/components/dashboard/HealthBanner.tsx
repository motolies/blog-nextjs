'use client';

import { InlineNotice } from '@hvy/ui';
import Link from 'next/link';
import type { HealthStats, PipelineStats } from '@/types/stats';

/**
 * 이상 징후 배너.
 *
 * <b>정상일 때는 아무것도 렌더하지 않는다(높이 0).</b>
 * 항상 떠 있는 배너는 아무도 읽지 않게 된다 — 조건부여야 신호로 남는다.
 */

interface HealthBannerProps {
  health: HealthStats | undefined;
  pipeline: PipelineStats | undefined;
}

export function HealthBanner({ health, pipeline }: HealthBannerProps) {
  const messages: string[] = [];

  const externalFailures =
    health?.externalApiFailures.reduce((sum, api) => sum + api.failureCount, 0) ?? 0;

  if (health && health.recentErrorCount > 0) {
    messages.push(`지난 ${health.windowHours}시간 서버 오류 ${health.recentErrorCount}건`);
  }
  if (externalFailures > 0) {
    messages.push(`외부 API 실패 ${externalFailures}건`);
  }

  const staleJobs = health?.schedulers.filter(
    (job) => job.state === 'STALE' || job.state === 'NEVER_RUN',
  );
  if (staleJobs && staleJobs.length > 0) {
    messages.push(`스케줄러 지연 — ${staleJobs.map((job) => job.displayName).join(', ')}`);
  }

  const staleSites = pipeline?.hotDealSites.filter(
    (site) => site.enabled && site.lastScrapedAt === null,
  );
  if (staleSites && staleSites.length > 0) {
    messages.push(`핫딜 수집 기록 없음 — ${staleSites.map((site) => site.siteName).join(', ')}`);
  }

  if (messages.length === 0) {
    return null;
  }

  const hasServerError = (health?.recentErrorCount ?? 0) > 0 || externalFailures > 0;

  return (
    <InlineNotice live tone={hasServerError ? 'error' : 'warning'}>
      {/* wrap-anywhere — 메시지에 섞여 들어오는 displayName·siteName 은 백엔드 문자열이라
          길이 계약이 없다. 카멜케이스 락 이름은 줄바꿈 기회가 0 이라 배너를 넘겨 잘린다.
          overflow-wrap 은 상속 프로퍼티라 익명 flex 아이템(텍스트)에도 적용된다. */}
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 wrap-anywhere">
        {messages.join(' · ')}
        <Link href="/admin/system-log" className="underline underline-offset-2">
          로그 보기
        </Link>
      </span>
    </InlineNotice>
  );
}
