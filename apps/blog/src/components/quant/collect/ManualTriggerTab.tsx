'use client';

import {
  Badge,
  Button,
  DatePicker,
  Field,
  FormGrid,
  InlineNotice,
  Input,
  Select,
  type SelectOption,
  Switch,
  Textarea,
  useConfirm,
} from '@hvy/ui';
import { Eraser, Play } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useRunActions } from '@/components/quant/useRunActions';
import { useRecentCollectRuns } from '@/hooks/useQuant';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import {
  BACKFILL_QUEUE_CAPACITY,
  type BackfillFieldErrors,
  type BackfillFormValues,
  buildTriggerConfirmMessage,
  CHECKPOINT_MAX_ATTEMPTS,
  countOccupyingBackfillRuns,
  EMPTY_BACKFILL_FORM,
  forceEffectOf,
  MAX_TICKERS,
  parseCodeList,
  resolveCollectJobType,
  usesCheckpoint,
  validateBackfillForm,
} from '@/lib/quant/backfillValidation';
import { COLLECT_JOB_META, COLLECT_JOB_OPTIONS } from '@/lib/quant/jobCatalog';
import { QUANT_ROUTES, runHref } from '@/lib/quant/routes';
import { describeBackfillRequest } from '@/lib/quant/stepRetry';
import type { CollectJobType } from '@/types/quant';

/** 잡 select 옵션 — 검색 필드 옵션과 같은 라벨("desc (CODE)"), 값만 문자열로 고정한다. */
const JOB_OPTIONS: readonly SelectOption[] = COLLECT_JOB_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

/** 모든 잡에 해당하는 런북 안내(3번). */
const COMMON_HINTS: readonly string[] = [
  `런북 3 · 체크포인트 FAILED ${CHECKPOINT_MAX_ATTEMPTS}회 초과 종목은 재개 대상에서 빠집니다 — "체크포인트 초기화"를 켜고 같은 잡을 실행하면 처음부터 다시 받습니다.`,
];

/**
 * 잡별 런북 안내 — `claudedocs/stock-collect.md` 운영 런북 17항목 중 이 탭이 대체하는 것(2·8·9·14)과
 * 잘못 누르면 수 시간짜리 전체 백필이 도는 함정(PRICE/INDEX_BACKFILL, BACKFILL_ALL).
 */
const JOB_HINTS: Partial<Record<CollectJobType, readonly string[]>> = {
  RELOAD: [
    '런북 2 · 특정 종목 다시 받기 — 종목 목록이 필수이고, 시작일로 다시 받을 기간을 지정합니다(2일 이상 결손). 삭제 없이 upsert 로 덮어씁니다.',
  ],
  FINANCIAL_BACKFILL: [
    '런북 14 · 재무 확장 컬럼 채우기 — "체크포인트 초기화"를 켜고 실행해야 이미 DONE 인 종목도 다시 받습니다.',
  ],
  ETF_NAV_BACKFILL: [
    '런북 8 · ETF NAV overflow 대응 — psql 마이그레이션을 먼저 적용한 뒤 이 잡을 재트리거합니다.',
  ],
  CORP_ACTION: [
    '런북 9 · 예탁원 응답 잘림 대응 — psql 마이그레이션 뒤 CORP_ACTION → ADJUST_FACTOR 순서로 실행합니다.',
  ],
  ADJUST_FACTOR: ['런북 9 · CORP_ACTION 이 끝난 뒤에 실행합니다(기업행사 → 수정계수 순서).'],
  PRICE_BACKFILL: [
    'DAILY 단계 결손 복구용이 아닙니다 — 체크포인트 기반 전체 백필(수 시간)입니다. PRICE 결손은 다음 DAILY 가 자동 복구하고, 2일 이상 결손만 RELOAD 로 채웁니다.',
  ],
  INDEX_BACKFILL: [
    'DAILY 의 INDEX 단계 복구용이 아닙니다 — 체크포인트가 DONE 이면 무동작, 아니면 장시간 전체 백필입니다.',
  ],
  BACKFILL_ALL: [
    '하위 잡 run 이 순차로 생성됩니다. 상위 run 을 취소하면 하위도 종목 경계에서 멈춥니다.',
  ],
  DAILY: [
    '스케줄러(평일 18:30)와 같은 잡입니다 — 오늘(KST) 기준 증분이라 어제 실패분을 지정 날짜로 되돌리지는 못합니다.',
  ],
};

/**
 * 수동 실행 탭 — 잡 select + `BackfillRequest` 폼 → 프론트 검증(백엔드 400 규칙 복제) → `useConfirm`(그리드 밖) →
 * `useRunActions.triggerStock`(토스트·409·invalidate 내장). 선택한 잡은 `?job=` 에 둔다(런북·상세 다이얼로그 딥링크).
 *
 * 성공 뒤 값은 남긴다 — 운영 절차(ETF_NAV → CORP_ACTION → ADJUST_FACTOR)가 같은 인자로 다음 잡을 연달아 부르기
 * 때문이다. 단 `resetCheckpoint`·`force` 만 끈다 — 위험 옵션이 다음 실행에 조용히 따라가면 안 된다.
 */
export function ManualTriggerTab() {
  const [jobParam, setJobParam] = useSearchParamState('job');
  const jobType = resolveCollectJobType(jobParam);
  const [values, setValues] = useState<BackfillFormValues>(EMPTY_BACKFILL_FORM);
  const [errors, setErrors] = useState<BackfillFieldErrors>({});
  const askConfirm = useConfirm();
  const actions = useRunActions();
  const recentRuns = useRecentCollectRuns();

  // 실행기 점유 — 실행 1 + 대기 n. 대기 중인 run 도 RUNNING 으로 보이므로 하나만 찾지 않고 전부 센다.
  const occupancy = useMemo(() => countOccupyingBackfillRuns(recentRuns.data), [recentRuns.data]);
  const meta = jobType ? COLLECT_JOB_META[jobType] : null;
  const busy = jobType ? actions.isBusy(`trigger:STOCK:${jobType}`) : false;
  const tickerCount = useMemo(() => parseCodeList(values.tickers).length, [values.tickers]);
  // 미리보기 — 검증을 통과했을 때만 요약을 보여준다(실패 상태의 요약은 오독을 낳는다).
  const preview = useMemo(
    () => (jobType ? validateBackfillForm(values, jobType) : null),
    [values, jobType],
  );

  /** 필드 하나를 바꾸면 그 칸의 오류만 지운다(v3 §ds-05 — 다른 칸 오류는 남긴다). */
  const update = useCallback(
    <K extends keyof BackfillFormValues>(key: K, value: BackfillFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    [],
  );

  const resetForm = () => {
    setValues(EMPTY_BACKFILL_FORM);
    setErrors({});
  };

  const submit = async () => {
    if (!jobType) return;
    const result = validateBackfillForm(values, jobType);
    if (result.ok === false) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    const dangerous = result.request.resetCheckpoint === true || result.request.force === true;
    const ok = await askConfirm({
      message: buildTriggerConfirmMessage({ jobType, request: result.request, occupancy }),
      confirmLabel: dangerous ? '위험 옵션 포함 실행' : '실행',
      destructive: dangerous,
    });
    if (!ok) return;
    const outcome = await actions.triggerStock(jobType, result.request);
    if (outcome?.ok) {
      setValues((prev) => ({ ...prev, resetCheckpoint: false, force: false }));
    }
  };

  const hints = jobType ? [...(JOB_HINTS[jobType] ?? []), ...COMMON_HINTS] : [];
  const forceEffect = jobType ? forceEffectOf(jobType) : null;

  return (
    <div className="admin-panel admin-panel-pad flex min-h-0 flex-col gap-4 overflow-y-auto">
      {/* ── 대기열 선고지 — 실행기 점유 run 이 있을 때만(동적 삽입이라 live). "실행 1 · 대기 n/10" 을 말한다 ── */}
      {occupancy.executing ? (
        <InlineNotice
          tone={occupancy.queued >= BACKFILL_QUEUE_CAPACITY ? 'error' : 'warning'}
          live
          title={`백필 실행기 사용 중 — 실행 1 · 대기 ${occupancy.queued}/${BACKFILL_QUEUE_CAPACITY}`}
          action={
            <Link
              href={runHref('STOCK', occupancy.executing.runId)}
              className="text-dl-sm font-semibold text-dl-warning-ink hover:underline"
            >
              열기
            </Link>
          }
        >
          <span className="wrap-anywhere">
            실행 중: {occupancy.executing.jobDescription} run #{occupancy.executing.runId}.{' '}
            {occupancy.queued >= BACKFILL_QUEUE_CAPACITY
              ? '대기열이 가득 차 지금 실행하면 400 으로 거절되고 run 은 FAILED 로 남습니다.'
              : `지금 실행하면 대기열 ${occupancy.queued + 1}번째로 들어갑니다(동시 1개 직렬).`}
          </span>
        </InlineNotice>
      ) : null}

      {/* ── 잡 선택 ── */}
      <section className="flex flex-col gap-2">
        <Field
          htmlFor="mt-job"
          label="잡"
          size="sm"
          required
          help="이름 또는 잡 코드로 검색 — Slack 알림·런북은 코드로 표기됩니다"
        >
          <div className="w-full sm:max-w-md">
            <Select
              id="mt-job"
              value={jobType ?? ''}
              onValueChange={(value) => setJobParam(value)}
              options={JOB_OPTIONS}
              placeholder="실행할 잡 선택"
              searchPlaceholder="잡 이름·코드 검색"
            />
          </div>
        </Field>
        {meta && jobType ? (
          <div className="flex flex-wrap items-center gap-2 text-dl-xs text-[color:var(--admin-text-muted)]">
            <Badge tone={meta.longRunning ? 'primary' : 'neutral'} size="xs">
              {meta.longRunning ? '백그라운드 (202)' : '동기 (200)'}
            </Badge>
            {meta.durationHint ? <span>예상 소요 {meta.durationHint}</span> : null}
            {meta.longRunning ? <span>백필 실행기 직렬 · 대기열 10</span> : null}
            {usesCheckpoint(jobType) ? (
              <Link
                href={`${QUANT_ROUTES.collect}?tab=checkpoints&cpJob=${jobType}`}
                className="text-dl-primary-ink hover:underline"
              >
                체크포인트 보기
              </Link>
            ) : null}
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

      {/* ── BackfillRequest 폼 — 전부 선택. 잡마다 해석이 다르다(help 문구는 백엔드 Javadoc). ── */}
      <FormGrid>
        <Field
          htmlFor="mt-start"
          label="시작일"
          size="sm"
          error={errors.startDate}
          help="백필 목표 시작일 · 비우면 kis.backfill.start-date"
        >
          <DatePicker
            id="mt-start"
            value={values.startDate}
            onValueChange={(value) => update('startDate', value)}
            max={values.endDate || undefined}
            clearable
          />
        </Field>
        <Field
          htmlFor="mt-end"
          label="종료일"
          size="sm"
          error={errors.endDate}
          help="커서 시작일(가장 최근 일자) · 비우면 오늘"
        >
          <DatePicker
            id="mt-end"
            value={values.endDate}
            onValueChange={(value) => update('endDate', value)}
            min={values.startDate || undefined}
            clearable
          />
        </Field>
        <Field
          htmlFor="mt-ticker-from"
          label="종목 범위 시작"
          size="sm"
          error={errors.tickerFrom}
          help="포함 · 900종목씩 나눠 돌릴 때"
        >
          <Input
            id="mt-ticker-from"
            value={values.tickerFrom}
            onChange={(event) => update('tickerFrom', event.target.value)}
            placeholder="000020"
            maxLength={6}
            autoCapitalize="characters"
            spellCheck={false}
            clearable
            onClear={() => update('tickerFrom', '')}
          />
        </Field>
        <Field
          htmlFor="mt-ticker-to"
          label="종목 범위 끝"
          size="sm"
          error={errors.tickerTo}
          help="포함 · 종목 목록이 있으면 범위는 무시"
        >
          <Input
            id="mt-ticker-to"
            value={values.tickerTo}
            onChange={(event) => update('tickerTo', event.target.value)}
            placeholder="099999"
            maxLength={6}
            autoCapitalize="characters"
            spellCheck={false}
            clearable
            onClear={() => update('tickerTo', '')}
          />
        </Field>
        <Field
          htmlFor="mt-index"
          label="지수코드"
          size="sm"
          error={errors.indexCodes}
          help="4자 숫자 · 쉼표·공백 구분 · 비우면 지수 마스터 전체"
        >
          <Input
            id="mt-index"
            value={values.indexCodes}
            onChange={(event) => update('indexCodes', event.target.value)}
            placeholder="0001, 1001"
            spellCheck={false}
            clearable
            onClear={() => update('indexCodes', '')}
          />
        </Field>
        <Field
          htmlFor="mt-tickers"
          label={
            tickerCount > 0 ? `종목 목록 · ${tickerCount.toLocaleString('ko-KR')}개` : '종목 목록'
          }
          size="sm"
          required={jobType === 'RELOAD'}
          error={errors.tickers}
          help={`줄·쉼표·공백 구분 · 6자 영숫자 · 최대 ${MAX_TICKERS.toLocaleString('ko-KR')}개 · 있으면 범위 무시${jobType === 'RELOAD' ? ' · RELOAD 는 필수' : ''}`}
          className="col-span-full"
        >
          <Textarea
            id="mt-tickers"
            value={values.tickers}
            onChange={(event) => update('tickers', event.target.value)}
            placeholder={'005930\n000660, 035420'}
            rows={4}
            autosize
            spellCheck={false}
          />
        </Field>
      </FormGrid>

      {/* ── 위험 옵션 — 켜면 confirm 이 destructive 로 바뀐다 ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
        <SwitchRow
          id="mt-reset"
          label="체크포인트 초기화"
          checked={values.resetCheckpoint}
          onChange={(checked) => update('resetCheckpoint', checked)}
          help={
            <>
              처음부터 다시 받습니다 — attemptCount {CHECKPOINT_MAX_ATTEMPTS} 이상으로 제외된 종목도
              포함 (런북 3·14)
              {jobType && !usesCheckpoint(jobType) ? ' · 이 잡은 체크포인트를 쓰지 않습니다' : ''}
            </>
          }
        />
        <SwitchRow
          id="mt-force"
          label="force"
          checked={values.force}
          onChange={(checked) => update('force', checked)}
          help={
            forceEffect ??
            (jobType
              ? '이 잡은 force 를 읽지 않습니다 — DAILY(휴장일 스킵 해제)·DERIVED_REFRESH(전체 재계산) 전용'
              : 'DAILY: 휴장일 스킵 해제 · DERIVED_REFRESH: 지표 전체 재계산')
          }
        />
      </div>

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
        <Button variant="outline-gray" size="sm" icon={Eraser} onClick={resetForm}>
          입력 초기화
        </Button>
        {preview?.ok ? (
          <span className="text-dl-xs text-[color:var(--admin-text-muted)] wrap-anywhere">
            요약: {describeBackfillRequest(preview.request)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 스위치 한 줄 — 표시 문구·스위치·설명. `Field` 를 쓰지 않는 이유: 스위치는 라벨이 왼쪽에 나란히 서야
 * 위험 옵션 두 개가 한 눈에 비교되고, 설명이 컨트롤 아래가 아니라 라벨 아래에 붙어야 폭이 좁을 때 읽힌다.
 *
 * 접근성 이름은 `Switch.label`(aria-label) 하나다 — 옆의 표시 문구를 `<label htmlFor>` 로도 묶으면
 * 스위치가 이름을 두 번 갖는다(aria-label 이 이기지만 접근성 트리에 라벨 관계가 남는다). 표시 문구는 눌러도 토글되지
 * 않는 대신 `aria-hidden` 으로 중복 낭독을 막고, 설명은 `aria-describedby` 로 스위치에 붙인다.
 */
function SwitchRow({
  id,
  label,
  checked,
  onChange,
  help,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  help: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span
          aria-hidden
          className={`text-dl-sm font-semibold ${checked ? 'text-dl-danger-ink' : 'text-dl-fg'}`}
        >
          {label}
        </span>
        <span className="flex" aria-describedby={`${id}-help`}>
          <Switch id={id} label={label} size="sm" checked={checked} onCheckedChange={onChange} />
        </span>
      </div>
      <p
        id={`${id}-help`}
        className="m-0 text-dl-xs text-[color:var(--admin-text-muted)] wrap-anywhere"
      >
        {help}
      </p>
    </div>
  );
}
