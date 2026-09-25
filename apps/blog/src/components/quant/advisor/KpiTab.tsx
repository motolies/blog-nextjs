'use client';

import {
  Badge,
  InlineNotice,
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
import { useSearchParamState, useSearchParamsPatch } from '@/hooks/useSearchParamState';
import {
  DAILY_HORIZON,
  decisionHorizonOf,
  isMonitoringHorizon,
  KPI_KINDS,
  type KpiKind,
  kpiHorizonsOf,
  resolveIcHorizon,
  resolveKind,
  resolveKpiHorizon,
} from '@/lib/quant/advisorHorizon';
import { todayKst } from '@/lib/quant/kstDate';
import { addDays } from '@/lib/quant/usage';
import { formatCompact } from '@/lib/statFormat';
import {
  IC_HORIZONS,
  type MorningVsDailyResponse,
  type PairedDiff,
  type ScoreSummaryResponse,
} from '@/types/quant';
import { AdvisorDisabledPanel } from './AdvisorDisabledPanel';
import { ADVISOR_DISABLED_EMPTY, KIND_LABEL, variantLabel, variantTone } from './advisorLabels';
import { useIcStats, useMorningVsDaily, useScoreSummary, useUsageRuns } from './advisorQueries';
import { FilterSelect } from './FilterSelect';
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

/** 종류 select — 채점하는 종류만(ADHOC 제외). 라벨에 코드를 함께 둔다. */
const KIND_OPTIONS = KPI_KINDS.map((kind) => ({
  value: kind,
  label: `${KIND_LABEL[kind]} (${kind})`,
}));

/** IC 호라이즌 select — 5·20 은 가중치 학습, 60·180 은 IC 만 저장하는 모니터링 전용. */
const IC_HORIZON_OPTIONS = IC_HORIZONS.map((horizon) => ({
  value: String(horizon),
  label: `${horizon}일${isMonitoringHorizon(horizon) ? ' (모니터링)' : ''}`,
}));

/** 대응 비교 표의 세 행 — 사전 등록 판정은 트리거일 행이 기준이다. */
const PAIRED_ROWS: readonly { key: 'all' | 'triggered' | 'untriggered'; label: string }[] = [
  { key: 'triggered', label: '트리거일' },
  { key: 'untriggered', label: '비트리거일' },
  { key: 'all', label: '전체' },
];

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

/** 채점 호라이즌 select 옵션 — 결정 호라이즌이 첫째, DAILY·MORNING 만 진단 호라이즌(1·20)이 더 있다. */
function horizonOptionsOf(kind: KpiKind) {
  const decision = decisionHorizonOf(kind);
  return kpiHorizonsOf(kind).map((horizon) => ({
    value: String(horizon),
    label: `T+${horizon}${horizon === decision ? ' (결정)' : ' (진단)'}`,
  }));
}

/** 대응 차이 행이 유의한지 — 사전 등록 규칙(트리거일 t > 2 면 유지)과 같은 임계. */
function pairedTone(diff: PairedDiff): 'success' | 'danger' | 'neutral' {
  if (diff.t === null || !isSignificant(diff.t)) return 'neutral';
  return diff.t > 0 ? 'success' : 'danger';
}

/**
 * KPI 탭 — `GET /scores/summary`(variants·regime·calibration·recent·note) + `GET /scores/morning-vs-daily` + `GET /scores/ic` + LLM 사용량.
 * 전부 `DashboardWidget`(읽기 실패 토스트 금지·위젯 안 재시도). advisor 404 면 탭 전체가 빈 상태다.
 *
 * 선택은 URL 이 진실이다 — `?days=`(기간) · `?kind=`(종류, 기본 DAILY) · `?h=`(채점 호라이즌, 기본 = 종류의 결정 호라이즌) ·
 * `?icH=`(IC 호라이즌, 기본 5). 기본값은 URL 에서 지운다. 종류를 바꾸면 `h` 를 함께 지운다 — 진단 호라이즌은 종류마다 달라
 * 옛 값이 끌려오면 백엔드가 검증 없이 빈 표를 돌려준다(`lib/quant/advisorHorizon.ts`).
 * H60·H180 은 가중치를 학습하지 않는 호라이즌이라 백엔드가 `verdictLabel`("판정 불가…")을 실어 보낸다 — 변형 표 위에 그대로 띄운다.
 *
 * "누적 LIVE 픽 N / 300" 타일은 선택 기간이 아니라 **전체 기간**(`LIFETIME_FROM`~오늘)의 `scoreSummary` 를 따로 읽는다 —
 * 게이트가 보는 값이 전체 누적이기 때문이다. 화면 필터와 기준이 다르므로 hint 에 "전체 기준" 을 명기한다(StatTile 문서 규칙).
 */
export function KpiTab() {
  const [today] = useState(() => todayKst());
  const [daysParam, setDaysParam] = useSearchParamState('days');
  const [kindParam] = useSearchParamState('kind');
  const [horizonParam, setHorizonParam] = useSearchParamState('h');
  const [icHorizonParam, setIcHorizonParam] = useSearchParamState('icH');
  const patchParams = useSearchParamsPatch();
  const days = parseDays(daysParam);
  const from = addDays(today, -(days - 1));
  const kind = resolveKind(kindParam, KPI_KINDS, 'DAILY');
  const horizon = resolveKpiHorizon(kind, horizonParam);
  const effectiveHorizon = horizon ?? decisionHorizonOf(kind);
  const horizonOptions = horizonOptionsOf(kind);
  const icHorizon = resolveIcHorizon(icHorizonParam);
  // IC 창: h=5 는 기존대로 선택 기간, 그 밖은 백엔드 호라이즌 기본 창(20 은 480일) — 90일 창에서 h=60 이면 n_eff 가 1.5 라 무의미하다
  const icWindow = icHorizon === DAILY_HORIZON ? days : null;

  const summary = useScoreSummary(from, today, kind, horizon);
  // 전체 기간 — 키가 (from,to) 로 갈려 선택 기간 쿼리와 캐시가 섞이지 않는다(`quantKeys.all` 하위라 invalidate 는 함께 된다).
  // 게이트는 DAILY 만 세므로 종류 선택과 무관하게 DAILY 기본값으로 읽는다.
  const lifetime = useScoreSummary(LIFETIME_FROM, today);
  const morningVsDaily = useMorningVsDaily(from, today);
  const ic = useIcStats(today, icWindow, icHorizon);
  const usage = useUsageRuns();
  const scoredHint = `T+${effectiveHorizon} 청산 뒤 SCORE 가 돌면 채워집니다`;

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
        <FilterSelect
          id="kpi-days"
          label="기간"
          value={String(days)}
          options={PERIOD_OPTIONS}
          onValueChange={(value) => setDaysParam(value === String(DEFAULT_DAYS) ? null : value)}
        />
        <FilterSelect
          id="kpi-kind"
          label="판단 종류"
          value={kind}
          options={KIND_OPTIONS}
          // 종류를 바꾸면 채점 호라이즌을 결정 호라이즌으로 되돌린다(두 키를 한 번에 — 연달아 setter 를 부르면 하나가 사라진다)
          onValueChange={(value) =>
            patchParams({ kind: value === 'DAILY' ? null : value, h: null })
          }
        />
        {horizonOptions.length > 1 ? (
          <FilterSelect
            id="kpi-horizon"
            label="채점 호라이즌"
            value={String(effectiveHorizon)}
            options={horizonOptions}
            onValueChange={(value) =>
              setHorizonParam(value === String(decisionHorizonOf(kind)) ? null : value)
            }
          />
        ) : null}
        <FilterSelect
          id="kpi-ic-horizon"
          label="IC 호라이즌"
          value={String(icHorizon)}
          options={IC_HORIZON_OPTIONS}
          onValueChange={(value) =>
            setIcHorizonParam(value === String(DAILY_HORIZON) ? null : value)
          }
        />
        <p className="pb-2 text-dl-xs text-[color:var(--admin-text-faint)]">
          {from} ~ {today} · {KIND_LABEL[kind]} · 청산 h=T+{effectiveHorizon}
          {horizon !== null ? ' (진단)' : ''} · 잠정·확정 채점 포함
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
                hint: `기간을 늘리거나 ${KIND_LABEL[kind]} 판단 잡 실행을 확인하세요`,
              }
        }
        errorMessage="변형별 성과를 불러오지 못했습니다."
      >
        {(data) => {
          const response = data as ScoreSummaryResponse;
          // 판정 불가 라벨은 종류 단위라 변형마다 같다 — 하나만 띄운다
          const verdictLabel = response.variants.find(
            (variant) => variant.verdictLabel,
          )?.verdictLabel;
          return (
            <div className="flex flex-col gap-3">
              {verdictLabel ? (
                <InlineNotice tone="warning" title="판정 불가">
                  <span className="wrap-anywhere">
                    {verdictLabel} — {KIND_LABEL[kind]} 판단은 모니터링 전용이라 아래 수치로 성패를
                    판정하지 않습니다.
                  </span>
                </InlineNotice>
              ) : null}
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

      {/* ── 아침 재판정 대응 비교 (MORNING − DAILY) ── */}
      <DashboardWidget
        id="advisor-kpi-morning-vs-daily"
        title="아침 재판정 대응 비교"
        caption="MORNING − DAILY · 같은 기준일 LONG 픽 평균 초과의 날짜 단위 차이 · 사전 등록: 트리거일 t > 2 면 유지"
        query={morningVsDaily}
        isEmpty={(data) => isAdvisorDisabled(data) || data.all.n === 0}
        empty={
          isAdvisorDisabled(morningVsDaily.data)
            ? {
                message: '대응 비교를 조회할 수 없습니다',
                hint: 'advisor 비활성 또는 아침 재판정(M4) 이전 백엔드입니다',
              }
            : {
                message: '대응 쌍이 없습니다',
                hint: 'MORNING_ADVISE 가 돌고 아침·저녁 픽이 모두 채점돼야 채워집니다',
              }
        }
        errorMessage="대응 비교를 불러오지 못했습니다."
      >
        {(data) => {
          const response = data as MorningVsDailyResponse;
          return (
            <DashboardTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>구분</TableHeaderCell>
                  <TableHeaderCell className="text-right">기준일 수</TableHeaderCell>
                  <TableHeaderCell className="text-right">평균 차이 ± se</TableHeaderCell>
                  <TableHeaderCell className="text-right">t</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {PAIRED_ROWS.map(({ key, label }) => {
                  const diff = response[key];
                  const tone = pairedTone(diff);
                  return (
                    <TableRow key={key}>
                      <TableCell className="whitespace-nowrap">
                        {key === 'triggered' ? (
                          <Badge tone="warning" size="xs">
                            {label}
                          </Badge>
                        ) : (
                          label
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(diff.n)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums whitespace-nowrap ${SIGN_CLASS[signTone(diff.meanDiff)]}`}
                      >
                        {formatPctWithSe(diff.meanDiff, diff.seDiff)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${tone === 'neutral' ? 'text-dl-fg-muted' : `font-semibold ${SIGN_CLASS[tone]}`}`}
                      >
                        {formatSignedFixed(diff.t, 2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DashboardTable>
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
              : { message: '채점된 픽이 없습니다', hint: scoredHint }
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
              : { message: '채점된 픽이 없습니다', hint: scoredHint }
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
        caption={`asOf ${today} · h=${icHorizon}${isMonitoringHorizon(icHorizon) ? ' 모니터링(n_eff 작음)' : ''} · 창 ${icWindow === null ? '호라이즌 기본' : `${icWindow}일`} · |t| ≥ 2 강조`}
        query={ic}
        isEmpty={(data) => isAdvisorDisabled(data) || data.length === 0}
        empty={
          isAdvisorDisabled(ic.data)
            ? ADVISOR_DISABLED_EMPTY
            : {
                message: 'IC 관측이 없습니다',
                hint: `IC_BACKFILL(h=${icHorizon})을 먼저 실행하세요 — 수동 실행 탭에서 호라이즌을 지정할 수 있습니다`,
              }
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
