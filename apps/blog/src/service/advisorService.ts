import type { AxiosRequestConfig } from 'axios';
import type { AdvisorTriggerArgs } from '@/lib/quant/stepRetry';
import type {
  AdviceDeleteResponse,
  AdviceDetailResponse,
  AdviceHeader,
  AdviceKind,
  AdviceVariant,
  AdvisorGateResponse,
  AdvisorJobType,
  AdvisorRunResponse,
  AdvisorStatus,
  CalibrationRow,
  ChatRow,
  IcStat,
  LessonRow,
  LessonStatus,
  MorningVsDailyResponse,
  PromptInputRow,
  RunFilter,
  ScoreSummaryResponse,
  WeightSet,
} from '@/types/quant';
import axiosClient from './axiosClient';
import type { TriggerResult } from './stockCollectService';

const BASE = '/api/advisor/admin';

/** 경로 변수 — URL 에서 온 id 가 경로를 벗어나지 못하게 인코딩한다(숫자 검증은 훅 `isNumericId` 가 한다). */
const seg = (id: number | string) => encodeURIComponent(String(id));

/**
 * AI 어드바이저 관리 API (`AdvisorAdminController`). ROLE_ADMIN 강제.
 *
 * ⚠️ `advisor.enabled=false` 환경에서는 컨트롤러 자체가 없어 **모든 경로가 404** 다 —
 *    호출부(`hooks/useQuant.ts`)가 404 를 "비활성" 빈 상태로 바꾼다. 409·400·404 는 지역 핸들러(Slack 미발송).
 */
class AdvisorService {
  /**
   * 잡 실행. INTRADAY·MORNING_CHECK 만 200, 나머지는 202(백그라운드).
   * `baseDate` 를 주면 그 날짜 기준(과거 보충) — 원 run 의 `metadata.requested` 재현 규칙은 `lib/quant/stepRetry.ts`.
   * `horizon` 은 IC_BACKFILL 전용(그 호라이즌 하나만 백필, 생략하면 학습 호라이즌 전부) — 다른 잡이나 IC 대상 밖 값은 400.
   */
  trigger = async (
    jobType: AdvisorJobType,
    args: AdvisorTriggerArgs = {},
    config?: AxiosRequestConfig,
  ): Promise<TriggerResult<AdvisorRunResponse>> => {
    const params: Record<string, string | number> = {};
    if (args.baseDate) params.baseDate = args.baseDate;
    if (args.horizon !== undefined) params.horizon = args.horizon;
    const response = await axiosClient.post<AdvisorRunResponse>(
      `${BASE}/jobs/${jobType}`,
      undefined,
      { params: Object.keys(params).length > 0 ? params : undefined, ...(config ?? {}) },
    );
    return { run: response.data, accepted: response.status === 202 };
  };

  runs = async (
    filter: RunFilter<AdvisorJobType, AdvisorStatus> = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<AdvisorRunResponse[]>(`${BASE}/runs`, {
      params: filter,
      ...(config ?? {}),
    });
    return response.data;
  };

  run = async (runId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<AdvisorRunResponse>(
      `${BASE}/runs/${seg(runId)}`,
      config,
    );
    return response.data;
  };

  cancel = async (runId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.post<AdvisorRunResponse>(
      `${BASE}/runs/${seg(runId)}/cancel`,
      undefined,
      config,
    );
    return response.data;
  };

  /** ADVISE 게이트 판정(M1 신설). baseDate 생략 = 오늘(KST). */
  gate = async (baseDate?: string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<AdvisorGateResponse>(`${BASE}/gate`, {
      params: baseDate ? { baseDate } : undefined,
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 판단 헤더 목록 — 기본 최근 30일·종류 DAILY(백엔드 기본값). */
  advices = async (
    params: {
      from?: string;
      to?: string;
      kind?: AdviceKind;
      variant?: AdviceVariant;
      limit?: number;
    } = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<AdviceHeader[]>(`${BASE}/advices`, {
      params,
      ...(config ?? {}),
    });
    return response.data;
  };

  advice = async (adviceId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<AdviceDetailResponse>(
      `${BASE}/advices/${seg(adviceId)}`,
      config,
    );
    return response.data;
  };

  /** 재현용 입력·출력 원문 — variant 코드(LIVE·LLM_NOMEM) → 행. */
  advicePrompt = async (adviceId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<Record<string, PromptInputRow>>(
      `${BASE}/advices/${seg(adviceId)}/prompt`,
      config,
    );
    return response.data;
  };

  /** 판단 삭제(CASCADE) — 재판단 전용. `signal_ic_daily` 는 지워지지 않아 재판단 뒤 IC_BACKFILL 이 필요하다. */
  deleteAdvice = async (adviceId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.delete<AdviceDeleteResponse>(
      `${BASE}/advices/${seg(adviceId)}`,
      config,
    );
    return response.data;
  };

  /**
   * KPI 요약. kind 기본 DAILY, horizon 기본 그 종류의 결정 호라이즌(DAILY·MORNING 5, H20 20 …).
   * horizon 을 따로 주면 진단 호라이즌(DAILY·MORNING 의 1·20)도 볼 수 있다 — 백엔드는 kind 와의 조합을 검증하지 않는다.
   */
  scoreSummary = async (
    params: { from?: string; to?: string; kind?: AdviceKind; horizon?: number } = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<ScoreSummaryResponse>(`${BASE}/scores/summary`, {
      params,
      ...(config ?? {}),
    });
    return response.data;
  };

  calibration = async (
    params: { from?: string; to?: string } = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<CalibrationRow[]>(`${BASE}/scores/calibration`, {
      params,
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 아침 재판정 대응 비교(M4) — 같은 기준일 MORNING − DAILY LONG 픽 평균 초과의 날짜 단위 평균·se·t. 기본 최근 90일. */
  morningVsDaily = async (
    params: { from?: string; to?: string } = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<MorningVsDailyResponse>(
      `${BASE}/scores/morning-vs-daily`,
      { params, ...(config ?? {}) },
    );
    return response.data;
  };

  /**
   * 시그널 IC 창 통계 — signalCode → IcStat 맵. window 최소 5, 생략하면 그 호라이즌의 ic-window.
   * horizon 은 IC 대상(5·20·60·180)만, 생략하면 DAILY 결정 호라이즌(5). n_eff = IC 일수 / h 라 60·180 은 t 가 작다.
   */
  ic = async (
    params: { asOf?: string; window?: number; horizon?: number } = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<Record<string, IcStat>>(`${BASE}/scores/ic`, {
      params,
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 호라이즌의 활성 가중치 세트(기본 5) — 없으면 404(시드 미적용 또는 h=20 첫 학습 전). */
  weights = async (horizon?: number, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<WeightSet>(`${BASE}/weights`, {
      params: horizon !== undefined ? { horizon } : undefined,
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 최근 가중치 세트 — horizon 을 주면 그 호라이즌만(60·180 은 학습하지 않아 빈 목록). */
  weightSets = async (limit = 20, horizon?: number, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<WeightSet[]>(`${BASE}/weights/sets`, {
      params: horizon !== undefined ? { limit, horizon } : { limit },
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 기존 세트 활성화(수동 롤백) — 다음 ADVISE 부터 적용, 가역. */
  activateWeightSet = async (weightSetId: number | string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.post<WeightSet>(
      `${BASE}/weights/sets/${seg(weightSetId)}/activate`,
      undefined,
      config,
    );
    return response.data;
  };

  chats = async (limit = 50, config?: AxiosRequestConfig) => {
    const response = await axiosClient.get<ChatRow[]>(`${BASE}/chats`, {
      params: { limit },
      ...(config ?? {}),
    });
    return response.data;
  };

  lessons = async (
    params: { status?: LessonStatus; limit?: number } = {},
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosClient.get<LessonRow[]>(`${BASE}/lessons`, {
      params,
      ...(config ?? {}),
    });
    return response.data;
  };

  /** 교훈 수동 폐기 — reason 은 쿼리 파라미터(백엔드 기본값 "관리자 수동 폐기"). */
  retireLesson = async (lessonId: number | string, reason: string, config?: AxiosRequestConfig) => {
    const response = await axiosClient.post<LessonRow>(
      `${BASE}/lessons/${seg(lessonId)}/retire`,
      undefined,
      { params: { reason }, ...(config ?? {}) },
    );
    return response.data;
  };
}

const advisorService = new AdvisorService();
export default advisorService;
