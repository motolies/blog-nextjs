'use client';

import {
  Badge,
  Button,
  DatePicker,
  Field,
  FormGrid,
  InlineNotice,
  Select,
  type SelectOption,
  useConfirm,
} from '@hvy/ui';
import { Eraser, Play } from 'lucide-react';
import { useState } from 'react';
import { adviseConfirmMessage } from '@/components/quant/overview/GateWidget';
import { useRunActions } from '@/components/quant/useRunActions';
import { isAdvisorDisabled, useGate } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { isMonitoringHorizon } from '@/lib/quant/advisorHorizon';
import {
  ADVISOR_JOB_META,
  ADVISOR_MANUAL_JOB_TYPES,
  type AdvisorManualJobType,
  resolveAdvisorManualJob,
} from '@/lib/quant/jobCatalog';
import { todayKst } from '@/lib/quant/kstDate';
import { type AdvisorTriggerArgs, describeAdvisorTriggerArgs } from '@/lib/quant/stepRetry';
import { IC_HORIZONS } from '@/types/quant';

/** 잡 select 옵션 — 실행 이력 검색과 같은 라벨("desc (CODE)"). Slack·런북은 코드로 말한다. */
const JOB_OPTIONS: readonly SelectOption[] = ADVISOR_MANUAL_JOB_TYPES.map((jobType) => ({
  value: jobType,
  label: `${ADVISOR_JOB_META[jobType].desc} (${jobType})`,
}));

/** IC 백필 호라이즌 — 비우면(clearable) 파라미터를 생략해 학습 호라이즌 전부를 백필한다. */
const HORIZON_OPTIONS: readonly SelectOption[] = IC_HORIZONS.map((horizon) => ({
  value: String(horizon),
  label: `${horizon}일${isMonitoringHorizon(horizon) ? ' (모니터링)' : ''}`,
}));

/**
 * 잡별 운영 안내 — 전부 백엔드 Javadoc·설정 주석에서 옮긴 사실이다(추측 문구 금지: 운영자가 이 문장을 믿고 누른다).
 */
const JOB_HINTS: Partial<Record<AdvisorManualJobType, readonly string[]>> = {
  ADVISE: [
    '이미 LIVE 판단이 있는 기준일은 SKIPPED 로 닫힙니다 — 재판단은 판단 이력에서 판단을 삭제한 뒤에 합니다.',
  ],
  MORNING_ADVISE: [
    '전일 저녁 LIVE 판단을 밤사이 정보로 다시 봅니다(유지·추가·제외). 발행 마감(기본 08:50 KST) 이후 실행은 SKIPPED 입니다 — 개장 후 발행은 D+1 시가 진입과 모순됩니다.',
  ],
  ADVISE_H20: ['뉴스·메모리 없이 H20 가중치 세트로만 돕니다(스케줄: 금요일 20:10).'],
  ADVISE_H60: [
    '주기(짝수 ISO 주 금요일)는 스케줄러만 판정합니다 — 수동 실행은 주기와 무관하게 돕니다. 장기 팩터 규칙이 픽을 정하고 LLM 은 서술만 합니다.',
  ],
  ADVISE_H180: [
    '주기(매월 첫 거래일)는 스케줄러만 판정합니다 — 수동 실행은 주기와 무관하게 돕니다. 장기 팩터 규칙이 픽을 정하고 LLM 은 서술만 합니다.',
  ],
  IC_BACKFILL: [
    '호라이즌을 지정하면 그 호라이즌 하나만 백필합니다 — 비우면 학습 호라이즌 전부입니다.',
    '기준일을 붙이면 시작일 결정이 달라집니다 — 스케줄 실행과 같은 백필은 기준일을 비워 두세요.',
  ],
};

/** 폼 값 — 잡을 바꿔도 남긴다(같은 기준일로 여러 잡을 연달아 부르는 보충 절차). horizon '' 은 생략. */
type FormValues = { baseDate: string; horizon: string };
const EMPTY_FORM: FormValues = { baseDate: '', horizon: '' };

/**
 * AI 판단 수동 실행 탭 — 잡 select(`?job=`) + 기준일 + (IC_BACKFILL 만) 호라이즌 → `useConfirm`(다이얼로그 밖) →
 * `useRunActions.triggerAdvisor`(토스트·409·invalidate 내장).
 *
 * 대상은 백엔드 `SchedulerCatalog` 의 advisor 잡 8개 + IC_BACKFILL 이다(`ADVISOR_MANUAL_JOB_TYPES`). 스케줄러 위젯(운영 현황)이
 * "지금 실행" 을 맡는다면 이 탭은 **인자가 필요한 실행**(과거 기준일 보충·호라이즌 지정 IC 백필)을 맡는다.
 * ADVISE 를 오늘 기준으로 부를 때만 게이트 사유를 confirm 에 싣는다(스케줄러 위젯과 같은 문구 — 과거 기준일은 오늘 게이트와 무관하다).
 */
export function AdvisorTriggerTab() {
  const [today] = useState(() => todayKst());
  const [jobParam, setJobParam] = useSearchParamState('job');
  const jobType = resolveAdvisorManualJob(jobParam);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const askConfirm = useConfirm();
  const actions = useRunActions();
  const gate = useGate(today);

  const meta = jobType ? ADVISOR_JOB_META[jobType] : null;
  const busy = jobType ? actions.isBusy(`trigger:ADVISOR:${jobType}`) : false;
  const hints = jobType ? (JOB_HINTS[jobType] ?? []) : [];

  /** 폼 값 → 트리거 인자. horizon 은 IC_BACKFILL 에만 싣는다(다른 잡에 주면 백엔드 400). */
  const argsOf = (job: AdvisorManualJobType): AdvisorTriggerArgs => {
    const args: AdvisorTriggerArgs = {};
    if (values.baseDate) args.baseDate = values.baseDate;
    if (job === 'IC_BACKFILL' && values.horizon) args.horizon = Number(values.horizon);
    return args;
  };

  /** 실행 — confirm 뒤 트리거. 값은 남긴다(다음 잡을 같은 기준일로 부르는 절차). */
  const submit = async () => {
    if (!jobType) return;
    const args = argsOf(jobType);
    const currentGate = gate.data && !isAdvisorDisabled(gate.data) ? gate.data : null;
    const message =
      jobType === 'ADVISE' && !args.baseDate
        ? adviseConfirmMessage(currentGate)
        : `${ADVISOR_JOB_META[jobType].desc}(${jobType}) 을 실행합니다 — ${describeAdvisorTriggerArgs(args)}.`;
    const ok = await askConfirm({ message, confirmLabel: '실행' });
    if (!ok) return;
    await actions.triggerAdvisor(jobType, args);
  };

  return (
    <div className="admin-panel admin-panel-pad flex min-h-0 flex-col gap-4 overflow-y-auto">
      {/* ── 잡 선택 ── */}
      <section className="flex flex-col gap-2">
        <Field
          htmlFor="at-job"
          label="잡"
          size="sm"
          required
          help="스케줄러 카탈로그의 판단 잡 + IC 백필 · 채팅 전용 수시 판단(ADVISE_ADHOC)은 없습니다"
        >
          <div className="w-full sm:max-w-md">
            <Select
              id="at-job"
              value={jobType ?? ''}
              onValueChange={(value) => setJobParam(value)}
              options={JOB_OPTIONS}
              placeholder="실행할 잡 선택"
            />
          </div>
        </Field>
        {meta ? (
          <div className="flex flex-wrap items-center gap-2 text-dl-xs text-[color:var(--admin-text-muted)]">
            <Badge tone={meta.longRunning ? 'primary' : 'neutral'} size="xs">
              {meta.longRunning ? '백그라운드 (202)' : '동기 (200)'}
            </Badge>
            <span>같은 잡이 실행 중이면 409 로 거절됩니다</span>
          </div>
        ) : null}
        {hints.length > 0 ? (
          <InlineNotice tone="muted" title="운영 안내">
            <ul className="m-0 flex list-disc flex-col gap-1 pl-4">
              {hints.map((hint) => (
                <li key={hint} className="wrap-anywhere">
                  {hint}
                </li>
              ))}
            </ul>
          </InlineNotice>
        ) : null}
      </section>

      {/* ── 인자 — 전부 선택 ── */}
      <FormGrid>
        <Field
          htmlFor="at-base-date"
          label="기준일"
          size="sm"
          help="비우면 오늘(KST) 기준 — 스케줄 실행과 같은 의미 · 과거 날짜는 보충 실행"
        >
          <DatePicker
            id="at-base-date"
            value={values.baseDate}
            onValueChange={(value) => setValues((prev) => ({ ...prev, baseDate: value }))}
            max={today}
            clearable
          />
        </Field>
        {jobType === 'IC_BACKFILL' ? (
          <Field
            htmlFor="at-horizon"
            label="호라이즌"
            size="sm"
            help="IC 대상 5·20·60·180 · 비우면 학습 호라이즌 전부"
          >
            <Select
              id="at-horizon"
              value={values.horizon}
              onValueChange={(value) => setValues((prev) => ({ ...prev, horizon: value }))}
              options={HORIZON_OPTIONS}
              placeholder="전체(학습 호라이즌)"
              clearable
              clearLabel="호라이즌 지우기"
            />
          </Field>
        ) : null}
      </FormGrid>

      {/* ── 실행 ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          busy={busy}
          disabled={jobType === null}
          title={jobType === null ? '실행할 잡을 먼저 선택하세요' : undefined}
          onClick={submit}
        >
          실행
        </Button>
        <Button
          variant="outline-gray"
          size="sm"
          icon={Eraser}
          onClick={() => setValues(EMPTY_FORM)}
        >
          입력 초기화
        </Button>
        {jobType ? (
          <span className="text-dl-xs text-[color:var(--admin-text-muted)] wrap-anywhere">
            요약: {describeAdvisorTriggerArgs(argsOf(jobType))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
