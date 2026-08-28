import type { AxiosRequestConfig } from 'axios';
import type { HealthStats, PipelineStats, StatsSummary, TrafficStats } from '@/types/stats';
import axiosClient from './axiosClient';

const STATS_API_BASE = '/api/stats/admin';

/**
 * 관리자 대시보드 집계.
 *
 * 엔드포인트가 넷인 것은 의도적이다 — 갱신 주기(콘텐츠 5분 / 이상징후 60초)와
 * 비용(24h p95 집계가 가장 비싸다)이 다르고, 로그 집계가 느려져도 콘텐츠 카드는 떠야 한다.
 * 위젯별 재시도 버튼도 이 경계를 그대로 따른다.
 */
class StatsService {
  getSummary = async (months = 12, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<StatsSummary>(`${STATS_API_BASE}/summary`, {
      params: { months },
      ...(config ?? {}),
    });
    return response.data;
  };

  getTraffic = async (days = 30, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<TrafficStats>(`${STATS_API_BASE}/traffic`, {
      params: { days },
      ...(config ?? {}),
    });
    return response.data;
  };

  getHealth = async (hours = 24, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<HealthStats>(`${STATS_API_BASE}/health`, {
      params: { hours },
      ...(config ?? {}),
    });
    return response.data;
  };

  getPipeline = async (hours = 24, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<PipelineStats>(`${STATS_API_BASE}/pipeline`, {
      params: { hours },
      ...(config ?? {}),
    });
    return response.data;
  };
}

const statsService = new StatsService();
export default statsService;
