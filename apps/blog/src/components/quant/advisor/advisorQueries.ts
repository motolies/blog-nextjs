'use client';

import { useQuery } from '@tanstack/react-query';
import { type AdvisorDisabled, isAdvisorDisabled, isNumericId, quantKeys } from '@/hooks/useQuant';
import { isNotFound } from '@/lib/quant/apiOutcome';
import service from '@/service';
import type {
  AdviceDetailResponse,
  AdviceKind,
  AdvisorRunResponse,
  IcStat,
  MorningVsDailyResponse,
  PromptInputRow,
  ScoreSummaryResponse,
  WeightSet,
} from '@/types/quant';

/**
 * M4 탭(KPI·가중치·판단 상세)의 읽기 훅 — `hooks/useQuant.ts`(M2 공유 계층) 를 고치지 않고 같은 규약으로 확장한다.
 *
 * 키는 전부 `quantKeys.all` 아래에 둔다 — `useRunActions.invalidate()` 가 prefix 로 무효화하므로
 * 판단 삭제·가중치 활성화·교훈 폐기 뒤 이 화면들이 함께 갱신된다.
 * 폴링은 없다(KPI 는 채점 배치 뒤에만 바뀐다). advisor 404 는 `{disabled:true}` 값으로 바꿔 ErrorState 재시도로 가지 않게 한다.
 */
export const advisorKeys = {
  scoreSummary: (from: string, to: string, kind: AdviceKind, horizon: number | null) =>
    [...quantKeys.all, 'advisor', 'scores', 'summary', from, to, kind, horizon] as const,
  morningVsDaily: (from: string, to: string) =>
    [...quantKeys.all, 'advisor', 'scores', 'morning-vs-daily', from, to] as const,
  ic: (asOf: string, window: number | null, horizon: number) =>
    [...quantKeys.all, 'advisor', 'scores', 'ic', asOf, window, horizon] as const,
  weightSets: (limit: number, horizon: number) =>
    [...quantKeys.all, 'advisor', 'weights', 'sets', limit, horizon] as const,
  advice: (adviceId: string) => [...quantKeys.all, 'advisor', 'advice', adviceId] as const,
  advicePrompt: (adviceId: string) =>
    [...quantKeys.all, 'advisor', 'advice', adviceId, 'prompt'] as const,
};

/** LLM 사용량이 보는 run 수 — 이력 그리드와 같은 500(≈2주 이상). 키도 `quantKeys.advisorRuns(500)` 을 그대로 쓴다. */
export const USAGE_RUN_LIMIT = 500;

const ADVISOR_DISABLED: AdvisorDisabled = { disabled: true };

/** 404 → disabled 값, 그 외 오류는 throw(위젯 ErrorState). `useQuant.ts` 의 같은 이름 함수와 동작이 같다(비공개라 복제). */
async function orDisabled<T>(fetcher: () => Promise<T>): Promise<T | AdvisorDisabled> {
  try {
    return await fetcher();
  } catch (error) {
    if (isNotFound(error)) return ADVISOR_DISABLED;
    throw error;
  }
}

/**
 * KPI 요약 — kind 기본 DAILY, horizon null 이면 파라미터를 생략해 그 종류의 결정 호라이즌을 쓴다.
 * 유효한 (kind, horizon) 조합은 호출부가 `lib/quant/advisorHorizon.ts` 로 걸러 넘긴다(백엔드는 조합을 검증하지 않는다).
 */
export function useScoreSummary(
  from: string,
  to: string,
  kind: AdviceKind = 'DAILY',
  horizon: number | null = null,
) {
  return useQuery<ScoreSummaryResponse | AdvisorDisabled>({
    queryKey: advisorKeys.scoreSummary(from, to, kind, horizon),
    queryFn: () =>
      orDisabled(() =>
        service.advisor.scoreSummary(
          horizon === null ? { from, to, kind } : { from, to, kind, horizon },
        ),
      ),
    staleTime: 60 * 1000,
    retry: false,
  });
}

/** 아침 재판정 대응 비교(MORNING − DAILY). 404 는 advisor 비활성 또는 M4 이전 백엔드 — 둘 다 disabled 값으로 받는다. */
export function useMorningVsDaily(from: string, to: string) {
  return useQuery<MorningVsDailyResponse | AdvisorDisabled>({
    queryKey: advisorKeys.morningVsDaily(from, to),
    queryFn: () => orDisabled(() => service.advisor.morningVsDaily({ from, to })),
    staleTime: 60 * 1000,
    retry: false,
  });
}

/**
 * 시그널 IC 창 통계 — 맵을 배열로 펴서 표에 바로 얹는다(signalCode 순 정렬).
 * window null 이면 생략(그 호라이즌의 ic-window, 20 은 480일) — 5 외 호라이즌은 짧은 창에서 n_eff 가 무의미해진다.
 */
export function useIcStats(asOf: string, window: number | null, horizon: number) {
  return useQuery<IcStat[] | AdvisorDisabled>({
    queryKey: advisorKeys.ic(asOf, window, horizon),
    queryFn: async () => {
      const result = await orDisabled(() =>
        service.advisor.ic(window === null ? { asOf, horizon } : { asOf, window, horizon }),
      );
      if (isAdvisorDisabled(result)) return result;
      return Object.values(result).sort((a, b) => a.signalCode.localeCompare(b.signalCode));
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}

/** LLM 사용량 원천 — 이력 탭과 키를 공유하므로 두 탭을 오가도 요청은 1개다. */
export function useUsageRuns() {
  return useQuery<AdvisorRunResponse[] | AdvisorDisabled>({
    queryKey: quantKeys.advisorRuns(USAGE_RUN_LIMIT),
    queryFn: () => orDisabled(() => service.advisor.runs({ limit: USAGE_RUN_LIMIT })),
    staleTime: 60 * 1000,
    retry: false,
  });
}

/** 호라이즌의 최근 가중치 세트 — 60·180 은 학습하지 않아 빈 목록이다. */
export function useWeightSets(horizon: number, limit = 20) {
  return useQuery<WeightSet[] | AdvisorDisabled>({
    queryKey: advisorKeys.weightSets(limit, horizon),
    queryFn: () => orDisabled(() => service.advisor.weightSets(limit, horizon)),
    staleTime: 60 * 1000,
    retry: false,
  });
}

/**
 * 판단 상세 — `?advice=` 로 연다(그리드 페이지에 없는 판단도 GateWidget·Slack 딥링크에서 열려야 한다).
 * 여기서의 404 는 "비활성" 이 아니라 **없는 id**(삭제된 판단)일 수 있어 disabled 로 바꾸지 않고 오류로 둔다.
 */
export function useAdvice(adviceId: string | null) {
  return useQuery<AdviceDetailResponse>({
    queryKey: advisorKeys.advice(adviceId ?? ''),
    queryFn: () => service.advisor.advice(adviceId as string),
    enabled: isNumericId(adviceId),
    staleTime: 30 * 1000,
    retry: false,
  });
}

/** 프롬프트 원문 — 수십 KB 라 서브탭을 열었을 때만(`enabled`) 조회한다. */
export function useAdvicePrompt(adviceId: string | null, enabled: boolean) {
  return useQuery<Record<string, PromptInputRow>>({
    queryKey: advisorKeys.advicePrompt(adviceId ?? ''),
    queryFn: () => service.advisor.advicePrompt(adviceId as string),
    enabled: enabled && isNumericId(adviceId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
