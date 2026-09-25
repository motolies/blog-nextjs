'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  ContentDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorState,
  FieldValue,
  FormGrid,
  InlineNotice,
  Label,
  Switch,
} from '@hvy/ui';
import { Ban, ListRestart, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRun } from '@/hooks/useQuant';
import {
  formatCallsWithFailures,
  formatCostUsd,
  formatDurationMs,
  formatTokens,
} from '@/lib/quant/format';
import { ADVISOR_JOB_META, COLLECT_JOB_META } from '@/lib/quant/jobCatalog';
import { isTerminal, triggerLabel } from '@/lib/quant/runStatus';
import {
  advisorRerunArgs,
  describeBackfillRequest,
  isTickersTruncated,
  planStepRetry,
  restoreBackfillRequest,
  type StepRetryPlan,
} from '@/lib/quant/stepRetry';
import { retryableSteps, skippedSteps, stepsOf } from '@/lib/quant/steps';
import { formatCompact } from '@/lib/statFormat';
import type { AdvisorRunResponse, CollectRunResponse, RunModule } from '@/types/quant';
import { formatUtcToLocal } from '@/util/dateTimeUtil';
import { RunStatusBadge } from './RunStatusBadge';
import { RunStepsTable } from './RunStepsTable';
import type { RunActions } from './useRunActions';

type AvailablePlan = Extract<StepRetryPlan, { available: true }>;

/** 인라인 확인 대상 — 다이얼로그 안에서는 `useConfirm` 을 부르지 않는다(모달 위 모달 금지, `useTrackOpen` 경고). */
type Pending = { kind: 'cancel' } | { kind: 'rerun' } | { kind: 'step'; plan: AvailablePlan };

/**
 * run 상세(공용) — `ContentDialog size="lg"`. 열림 상태는 URL(`?run=`)이 진실이고 이 컴포넌트는 `runId` 로 스스로 조회한다
 * (그리드 페이지에 없는 run 도 409 토스트·Overview 세그먼트·Slack 딥링크에서 열려야 한다).
 *
 * 본문 순서: **액션 바**(재실행 / 실패 단계 재실행 ▾ / 취소 + resetCheckpoint Switch) → 요약 `FormGrid` → `steps[]` 표 →
 * metadata `<pre>` 는 `Accordion` 접힘. **푸터는 닫기 1개만** — `DialogFooter` 는 버튼 폭 220 고정·줄바꿈 없음이라 375px 에서 2개부터 잘린다.
 *
 * 액션을 누르면 액션 바 자리가 `InlineNotice warning` + [실행][취소] 로 바뀐다 — 확인 모달을 겹치지 않는 대신 같은 자리에서 묻는다.
 */
export function RunDetailDialog({
  module,
  runId,
  onClose,
  today,
  actions,
}: {
  module: RunModule;
  /** null 이면 닫힘. */
  runId: string | null;
  onClose: () => void;
  /** KST 오늘 — VALUATION 단계 재실행의 당일 한정·advisor `requested` 재현에 쓴다. */
  today: string;
  actions: RunActions;
}) {
  const open = runId !== null;
  const query = useRun(module, runId);
  const [pending, setPending] = useState<Pending | null>(null);
  const [resetCheckpoint, setResetCheckpoint] = useState(false);

  // run 이 바뀌면 이전 run 의 확인 상태·Switch 를 끌고 가지 않는다.
  useEffect(() => {
    setPending(null);
    setResetCheckpoint(false);
  }, [runId]);

  const run = query.data;
  const stockRun = module === 'STOCK' ? (run as CollectRunResponse | undefined) : undefined;
  const advisorRun = module === 'ADVISOR' ? (run as AdvisorRunResponse | undefined) : undefined;

  const steps = useMemo(() => stepsOf(run?.metadata), [run?.metadata]);
  // FAILED 만 재실행 계획을 세운다. SKIPPED 는 앞 단계 실패의 결과라 사유만 보여준다(결손 위에 파생값을 쌓지 않는다).
  const stepPlans = useMemo(
    () =>
      stockRun
        ? retryableSteps(steps).map((step) => planStepRetry(step.step, stockRun, today))
        : [],
    [steps, stockRun, today],
  );
  const skipped = useMemo(() => (stockRun ? skippedSteps(steps) : []), [steps, stockRun]);

  const terminal = run ? isTerminal(run.status) : false;
  const truncated = stockRun ? isTickersTruncated(stockRun) : false;
  const meta = run
    ? module === 'STOCK'
      ? COLLECT_JOB_META[(run as CollectRunResponse).jobType]
      : ADVISOR_JOB_META[(run as AdvisorRunResponse).jobType]
    : undefined;

  const busy =
    run !== undefined &&
    (actions.isBusy(`cancel:${module}:${run.runId}`) ||
      actions.isBusy(`trigger:${module}:${run.jobType}`) ||
      (pending?.kind === 'step' && actions.isBusy(`trigger:STOCK:${pending.plan.jobType}`)));

  /** 확인 문구 — PLAN confirm 매트릭스(잡·복원 인자·체크포인트·DAILY 증분·예상 소요). */
  const pendingMessage = (() => {
    if (!run || !pending) return null;
    if (pending.kind === 'cancel') {
      return `run #${run.runId} 를 취소합니다. 다음 종목/단계 경계에서 멈추고 저장된 데이터는 남습니다.`;
    }
    if (pending.kind === 'step') {
      return `${pending.plan.summary}${pending.plan.inferred ? ' (문서 미명시 매핑 — 잡 본문 대조로 확인)' : ''}. 같은 잡이 실행 중이면 409 로 거절됩니다.`;
    }
    if (stockRun) {
      const body = restoreBackfillRequest(stockRun) ?? {};
      const parts = [
        `${stockRun.jobDescription} 을 같은 인자로 다시 실행합니다 — ${describeBackfillRequest(body)}.`,
        resetCheckpoint
          ? '체크포인트를 초기화해 처음부터 다시 받습니다(attemptCount 5 초과로 제외된 종목도 포함).'
          : '체크포인트 커서부터 이어받습니다(attemptCount 5 초과 종목은 초기화 없이는 제외).',
      ];
      if (stockRun.jobType === 'DAILY') parts.push('DAILY 는 오늘(KST) 기준 증분 수집입니다.');
      if (meta?.durationHint) parts.push(`예상 소요 ${meta.durationHint}.`);
      if (meta?.longRunning) parts.push('백필류는 단일 스레드 직렬(대기열 10)입니다.');
      return parts.join(' ');
    }
    if (advisorRun) {
      const args = advisorRerunArgs(advisorRun, today);
      const parts = [
        `${advisorRun.jobDescription} 을 다시 실행합니다 (${args.baseDate ? `기준일 ${args.baseDate}` : '오늘 기준 — 스케줄 run 재현'}${args.horizon !== undefined ? ` · h=${args.horizon}` : ''}).`,
      ];
      if (advisorRun.jobType === 'ADVISE') {
        parts.push('이미 LIVE 판단이 있으면 SKIPPED 로 닫힙니다 — 판단 삭제 후 재판단하세요.');
      }
      return parts.join(' ');
    }
    return null;
  })();

  const execute = async () => {
    if (!run || !pending) return;
    if (pending.kind === 'cancel') {
      await actions.cancel(module, run);
    } else if (pending.kind === 'step') {
      await actions.retryStep(pending.plan);
    } else if (stockRun) {
      await actions.rerunStock(stockRun, resetCheckpoint);
    } else if (advisorRun) {
      await actions.rerunAdvisor(advisorRun, today);
    }
    setPending(null);
  };

  return (
    <ContentDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={run ? `run #${run.runId} · ${run.jobDescription}` : `run #${runId ?? ''}`}
      description={
        run
          ? `${triggerLabel(run.triggerType)} · ${module === 'STOCK' ? '주식 수집' : 'AI 판단'}`
          : undefined
      }
      size="lg"
      footer={
        <Button variant="outline-gray" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {query.isPending ? (
        <div className="flex flex-col gap-2 p-2">
          <span className="block h-4 w-1/3 animate-pulse rounded-dl-badge bg-dl-option-hover motion-reduce:animate-none" />
          <span className="block h-24 w-full animate-pulse rounded-dl-container bg-dl-option-hover motion-reduce:animate-none" />
        </div>
      ) : query.isError || !run ? (
        <ErrorState message="run 을 불러오지 못했습니다." onRetry={query.refetch} />
      ) : (
        <div className="flex flex-col gap-3 p-1">
          {/* ── 액션 바 / 인라인 확인 ── */}
          {pending && pendingMessage ? (
            <InlineNotice
              tone={pending.kind === 'rerun' && resetCheckpoint ? 'error' : 'warning'}
              title={
                pending.kind === 'cancel'
                  ? '취소 확인'
                  : pending.kind === 'step'
                    ? '단계 재실행 확인'
                    : '재실행 확인'
              }
              action={
                <span className="flex flex-wrap gap-1">
                  <Button
                    size="xs"
                    variant={
                      pending.kind === 'rerun' && resetCheckpoint ? 'outline-red' : 'primary'
                    }
                    busy={busy}
                    onClick={execute}
                  >
                    실행
                  </Button>
                  <Button size="xs" variant="outline-gray" onClick={() => setPending(null)}>
                    취소
                  </Button>
                </span>
              }
            >
              <span className="wrap-anywhere">{pendingMessage}</span>
            </InlineNotice>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {terminal ? (
                <Button
                  size="sm"
                  variant="primary"
                  icon={RotateCcw}
                  disabled={truncated}
                  title={
                    truncated
                      ? '종목 목록이 20개를 넘어 인자를 복원할 수 없습니다 — 수동 실행 탭에서 종목을 다시 지정하세요'
                      : undefined
                  }
                  onClick={() => setPending({ kind: 'rerun' })}
                >
                  재실행
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline-gray"
                  icon={Ban}
                  onClick={() => setPending({ kind: 'cancel' })}
                >
                  취소
                </Button>
              )}

              {stockRun && stepPlans.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button size="sm" variant="outline-primary" icon={ListRestart}>
                      실패 단계 재실행 ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {/* `=== false` 비교인 이유: strictNullChecks 가 꺼진 tsconfig 에서는 truthiness 로 판별 유니언이 좁혀지지 않는다 */}
                    {stepPlans.map((plan) =>
                      plan.available === false ? (
                        <DropdownMenuItem key={plan.step} disabled>
                          <span className="flex flex-col">
                            <span>{plan.step} — 대응 없음</span>
                            <span className="text-dl-xs text-dl-fg-muted">{plan.reason}</span>
                          </span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          key={plan.step}
                          onSelect={() => setPending({ kind: 'step', plan })}
                        >
                          {plan.summary}
                        </DropdownMenuItem>
                      ),
                    )}
                    {/* SKIPPED 는 재실행 대상이 아니다 — 앞 단계 실패의 결과라 사유만 보인다(결손 위에 파생값을 쌓지 않는다) */}
                    {skipped.map((step) => (
                      <DropdownMenuItem key={`skipped-${step.step}`} disabled>
                        <span className="flex flex-col">
                          <span>{step.step} — 건너뜀(재실행 대상 아님)</span>
                          {step.reason ? (
                            <span className="text-dl-xs text-dl-fg-muted">{step.reason}</span>
                          ) : null}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {stockRun && terminal ? (
                <span className="ml-auto flex items-center gap-2">
                  <Label htmlFor="run-reset-checkpoint" className="text-dl-xs text-dl-fg-muted">
                    체크포인트 초기화
                  </Label>
                  <Switch
                    id="run-reset-checkpoint"
                    label="체크포인트 초기화 — 처음부터 다시 받는다"
                    size="sm"
                    checked={resetCheckpoint}
                    onCheckedChange={setResetCheckpoint}
                  />
                </span>
              ) : null}
            </div>
          )}

          {/* ── 요약 ── */}
          <FormGrid>
            <FieldValue size="sm" label="상태">
              <RunStatusBadge status={run.status} size="sm" />
            </FieldValue>
            <FieldValue size="sm" label="트리거">
              {triggerLabel(run.triggerType)}
            </FieldValue>
            {stockRun ? (
              <FieldValue size="sm" label="대상일">
                {stockRun.targetDate ?? '—'}
                {stockRun.rangeStart || stockRun.rangeEnd ? (
                  <span className="ml-1 text-dl-fg-muted">
                    ({stockRun.rangeStart ?? '기본'} ~ {stockRun.rangeEnd ?? '오늘'})
                  </span>
                ) : null}
              </FieldValue>
            ) : (
              <FieldValue size="sm" label="기준일">
                {advisorRun?.baseDate ?? '—'}
              </FieldValue>
            )}
            <FieldValue size="sm" label="시작">
              {formatUtcToLocal(run.startedAt, 'yyyy-MM-dd HH:mm:ss')}
            </FieldValue>
            <FieldValue size="sm" label="종료">
              {run.finishedAt ? formatUtcToLocal(run.finishedAt, 'yyyy-MM-dd HH:mm:ss') : '—'}
            </FieldValue>
            <FieldValue size="sm" label="소요">
              {formatDurationMs(run.durationMs)}
            </FieldValue>
            {stockRun ? (
              <>
                <FieldValue size="sm" label="행수">
                  {formatCompact(stockRun.rowsUpserted)}
                </FieldValue>
                <FieldValue size="sm" label="API 호출 / 실패">
                  {formatCallsWithFailures(stockRun.apiCallCount, stockRun.apiFailCount)}
                </FieldValue>
              </>
            ) : null}
            {advisorRun ? (
              <>
                <FieldValue size="sm" label="모델">
                  {advisorRun.model ?? '—'}
                  {advisorRun.promptVersion ? (
                    <span className="ml-1 text-dl-fg-muted">({advisorRun.promptVersion})</span>
                  ) : null}
                </FieldValue>
                <FieldValue size="sm" label="LLM 호출">
                  {formatCompact(advisorRun.llmCalls)}
                </FieldValue>
                <FieldValue size="sm" label="토큰 입력 / 출력">
                  {formatTokens(advisorRun.promptTokens)} /{' '}
                  {formatTokens(advisorRun.completionTokens)}
                </FieldValue>
                <FieldValue size="sm" label="토큰 추론 / 캐시">
                  {formatTokens(advisorRun.reasoningTokens)} /{' '}
                  {formatTokens(advisorRun.cachedTokens)}
                </FieldValue>
                <FieldValue size="sm" label="비용">
                  {formatCostUsd(advisorRun.costUsd)}
                </FieldValue>
              </>
            ) : null}
          </FormGrid>

          {run.errorMessage ? (
            <InlineNotice tone={run.status === 'SKIPPED' ? 'muted' : 'error'} title="메시지">
              <span className="whitespace-pre-wrap wrap-anywhere">{run.errorMessage}</span>
            </InlineNotice>
          ) : null}

          {/* ── steps[] ── */}
          {steps.length > 0 ? (
            <section className="flex flex-col gap-1">
              <h3 className="text-dl-sm font-semibold text-dl-fg">단계</h3>
              <RunStepsTable steps={steps} />
            </section>
          ) : null}

          {/* ── metadata ── */}
          {run.metadata ? (
            <Accordion type="single" collapsible>
              <AccordionItem value="metadata">
                <AccordionTrigger>metadata JSON</AccordionTrigger>
                <AccordionContent>
                  <pre className="m-0 max-h-[40vh] overflow-auto whitespace-pre-wrap break-all rounded-dl-container bg-dl-grid-header p-3 font-dl-mono text-dl-fg text-dl-xs">
                    {JSON.stringify(run.metadata, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </div>
      )}
    </ContentDialog>
  );
}
