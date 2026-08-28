import { useQuery } from '@tanstack/react-query';
import service from '@/service';
import type { HealthStats, PipelineStats, StatsSummary, TrafficStats } from '@/types/stats';

/**
 * 대시보드 데이터 훅 — useCategories.ts 의 키 팩토리 + useQuery 형태를 그대로 따른다.
 *
 * 위젯군마다 staleTime 이 다른 것이 핵심이다. 하나로 합치면 가장 짧은 주기에 맞춰
 * 전부를 다시 계산해야 하고, 24시간 p95 집계가 그 비용을 매분 내게 된다.
 *
 * 기간(days/hours)을 쿼리 키에 넣었으므로 7↔30일 전환은 되돌아올 때 캐시 히트이고,
 * 나갈 때는 isPending 이 아니라 isFetching 이라 이전 데이터가 화면에 남는다.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (months: number) => [...dashboardKeys.all, 'summary', months] as const,
  traffic: (days: number) => [...dashboardKeys.all, 'traffic', days] as const,
  health: (hours: number) => [...dashboardKeys.all, 'health', hours] as const,
  pipeline: (hours: number) => [...dashboardKeys.all, 'pipeline', hours] as const,
};

/** 콘텐츠 현황 — 글을 쓸 때만 바뀐다. */
export function useSummaryStats(months = 12) {
  return useQuery<StatsSummary>({
    queryKey: dashboardKeys.summary(months),
    queryFn: () => service.stats.getSummary(months),
    staleTime: 5 * 60 * 1000,
  });
}

/** 트래픽 — 로그 적재가 비동기라 분 단위 신선도면 충분하다. */
export function useTrafficStats(days = 30) {
  return useQuery<TrafficStats>({
    queryKey: dashboardKeys.traffic(days),
    queryFn: () => service.stats.getTraffic(days),
    staleTime: 60 * 1000,
  });
}

/**
 * 이상 징후 — 유일하게 폴링한다.
 * refetchOnWindowFocus 를 전역 기본값(false)에서 뒤집는다: 탭으로 돌아왔을 때
 * "그 사이 뭐가 터졌나"를 바로 보여주는 것이 이 위젯의 존재 이유다.
 */
export function useHealthStats(hours = 24) {
  return useQuery<HealthStats>({
    queryKey: dashboardKeys.health(hours),
    queryFn: () => service.stats.getHealth(hours),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/** 사이드 파이프라인 — 스크래핑 주기가 10분이라 5분 폴링이면 과하지 않다. */
export function usePipelineStats(hours = 24) {
  return useQuery<PipelineStats>({
    queryKey: dashboardKeys.pipeline(hours),
    queryFn: () => service.stats.getPipeline(hours),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
