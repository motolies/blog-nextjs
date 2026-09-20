'use client';

import {
  Badge,
  InlineNotice,
  Label,
  Select,
  StatTile,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@hvy/ui';
import { useState } from 'react';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { isAdvisorDisabled } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { todayKst } from '@/lib/quant/kstDate';
import { addDays } from '@/lib/quant/usage';
import { formatCompact } from '@/lib/statFormat';
import type { ScoreSummaryResponse } from '@/types/quant';
import { AdvisorDisabledPanel } from './AdvisorDisabledPanel';
import { ADVISOR_DISABLED_EMPTY, variantLabel, variantTone } from './advisorLabels';
import { useIcStats, useScoreSummary, useUsageRuns } from './advisorQueries';
import {
  formatFixed,
  formatPctWithSe,
  formatRate,
  formatSignedFixed,
  formatSignedPct,
  isSignificant,
  signTone,
} from './kpiFormat';
import { LlmUsagePanel } from './LlmUsagePanel';

/** 기간 select — 백엔드 기본 90일을 가운데 둔다. URL `?days=` 로 유지한다(탭·모달과 같은 규칙: 검색 상태는 URL). */
const PERIOD_OPTIONS = [
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 90일' },
  { value: '180', label: '최근 180일' },
] as const;
const DEFAULT_DAYS = 90;

/** 교훈 게이트 — `advisor.lesson.min-picks`(300). WEEKLY_REVIEW 의 LESSONS 단계가 누적 LIVE 픽 이 값 이상일 때만 돈다. */
const LESSON_MIN_PICKS = 300;

/**
 * "누적" 의 시작일 — advisor 모듈이 2026-09 에 들어왔으므로 그 해 첫날부터 세면 전체 기간이다.
 * 게이트(`WeekLyReviewJob`)는 기간 필터 없이 LIVE 픽 전체를 세므로 화면도 선택 기간이 아니라 전체를 본다.
 */
const LIFETIME_FROM = '2026-01-01';

const SIGN_CLASS: Record<ReturnType<typeof signTone>, string> = {
  success: 'text-dl-success-ink',
  danger: 'text-dl-danger-ink',
  neutral: 'text-dl-fg',
};

function parseDays(raw: string | null): number {
  const value = Number(raw);
  return PERIOD_OPTIONS.some((option) => Number(option.value) === value) ? value : DEFAULT_DAYS;
}

/**
 * KPI 탭 — `GET /scores/summary`(variants·regime·calibration·recent·note) + `GET /scores/ic` + LLM 사용량.
 * 전부 `DashboardWidget`(읽기 실패 토스트 금지·위젯 안 재시도). advisor 404 면 탭 전체가 빈 상태다.
 *
 * "누적 LIVE 픽 N / 300" 타일은 선택 기간이 아니라 **전체 기간**(`LIFETIME_FROM`~오늘)의 `scoreSummary` 를 따로 읽는다 —
 * 게이트가 보는 값이 전체 누적이기 때문이다. 화면 필터와 기준이 다르므로 hint 에 "전체 기준" 을 명기한다(StatTile 문서 규칙).
 */
export function KpiTab() {
  const [today] = useState(() => todayKst());
  const [daysParam, setDaysParam] = useSearchParamState('days');
  const days = parseDays(daysParam);
  const from = addDays(today, -(days - 1));

  const summary = useScoreSummary(from, today);
  // 전체 기간 — 키가 (from,to) 로 갈려 선택 기간 쿼리와 캐시가 섞이지 않는다(`quantKeys.all` 하위라 invalidate 는 함께 된다)
  const lifetime = useScoreSummary(LIFETIME_FROM, today);
  const ic = useIcStats(today, days);
  const usage = useUsageRuns();

  const lifetimeLivePicks =
    lifetime.data === undefined || isAdvisorDisabled(lifetime.data)
      ? null
      : (lifetime.data.variants.find((variant) => variant.variant === 'LIVE')?.picks ?? 0);

  if (isAdvisorDisabled(summary.data)) {
    return <AdvisorDisabledPanel />;
  }

  return (
    <div className="admin-fill flex flex-1 flex-col gap-4 pb-2">
      <div className="flex flex-wrap items-end gap-2">
        {/* 폭은 옵션 문구("최근 180일")가 정한다 — 좁은 화면에서만 한 줄을 다 쓴다(치수 리터럴 없이) */}
        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
          <Label htmlFor="kpi-days" className="text-dl-xs text-dl-fg-muted">
            기간
          </Label>
          <Select
            id="kpi-days"
            size="sm"
            value={String(days)}
            onValueChange={(value) => setDaysParam(value === String(DEFAULT_DAYS) ? null : value)}
            placeholder="기간"
            options={PERIOD_OPTIONS}
            className="w-full"
          />
        </div>
        <p className="pb-2 text-dl-xs text-[color:var(--admin-text-faint)]">
          {from} ~ {today} · 청산 h=T+5 · 잠정·확정 채점 포함
        </p>
      </div>

      {/* ── 타일: 누적 LIVE 픽 / 국면 콜 ── */}
      <DashboardWidget
        id="advisor-kpi-tiles"
        title="교훈 게이트 · 국면 콜"
        caption="LIVE 픽 300 이상이면 WEEKLY_REVIEW 가 교훈 후보를 만든다"
        query={summary}
        isEmpty={(data) => isAdvisorDisabled(data)}
        empty={ADVISOR_DISABLED_EMPTY}
        errorMessage="KPI 요약을 불러오지 못했습니다."
      >
        {(data) => {
          const response = data as ScoreSummaryResponse;
          const regime = response.regime;
          return (
            <div className="admin-stat-grid">
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <StatTile
                  label="누적 LIVE 픽"
                  hint={`전체 기준(${LIFETIME_FROM}~) · 게이트 ${LESSON_MIN_PICKS}`}
                  tone={
                    lifetimeLivePicks === null
                      ? 'neutral'
                      : lifetimeLivePicks >= LESSON_MIN_PICKS
                        ? 'success'
                        : 'warning'
                  }
                  value={
                    lifetimeLivePicks === null
                      ? `… / ${LESSON_MIN_PICKS}`
                      : `${formatCompact(lifetimeLivePicks)} / ${LESSON_MIN_PICKS}`
                  }
                />
              </div>
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <StatTile
                  label="국면 콜"
                  hint="KOSPI/KOSDAQ 방향 판단 수"
                  value={formatCompact(regime.calls)}
                />
              </div>
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <StatTile
                  label="국면 승률"
                  hint="방향 적중 비율"
                  tone={
                    regime.hitRate === null
                      ? 'neutral'
                      : regime.hitRate >= 0.55
                        ? 'success'
                        : 'warning'
                  }
                  value={formatRate(regime.hitRate)}
                />
              </div>
              <div className="col-span-12 sm:col-span-6 xl:col-span-3">
                <StatTile
                  label="Brier"
                  hint={`skill ${formatSignedFixed(regime.brierSkill, 3)} (양수면 기저 우위)`}
                  tone={signTone(regime.brierSkill)}
                  value={formatFixed(regime.meanBrier, 3)}
                />
              </div>
            </div>
          );
        }}
      </DashboardWidget>

      {/* ── 변형별 성과 ── */}
      <DashboardWidget
        id="advisor-kpi-variants"
        title="변형별 성과"
        caption="부가가치 = 픽 평균 초과 − 후보군 평균 초과 · LLM 층의 1차 KPI"
        query={summary}
        isEmpty={(data) => isAdvisorDisabled(data) || data.variants.length === 0}
        empty={
          isAdvisorDisabled(summary.data)
            ? ADVISOR_DISABLED_EMPTY
            : {
                message: '기간 안 판단이 없습니다',
                hint: '기간을 늘리거나 ADVISE 실행을 확인하세요',
              }
        }
        errorMessage="변형별 성과를 불러오지 못했습니다."
      >
        {(data) => {
          const response = data as ScoreSummaryResponse;
          return (
            <div className="flex flex-col gap-3">
              <DashboardTable>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>변형</TableHeaderCell>
                    <TableHeaderCell className="text-right">판단</TableHeaderCell>
                    <TableHeaderCell className="text-right">픽</TableHeaderCell>
                    <TableHeaderCell className="text-right">승률</TableHeaderCell>
                    <TableHeaderCell className="text-right">평균 초과 ± se</TableHeaderCell>
                    <TableHeaderCell className="text-right">비용 조정</TableHeaderCell>
                    <TableHeaderCell className="text-right">후보군 평균</TableHeaderCell>
                    <TableHeaderCell className="text-right">부가가치</TableHeaderCell>
                    <TableHeaderCell className="text-right">회피 초과</TableHeaderCell>
                    <TableHeaderCell className="text-right">회피 픽</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {response.variants.map((variant) => (
                    <TableRow key={variant.variant}>
                      <TableCell>
                        <Badge tone={variantTone(variant.variant)} size="xs">
                          {variantLabel(variant.variant)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(variant.advices)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(variant.picks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRate(variant.hitRate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatPctWithSe(variant.meanExcess, variant.seExcess)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSignedPct(variant.meanCostAdj)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSignedPct(variant.poolMeanExcess)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold tabular-nums ${SIGN_CLASS[signTone(variant.valueAdd)]}`}
                      >
                        {formatSignedPct(variant.valueAdd)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatSignedPct(variant.avoidMeanExcess)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(variant.avoidPicks)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DashboardTable>
              {response.note ? (
                <InlineNotice tone="info" title="판정 기준">
                  <span className="wrap-anywhere">{response.note}</span>
                </InlineNotice>
              ) : null}
            </div>
          );
        }}
      </DashboardWidget>

      <div className="admin-split-layout" data-size="balanced">
        {/* ── 확신 보정 ── */}
        <DashboardWidget
          id="advisor-kpi-calibration"
          title="확신 보정"
          caption="확신 구간별 승률 — 확신이 높을수록 승률이 올라야 보정이 맞다"
          query={summary}
          isEmpty={(data) => isAdvisorDisabled(data) || data.calibration.length === 0}
          empty={
            isAdvisorDisabled(summary.data)
              ? ADVISOR_DISABLED_EMPTY
              : { message: '채점된 픽이 없습니다', hint: 'T+5 청산 뒤 SCORE 가 돌면 채워집니다' }
          }
          errorMessage="보정 표를 불러오지 못했습니다."
        >
          {(data) => (
            <DashboardTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="text-right">확신</TableHeaderCell>
                  <TableHeaderCell className="text-right">n</TableHeaderCell>
                  <TableHeaderCell className="text-right">승률</TableHeaderCell>
                  <TableHeaderCell className="text-right">평균 초과</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data as ScoreSummaryResponse).calibration.map((row) => (
                  <TableRow key={row.conviction}>
                    <TableCell className="text-right tabular-nums">
                      {formatRate(row.conviction, 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCompact(row.n)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRate(row.hitRate)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${SIGN_CLASS[signTone(row.meanExcess)]}`}
                    >
                      {formatSignedPct(row.meanExcess)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DashboardTable>
          )}
        </DashboardWidget>

        {/* ── 최근 채점 픽 ── */}
        <DashboardWidget
          id="advisor-kpi-recent"
          title="최근 채점 픽"
          caption="LIVE · 청산 완료 순"
          query={summary}
          isEmpty={(data) => isAdvisorDisabled(data) || data.recent.length === 0}
          empty={
            isAdvisorDisabled(summary.data)
              ? ADVISOR_DISABLED_EMPTY
              : { message: '채점된 픽이 없습니다', hint: 'T+5 청산 뒤 SCORE 가 돌면 채워집니다' }
          }
          errorMessage="최근 픽을 불러오지 못했습니다."
        >
          {(data) => (
            <DashboardTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>기준일</TableHeaderCell>
                  <TableHeaderCell>종목</TableHeaderCell>
                  <TableHeaderCell className="text-right">확신</TableHeaderCell>
                  <TableHeaderCell className="text-right">초과</TableHeaderCell>
                  <TableHeaderCell>적중</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data as ScoreSummaryResponse).recent.map((pick) => (
                  <TableRow key={`${pick.baseDate}-${pick.ticker}`}>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {pick.baseDate}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-dl-mono">{pick.ticker}</span>
                      {pick.stockName ? (
                        <span className="ml-1 text-dl-fg-muted">{pick.stockName}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRate(pick.conviction, 0)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${SIGN_CLASS[signTone(pick.excess)]}`}
                    >
                      {formatSignedPct(pick.excess)}
                    </TableCell>
                    <TableCell>
                      {pick.hit === null ? (
                        '—'
                      ) : (
                        <Badge tone={pick.hit ? 'success' : 'danger'} size="xs">
                          {pick.hit ? '적중' : '빗나감'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DashboardTable>
          )}
        </DashboardWidget>
      </div>

      {/* ── 시그널 IC ── */}
      <DashboardWidget
        id="advisor-kpi-ic"
        title="시그널 IC"
        caption={`asOf ${today} · 창 ${days}일 · |t| ≥ 2 강조`}
        query={ic}
        isEmpty={(data) => isAdvisorDisabled(data) || data.length === 0}
        empty={
          isAdvisorDisabled(ic.data)
            ? ADVISOR_DISABLED_EMPTY
            : { message: 'IC 관측이 없습니다', hint: 'IC_BACKFILL 을 먼저 실행하세요' }
        }
        errorMessage="시그널 IC 를 불러오지 못했습니다."
      >
        {(data) => (
          <DashboardTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>시그널</TableHeaderCell>
                <TableHeaderCell className="text-right">nDays</TableHeaderCell>
                <TableHeaderCell className="text-right">nEff</TableHeaderCell>
                <TableHeaderCell className="text-right">IC 평균</TableHeaderCell>
                <TableHeaderCell className="text-right">se</TableHeaderCell>
                <TableHeaderCell className="text-right">t</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(isAdvisorDisabled(data) ? [] : data).map((stat) => {
                const significant = isSignificant(stat.tStat);
                return (
                  <TableRow key={stat.signalCode}>
                    <TableCell className="font-dl-mono whitespace-nowrap">
                      {stat.signalCode}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{stat.nDays}</TableCell>
                    <TableCell className="text-right tabular-nums">{stat.nEff}</TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${significant ? `font-semibold ${SIGN_CLASS[signTone(stat.mean)]}` : ''}`}
                    >
                      {formatSignedFixed(stat.mean, 4)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatFixed(stat.se, 4)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${significant ? 'font-semibold' : 'text-dl-fg-muted'}`}
                    >
                      {formatSignedFixed(stat.tStat, 2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DashboardTable>
        )}
      </DashboardWidget>

      {/* ── LLM 사용량 ── */}
      <LlmUsagePanel query={usage} today={today} />
    </div>
  );
}
