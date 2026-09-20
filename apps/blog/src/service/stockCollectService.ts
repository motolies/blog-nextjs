import type { AxiosRequestConfig } from 'axios';
import type {
  BackfillRequest,
  CheckpointStatus,
  CollectCheckpointResponse,
  CollectJobType,
  CollectRunResponse,
  CollectStatus,
  KisTokenStatus,
  RunFilter,
} from '@/types/quant';
import axiosClient from './axiosClient';

const BASE = '/api/stock/admin/collect';

/** 경로 변수 — URL 에서 온 id 가 경로를 벗어나지 못하게 인코딩한다(숫자 검증은 훅 `isNumericId` 가 한다). */
const seg = (id: number | string) => encodeURIComponent(String(id));

/** 트리거 응답 — `accepted` 는 HTTP 202(백그라운드 제출)인지. 200 이면 run 이 이미 끝난 상태다. */
export type TriggerResult<T> = { run: T; accepted: boolean };

/**
 * 주식 수집 관리 API (`StockCollectAdminController`). ROLE_ADMIN 강제, BFF 캐치올 프록시를 탄다.
 *
 * 409(같은 잡 실행 중)·400(요청 거부)은 컨트롤러 지역 핸들러라 Slack 을 울리지 않는다.
 * 404 는 M1 에서 지역 핸들러가 추가됐다 — 그 전 버전에서는 잘못된 runId 조회가 Slack 을 울린다.
 */
class StockCollectService {
  /** 잡 실행. longRunning 잡은 202, MASTER·HOLIDAY·VALIDATE 는 200. body 는 전부 선택(잡마다 해석이 다르다). */
  trigger = async (
    jobType: CollectJobType,
    body?: BackfillRequest,
    config?: AxiosRequestConfig,
  ): Promise<TriggerResult<CollectRunResponse>> => {
    const response = await axiosClient.post<CollectRunResponse>(
      `${BASE}/${jobType}`,
      body ?? {},
      config,
    );
    return { run: response.data, accepted: response.status === 202 };
  };

  /** 최근 run 목록(startedAt DESC). limit 기본 50·최대 500. status·from·to 는 M1 추가 필터. */
  runs = async (
    filter: RunFilter<CollectJobType, CollectStatus> = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<CollectRunResponse[]>(`${BASE}/runs`, {
      params: filter,
      ...(config ?? {}),
    });
    return response.data;
  };

  run = async (runId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<CollectRunResponse>(
      `${BASE}/runs/${seg(runId)}`,
      config,
    );
    return response.data;
  };

  /** 협조적 취소 — run 은 즉시 CANCELED, 잡은 다음 종목/단계 경계에서 멈춘다. */
  cancel = async (runId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.post<CollectRunResponse>(
      `${BASE}/runs/${seg(runId)}/cancel`,
      undefined,
      config,
    );
    return response.data;
  };

  /** 잡별 체크포인트 목록(jobType 필수). attemptCount ≥ 5 는 reset 없이는 재개 대상에서 빠진다. */
  checkpoints = async (
    params: { jobType: CollectJobType; status?: CheckpointStatus; limit?: number },
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<CollectCheckpointResponse[]>(`${BASE}/checkpoints`, {
      params,
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 잡별 상태 건수 — `Map<CheckpointStatus, Long>` 이라 없는 상태 키는 빠져 온다. */
  checkpointSummary = async (jobType: CollectJobType, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<Partial<Record<CheckpointStatus, number>>>(
      `${BASE}/checkpoints/summary`,
      { params: { jobType }, ...(config ?? {}) },
    );
    return response.data;
  };

  token = async (config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<KisTokenStatus>(`${BASE}/token`, config);
    return response.data;
  };

  /** 강제 재발급 — 60초 게이트에 걸리면 기존 토큰이 유지된 상태가 그대로 돌아온다(오류 아님). */
  refreshToken = async (config?: AxiosRequestConfig) => {
    const response = await axiosClient.post<KisTokenStatus>(
      `${BASE}/token/refresh`,
      undefined,
      config,
    );
    return response.data;
  };
}

const stockCollectService = new StockCollectService();
export default stockCollectService;
