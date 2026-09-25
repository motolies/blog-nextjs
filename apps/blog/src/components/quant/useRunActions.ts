'use client';

import { showToast } from '@hvy/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { dashboardKeys } from '@/hooks/useDashboard';
import { quantKeys } from '@/hooks/useQuant';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { conflictOf, failMessageOf } from '@/lib/quant/apiOutcome';
import { jobLabel } from '@/lib/quant/jobCatalog';
import { runHref } from '@/lib/quant/routes';
import { runStatusLabel } from '@/lib/quant/runStatus';
import {
  type AdvisorTriggerArgs,
  advisorRerunArgs,
  restoreBackfillRequest,
  type StepRetryPlan,
} from '@/lib/quant/stepRetry';
import service from '@/service';
import type { TriggerResult } from '@/service/stockCollectService';
import type {
  AdvisorJobType,
  AdvisorRunResponse,
  BackfillRequest,
  CollectJobType,
  CollectRunResponse,
  RunModule,
} from '@/types/quant';

/** 액션이 있는 토스트는 누를 시간이 필요하다(apiErrorToast 와 같은 8초). */
const ACTION_TOAST_MS = 8_000;

export type TriggerOutcome =
  | { ok: true; runId: number; accepted: boolean; status: string }
  | { ok: false; conflictRunId?: string };

/**
 * run 변이 액션의 단일 소유자 — 트리거·재실행·단계 재실행·취소.
 *
 * 앱 관례(`useMutation` 0건)대로 `service.*` 를 직접 부르고, 토스트 문구(PLAN "토스트 문구")·409 처리·
 * `quantKeys.all` invalidate 를 한곳에서 한다. 운영 현황 위젯·실행 이력 그리드·상세 다이얼로그 세 호출부가 같은 함수를 쓴다.
 *
 * **확인(confirm)은 여기서 하지 않는다** — 그리드·위젯은 `useConfirm()`, 다이얼로그는 인라인 확인 바로 각자 방식이 다르다.
 * 성공 뒤 `onChanged` 를 부른다 — 그리드는 `grid.refresh()` 를 넘긴다(react-query 밖이라 invalidate 로는 안 갱신된다).
 *
 * **메서드 참조는 마운트 뒤 바뀌지 않는다.** `onChanged` 는 ref 로 보관하고(호출부가 매 렌더 새 클로저를 넘겨도 무관),
 * 이중 클릭 가드는 ref 로 판정한다 — busy 를 state 로만 두면 `run` 이 busy 마다 새 함수가 되어 그 위의 메서드 전부가
 * 바뀌고, 그 메서드를 의존성으로 가진 그리드 컬럼(`useRunColumns` 의 useMemo)이 렌더마다 재계산된다
 * (`useGridSettings` 는 columns 참조 안정을 요구한다). 반환 객체만 `busyKey` 에 따라 바뀐다(`isBusy` 렌더용).
 */
export function useRunActions(options?: { onChanged?: () => void }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  // 렌더용 — 버튼 busy 표시. 판정은 아래 ref 가 한다.
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busyRef = useRef<string | null>(null);
  // 호출부의 onChanged 는 보통 `() => gridRef.current?.refresh()` 같은 매 렌더 새 클로저다 — 최신 것을 ref 로 본다.
  const onChangedRef = useRef(options?.onChanged);
  onChangedRef.current = options?.onChanged;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: quantKeys.all });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.health(24) });
    onChangedRef.current?.();
  }, [queryClient]);

  const openRun = useCallback(
    (module: RunModule, runId: number | string) => {
      router.push(runHref(module, runId));
    },
    [router],
  );

  /** 트리거 공통 후처리 — 202/200/SKIPPED/409 문구. `label` 은 잡 표기(jobDescription 우선). */
  const settleTrigger = useCallback(
    (
      module: RunModule,
      label: string,
      result: TriggerResult<CollectRunResponse | AdvisorRunResponse>,
    ) => {
      const { run, accepted } = result;
      if (run.status === 'SKIPPED') {
        showToast(`${label} 건너뜀 — ${run.errorMessage ?? '조건 미충족'}`, 'warning', {
          action: { label: '이력 보기', onClick: () => openRun(module, run.runId) },
          durationMs: ACTION_TOAST_MS,
        });
      } else if (accepted) {
        showToast(`${label} 을 백그라운드에서 시작했습니다 · run #${run.runId}`, 'success', {
          action: { label: '이력 보기', onClick: () => openRun(module, run.runId) },
          durationMs: ACTION_TOAST_MS,
        });
      } else {
        showToast(
          `${label} 완료 · ${runStatusLabel(run.status)}`,
          run.status === 'SUCCESS' ? 'success' : 'warning',
          {
            action: { label: '이력 보기', onClick: () => openRun(module, run.runId) },
            durationMs: ACTION_TOAST_MS,
          },
        );
      }
      invalidate();
      return { ok: true, runId: run.runId, accepted, status: run.status } as const;
    },
    [invalidate, openRun],
  );

  /** 실패 공통 — 409 는 경고 토스트 + '열기', 400 은 백엔드 문구 그대로, 그 외 traceId 토스트. */
  const settleFailure = useCallback(
    (module: RunModule, label: string, error: unknown): TriggerOutcome => {
      const conflict = conflictOf(error);
      if (conflict) {
        showToast(`${label} 가 이미 실행 중 · run #${conflict.runningRunId}`, 'warning', {
          action: { label: '열기', onClick: () => openRun(module, conflict.runningRunId) },
          durationMs: ACTION_TOAST_MS,
        });
        return { ok: false, conflictRunId: conflict.runningRunId };
      }
      const rejected = failMessageOf(error);
      showApiErrorToast(
        rejected ? `${label} 요청 거부 — ${rejected}` : `${label} 실행에 실패했습니다.`,
        error,
      );
      return { ok: false };
    },
    [openRun],
  );

  /**
   * 진행 중 표시를 감싸는 실행기. 같은 키가 이미 진행 중이면 무시한다.
   * 판정은 ref(동기), 표시는 state — 의존성이 없어 참조가 고정된다.
   */
  const run = useCallback(
    async <T>(key: string, task: () => Promise<T>): Promise<T | undefined> => {
      if (busyRef.current === key) return undefined;
      busyRef.current = key;
      setBusyKey(key);
      try {
        return await task();
      } finally {
        if (busyRef.current === key) busyRef.current = null;
        setBusyKey((current) => (current === key ? null : current));
      }
    },
    [],
  );

  const triggerStock = useCallback(
    (jobType: CollectJobType, body?: BackfillRequest, label = jobLabel('STOCK', jobType)) =>
      run(`trigger:STOCK:${jobType}`, async (): Promise<TriggerOutcome> => {
        try {
          return settleTrigger('STOCK', label, await service.stockCollect.trigger(jobType, body));
        } catch (error) {
          return settleFailure('STOCK', label, error);
        }
      }),
    [run, settleTrigger, settleFailure],
  );

  /** advisor 트리거 — `args` 는 baseDate(과거 보충)·horizon(IC_BACKFILL 전용). busy 키는 잡 단위라 인자와 무관하다. */
  const triggerAdvisor = useCallback(
    (
      jobType: AdvisorJobType,
      args: AdvisorTriggerArgs = {},
      label = jobLabel('ADVISOR', jobType),
    ) =>
      run(`trigger:ADVISOR:${jobType}`, async (): Promise<TriggerOutcome> => {
        try {
          return settleTrigger('ADVISOR', label, await service.advisor.trigger(jobType, args));
        } catch (error) {
          return settleFailure('ADVISOR', label, error);
        }
      }),
    [run, settleTrigger, settleFailure],
  );

  /**
   * 스케줄러 행 "지금 실행" — `manualTrigger.jobTypes` 를 순차로 부른다(MASTER → HOLIDAY).
   * 앞 잡이 실패·409 면 뒤를 부르지 않는다.
   */
  const triggerSequence = useCallback(
    async (module: RunModule, jobTypes: readonly string[]) => {
      for (const jobType of jobTypes) {
        const outcome =
          module === 'STOCK'
            ? await triggerStock(jobType as CollectJobType)
            : await triggerAdvisor(jobType as AdvisorJobType);
        if (!outcome?.ok) return outcome;
      }
      return { ok: true } as const;
    },
    [triggerStock, triggerAdvisor],
  );

  const cancel = useCallback(
    (
      module: RunModule,
      target: Pick<CollectRunResponse | AdvisorRunResponse, 'runId' | 'jobDescription'>,
    ) =>
      run(`cancel:${module}:${target.runId}`, async () => {
        try {
          const updated =
            module === 'STOCK'
              ? await service.stockCollect.cancel(target.runId)
              : await service.advisor.cancel(target.runId);
          showToast(
            `${target.jobDescription} run #${target.runId} 취소 요청 — 다음 종목/단계 경계에서 멈춥니다 (${runStatusLabel(updated.status)})`,
            'success',
          );
          invalidate();
          return true;
        } catch (error) {
          showApiErrorToast(`run #${target.runId} 취소에 실패했습니다.`, error);
          return false;
        }
      }),
    [run, invalidate],
  );

  /** 종료 stock run 재실행 — metadata 에서 인자를 복원하고 resetCheckpoint 는 호출부(Switch)가 정한다. */
  const rerunStock = useCallback(
    (target: CollectRunResponse, resetCheckpoint: boolean) => {
      const body = restoreBackfillRequest(target);
      if (body === null) {
        showToast(
          '종목 목록이 20개를 넘어 인자를 복원할 수 없습니다 — 수동 실행 탭에서 종목을 다시 지정하세요.',
          'warning',
        );
        return Promise.resolve<TriggerOutcome | undefined>({ ok: false });
      }
      return triggerStock(
        target.jobType,
        resetCheckpoint ? { ...body, resetCheckpoint: true } : body,
        target.jobDescription,
      );
    },
    [triggerStock],
  );

  /** advisor 재실행 — `requested` 재현·IC_BACKFILL 호라이즌 복원 규칙(stepRetry.ts). */
  const rerunAdvisor = useCallback(
    (target: AdvisorRunResponse, today: string) =>
      triggerAdvisor(target.jobType, advisorRerunArgs(target, today), target.jobDescription),
    [triggerAdvisor],
  );

  /** 실패 단계 재실행 — `planStepRetry` 가 만든 계획을 그대로 실행한다. */
  const retryStep = useCallback(
    (plan: Extract<StepRetryPlan, { available: true }>) =>
      triggerStock(
        plan.jobType,
        plan.body,
        `${plan.step} 단계 → ${jobLabel('STOCK', plan.jobType)}`,
      ),
    [triggerStock],
  );

  // 메서드는 전부 고정 참조다 — 객체는 busyKey 가 바뀔 때만 새로 만든다(isBusy 가 렌더에 반영되도록).
  return useMemo(
    () => ({
      busyKey,
      isBusy: (key: string) => busyKey === key,
      openRun,
      triggerStock,
      triggerAdvisor,
      triggerSequence,
      cancel,
      rerunStock,
      rerunAdvisor,
      retryStep,
      invalidate,
    }),
    [
      busyKey,
      openRun,
      triggerStock,
      triggerAdvisor,
      triggerSequence,
      cancel,
      rerunStock,
      rerunAdvisor,
      retryStep,
      invalidate,
    ],
  );
}

export type RunActions = ReturnType<typeof useRunActions>;
