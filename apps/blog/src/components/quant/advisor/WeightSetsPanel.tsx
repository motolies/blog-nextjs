'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  showToast,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  useConfirm,
} from '@hvy/ui';
import { type UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { type AdvisorDisabled, isAdvisorDisabled, quantKeys } from '@/hooks/useQuant';
import { showApiErrorToast } from '@/lib/apiErrorToast';
import { isMonitoringHorizon, weightConsumerJobOf } from '@/lib/quant/advisorHorizon';
import { runHref } from '@/lib/quant/routes';
import service from '@/service';
import type { WeightSet } from '@/types/quant';
import { ADVISOR_DISABLED_EMPTY, weightSourceLabel } from './advisorLabels';
import { formatFixed, formatSignedFixed, isSignificant } from './kpiFormat';

/**
 * 가중치 세트 — `GET /weights/sets?horizon=`(limit 20). 세트 한 줄이 `AccordionItem` 이고 펼치면 `weights[]` 정적 표다.
 * 활성 세트는 호라이즌마다 1개다 — 5 는 ADVISE, 20 은 ADVISE_H20 이 쓴다. 60·180 은 학습하지 않아 늘 비어 있다.
 *
 * "활성화" 버튼은 **트리거 바깥**(같은 줄 오른쪽)에 둔다 — `AccordionTrigger` 는 `<button>` 이라 안에 버튼을 못 넣는다.
 * Radix Header(`h3`) 는 flex 자식이지만 스스로 늘어나지 않아 `[&>h3]:flex-1` 로 트리거가 남는 폭을 먹게 한다.
 *
 * 활성화는 **가역**(이전 세트를 다시 활성화하면 되돌아간다) — Primary confirm, destructive 아님(PLAN confirm 매트릭스).
 * 그리드·다이얼로그 밖이라 `useConfirm()` 을 쓴다(반환값 이름은 `askConfirm` — `confirm` 은 GritQL 이 막는다).
 */
export function WeightSetsPanel({
  query,
  horizon,
}: {
  query: UseQueryResult<WeightSet[] | AdvisorDisabled>;
  /** 조회 중인 호라이즌 — 캡션·빈 상태·활성화 문구가 이 값을 따른다. */
  horizon: number;
}) {
  const askConfirm = useConfirm();
  const queryClient = useQueryClient();
  const [activating, setActivating] = useState<number | null>(null);
  // 세트를 쓰는 잡 — 활성화 문구의 "다음 {잡} 부터". 세트에 horizonDays 가 없는 구버전 응답이면 조회 호라이즌을 쓴다.
  const consumerOf = (set: WeightSet) =>
    weightConsumerJobOf(set.horizonDays ?? horizon) ?? 'ADVISE';

  /** 활성화 — 그 호라이즌의 다음 판단부터 적용. 성공 시 quantKeys.all 무효화(세트 목록·판단 헤더의 weightSetId 가 함께 갱신). */
  const activate = async (set: WeightSet) => {
    const consumer = consumerOf(set);
    const ok = await askConfirm({
      message: `가중치 세트 #${set.weightSetId}(h=${set.horizonDays ?? horizon} · ${weightSourceLabel(set.source)} · ${set.asOf}) 을 활성화합니다. 다음 ${consumer} 부터 적용되고, 이전 세트를 다시 활성화하면 되돌릴 수 있습니다.`,
      confirmLabel: '활성화',
    });
    if (!ok) return;
    setActivating(set.weightSetId);
    try {
      await service.advisor.activateWeightSet(set.weightSetId);
      showToast(`가중치 세트 #${set.weightSetId} 활성화 — 다음 ${consumer} 부터 적용됩니다.`);
      queryClient.invalidateQueries({ queryKey: quantKeys.all });
    } catch (error) {
      showApiErrorToast(`가중치 세트 #${set.weightSetId} 활성화에 실패했습니다.`, error);
    } finally {
      setActivating(null);
    }
  };

  return (
    <DashboardWidget
      id="advisor-weight-sets"
      title="가중치 세트"
      caption={`h=${horizon} · 최근 20개 · 활성 세트는 다음 ${weightConsumerJobOf(horizon) ?? '판단'} 의 시그널 가중치`}
      query={query}
      isEmpty={(data) => isAdvisorDisabled(data) || data.length === 0}
      empty={
        isAdvisorDisabled(query.data)
          ? ADVISOR_DISABLED_EMPTY
          : isMonitoringHorizon(horizon)
            ? {
                message: `h=${horizon} 는 가중치를 학습하지 않습니다`,
                hint: '모니터링 호라이즌 — IC 만 저장합니다(KPI 탭의 IC 호라이즌에서 확인)',
              }
            : {
                message: '가중치 세트가 없습니다',
                hint:
                  horizon === 20
                    ? 'IC_BACKFILL(h=20) 또는 WEEKLY_REVIEW 가 n_eff 게이트를 넘긴 뒤 생깁니다'
                    : 'advisor-seed.sql 시드 또는 IC_BACKFILL → WEEKLY_REVIEW 로 생성됩니다',
              }
      }
      errorMessage="가중치 세트를 불러오지 못했습니다."
    >
      {(data) => (
        <Accordion type="multiple">
          {(isAdvisorDisabled(data) ? [] : data).map((set) => (
            <AccordionItem key={set.weightSetId} value={String(set.weightSetId)}>
              <div className="flex items-center gap-2 [&>h3]:min-w-0 [&>h3]:flex-1">
                <AccordionTrigger className="min-w-0">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="tabular-nums">#{set.weightSetId}</span>
                    <span className="text-dl-fg-muted tabular-nums">{set.asOf}</span>
                    <Badge tone="neutral" size="xs">
                      {weightSourceLabel(set.source)}
                    </Badge>
                    {set.active ? (
                      <Badge tone="success" size="xs">
                        활성
                      </Badge>
                    ) : null}
                    <span className="text-dl-fg-muted text-dl-xs tabular-nums">
                      창 {set.windowDays}일 · nEff {set.nEff} · 시그널 {set.weights.length}
                    </span>
                  </span>
                </AccordionTrigger>
                {set.active ? null : (
                  <Button
                    size="xs"
                    variant="outline-primary"
                    icon={CheckCircle2}
                    busy={activating === set.weightSetId}
                    onClick={() => activate(set)}
                  >
                    활성화
                  </Button>
                )}
              </div>
              <AccordionContent>
                <div className="flex flex-col gap-2">
                  <p className="text-dl-xs text-dl-fg-muted wrap-anywhere">
                    {set.reason ?? '사유 없음'}
                    {set.runId !== null ? (
                      <>
                        {' · '}
                        <Link
                          href={runHref('ADVISOR', set.runId)}
                          className="text-dl-primary-ink hover:underline"
                        >
                          run #{set.runId}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <DashboardTable>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>시그널</TableHeaderCell>
                        <TableHeaderCell className="text-right">기본</TableHeaderCell>
                        <TableHeaderCell className="text-right">배수</TableHeaderCell>
                        <TableHeaderCell className="text-right">가중치</TableHeaderCell>
                        <TableHeaderCell>사용</TableHeaderCell>
                        <TableHeaderCell className="text-right">IC 평균 ± se</TableHeaderCell>
                        <TableHeaderCell className="text-right">t</TableHeaderCell>
                        <TableHeaderCell className="text-right">nDays</TableHeaderCell>
                        <TableHeaderCell className="whitespace-normal">비고</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {set.weights.map((weight) => (
                        <TableRow key={weight.signalCode}>
                          <TableCell className="font-dl-mono whitespace-nowrap">
                            {weight.signalCode}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatFixed(weight.baseWeight, 3)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatFixed(weight.multiplier, 2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatFixed(weight.weight, 3)}
                          </TableCell>
                          <TableCell>
                            <Badge tone={weight.enabled ? 'success' : 'neutral'} size="xs">
                              {weight.enabled ? '사용' : '꺼짐'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {weight.icMean === null
                              ? '—'
                              : `${formatSignedFixed(weight.icMean, 4)} ± ${formatFixed(weight.icSe, 4)}`}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums ${isSignificant(weight.tStat) ? 'font-semibold' : 'text-dl-fg-muted'}`}
                          >
                            {formatSignedFixed(weight.tStat, 2)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {weight.nDays ?? '—'}
                          </TableCell>
                          <TableCell>
                            <span className="flex flex-wrap items-center gap-1">
                              {weight.flagged ? (
                                <Badge tone="warning" size="xs">
                                  플래그
                                </Badge>
                              ) : null}
                              <span className="wrap-anywhere">{weight.note ?? ''}</span>
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DashboardTable>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </DashboardWidget>
  );
}
