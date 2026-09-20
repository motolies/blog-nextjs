import { type Query, useQuery } from '@tanstack/react-query';
import { isNotFound } from '@/lib/quant/apiOutcome';
import service from '@/service';
import type {
  AdviceHeader,
  AdvisorGateResponse,
  AdvisorRunResponse,
  CollectRunResponse,
  KisTokenStatus,
  RunModule,
} from '@/types/quant';

/**
 * Quant 운영 현황(`/admin/quant`) 읽기 훅 — `useDashboard.ts` 의 키 팩토리 + `useQuery` 형태를 그대로 따른다.
 *
 * **읽기 전용이다.** 변이(`useMutation`)는 앱 전체 0건인 관례를 지켜 여기 두지 않는다 — 액션은
 * `components/quant/useRunActions.ts` 가 `service.*` 를 직접 부르고 성공 시 `quantKeys.all` 을 invalidate 한다.
 * 목록 화면(실행 이력 탭)은 react-query 가 아니라 `useServerGrid` + `lib/quant/runPage.ts` 어댑터를 쓴다.
 *
 * 폴링은 RUNNING 이 있을 때만 15초, 없으면 60초(`refetchInterval` 함수형) — 수동 실행 직후 진행을 보고 싶은
 * 순간만 짧게. 오늘 파이프라인·실행 중/최근 실패·스케줄러 위젯이 같은 키를 공유해 요청은 모듈당 1개다.
 */
export const quantKeys = {
  all: ['quant'] as const,
  collectRuns: (limit: number) => [...quantKeys.all, 'collect', 'runs', limit] as const,
  advisorRuns: (limit: number) => [...quantKeys.all, 'advisor', 'runs', limit] as const,
  run: (module: RunModule, runId: string) => [...quantKeys.all, module, 'run', runId] as const,
  kisToken: () => [...quantKeys.all, 'collect', 'token'] as const,
  gate: (baseDate: string) => [...quantKeys.all, 'advisor', 'gate', baseDate] as const,
  todayAdvices: (baseDate: string) => [...quantKeys.all, 'advisor', 'advices', baseDate] as const,
};

/** 운영 현황 위젯이 보는 최근 run 수. 이력 화면의 500 과 구분한다. */
export const OVERVIEW_RUN_LIMIT = 50;

const RUNNING_POLL_MS = 15_000;
const IDLE_POLL_MS = 60_000;

/**
 * advisor 404 의 표현 — `advisor.enabled=false` 환경은 `/api/advisor/admin/**` 전체가 404 다.
 * 오류(ErrorState 재시도)가 아니라 **빈 상태**("AI 어드바이저가 비활성입니다")로 그려야 하므로 값으로 바꾼다.
 */
export type AdvisorDisabled = { readonly disabled: true };
const ADVISOR_DISABLED: AdvisorDisabled = { disabled: true };

export function isAdvisorDisabled<T>(
  value: T | AdvisorDisabled | undefined,
): value is AdvisorDisabled {
  return (
    typeof value === 'object' && value !== null && (value as AdvisorDisabled).disabled === true
  );
}

/** 404 → disabled, 그 외 오류는 그대로 throw(ErrorState 로 간다). */
async function orDisabled<T>(fetcher: () => Promise<T>): Promise<T | AdvisorDisabled> {
  try {
    return await fetcher();
  } catch (error) {
    if (isNotFound(error)) return ADVISOR_DISABLED;
    throw error;
  }
}

/** RUNNING 이 있으면 짧게, 없으면 길게. disabled 면 폴링 자체를 끈다. */
function runsPollInterval(
  query: Query<readonly { status: string }[] | AdvisorDisabled, Error>,
): number | false {
  const data = query.state.data;
  if (data === undefined) return IDLE_POLL_MS;
  if (isAdvisorDisabled(data)) return false;
  return data.some((run) => run.status === 'RUNNING') ? RUNNING_POLL_MS : IDLE_POLL_MS;
}

/** 최근 stock run — 오늘 파이프라인·실행 중/최근 실패·스케줄러 위젯이 공유한다. */
export function useRecentCollectRuns(limit = OVERVIEW_RUN_LIMIT) {
  return useQuery<CollectRunResponse[]>({
    queryKey: quantKeys.collectRuns(limit),
    queryFn: () => service.stockCollect.runs({ limit }),
    staleTime: 10 * 1000,
    refetchInterval: (query) =>
      runsPollInterval(query as Query<readonly { status: string }[], Error>),
    refetchOnWindowFocus: true,
  });
}

/** 최근 advisor run. advisor 가 꺼진 환경이면 `{disabled:true}`. */
export function useRecentAdvisorRuns(limit = OVERVIEW_RUN_LIMIT) {
  return useQuery<AdvisorRunResponse[] | AdvisorDisabled>({
    queryKey: quantKeys.advisorRuns(limit),
    queryFn: () => orDisabled(() => service.advisor.runs({ limit })),
    staleTime: 10 * 1000,
    refetchInterval: runsPollInterval,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

/** 경로 변수로 나가는 id — 숫자만. URL 에서 온 값이라 `../` 같은 것이 경로에 섞이면 안 된다. */
export function isNumericId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^\d+$/.test(value);
}

/** run 단건 — 상세 다이얼로그가 `?run=` 으로 연다(그리드 페이지에 없는 run 도 열려야 한다). 숫자 id 만 조회한다. */
export function useRun(module: RunModule, runId: string | null) {
  return useQuery<CollectRunResponse | AdvisorRunResponse>({
    queryKey: quantKeys.run(module, runId ?? ''),
    queryFn: () =>
      module === 'STOCK'
        ? service.stockCollect.run(runId as string)
        : service.advisor.run(runId as string),
    enabled: isNumericId(runId),
    staleTime: 5 * 1000,
    // RUNNING 상세를 열어 둔 동안 진행이 보이도록 — 종료 run 이면 다음 폴링에서 멈춘다.
    refetchInterval: (query) => (query.state.data?.status === 'RUNNING' ? RUNNING_POLL_MS : false),
    retry: false,
  });
}

/** KIS 토큰 상태 — 값은 노출되지 않는다. */
export function useKisToken() {
  return useQuery<KisTokenStatus>({
    queryKey: quantKeys.kisToken(),
    queryFn: () => service.stockCollect.token(),
    staleTime: 30 * 1000,
    refetchInterval: IDLE_POLL_MS,
  });
}

/**
 * ADVISE 게이트 판정. 404(advisor 비활성 또는 M1 미배포 백엔드) → disabled, retry·폴링 off.
 * `baseDate` 는 KST `YYYY-MM-DD`(`lib/quant/kstDate.ts#todayKst`) — 마운트 시점 값을 호출부가 고정해 넘긴다.
 */
export function useGate(baseDate: string) {
  return useQuery<AdvisorGateResponse | AdvisorDisabled>({
    queryKey: quantKeys.gate(baseDate),
    queryFn: () => orDisabled(() => service.advisor.gate(baseDate)),
    staleTime: 30 * 1000,
    refetchInterval: (query) => (isAdvisorDisabled(query.state.data) ? false : IDLE_POLL_MS),
    retry: false,
  });
}

/** 오늘 LIVE 판단 — 게이트 위젯의 "판단 완료" 칩과 상세 링크의 근거. */
export function useTodayAdvices(baseDate: string) {
  return useQuery<AdviceHeader[] | AdvisorDisabled>({
    queryKey: quantKeys.todayAdvices(baseDate),
    queryFn: () =>
      orDisabled(() =>
        service.advisor.advices({ from: baseDate, to: baseDate, variant: 'LIVE', limit: 5 }),
      ),
    staleTime: 30 * 1000,
    refetchInterval: (query) => (isAdvisorDisabled(query.state.data) ? false : IDLE_POLL_MS),
    retry: false,
  });
}
