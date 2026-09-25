/**
 * 주식 수집(stock)·AI 어드바이저(advisor) 관리자 API 응답 타입 — 백엔드 DTO/enum 과 1:1 대응.
 *
 * 정본: `hvy-blog/src/main/java/kr/hvy/blog/modules/stock/**`, `modules/advisor/**`.
 * enum 은 전부 `code == 상수명` 규약이라 REST 경로 변수·필터 파라미터에 그대로 쓴다.
 *
 * ⚠️ 두 저장소가 분리돼 백엔드 enum 과 대조하는 테스트를 둘 수 없다 — 잡 유형을 추가하면
 *    백엔드 enum 과 `lib/quant/jobCatalog.ts` 두 곳을 함께 고친다.
 *
 * `interface` 가 아니라 `type` 별칭인 이유: `DataGrid<T extends Record<string, unknown>>` 제약은
 * 암묵적 인덱스 시그니처를 가진 객체 타입 리터럴만 통과시킨다. interface 로 두면 그리드마다
 * `Record<string, unknown>` 캐스팅이 필요해진다.
 */

// ── 공통 ──────────────────────────────────────────────────────────────────

/** 관리 API 모듈 — `ManualTrigger.module` 과 같은 값. 베이스 경로를 고르는 키다. */
export type RunModule = 'STOCK' | 'ADVISOR';

/** run 트리거 출처 (stock `TriggerType` · advisor `AdvisorTriggerType` 동형). CHAT 은 advisor 전용(채팅 봇 requestAdvice). */
export type TriggerType = 'SCHEDULER' | 'API' | 'CHAT';

/**
 * 파이프라인 run 이 `metadata.steps[]` 에 남기는 단계 1개 (`PipelineSteps`).
 * BACKFILL_ALL 은 다른 모양(`{step, runId, status: CollectStatus, rows, apiCalls, apiFails, ms}`)이라
 * `status` 를 넓게 둔다 — 표시 톤은 `lib/quant/steps.ts` 가 두 모양을 함께 처리한다.
 */
export type RunStep = {
  step: string;
  status: RunStepStatus | string;
  ms?: number | null;
  processed?: number | null;
  failures?: number | null;
  reason?: string | null;
  /** BACKFILL_ALL 하위 run 전용 */
  runId?: number | null;
  rows?: number | null;
  apiCalls?: number | null;
  apiFails?: number | null;
};

export type RunStepStatus = 'OK' | 'FAILED' | 'CANCELED' | 'SKIPPED';

// ── stock (/api/stock/admin/collect) ──────────────────────────────────────

export const COLLECT_JOB_TYPES = [
  'BACKFILL_ALL',
  'MASTER',
  'HOLIDAY',
  'INDEX_BACKFILL',
  'PRICE_BACKFILL',
  'STOCK_INFO',
  'VALUATION',
  'MARKET_STAT',
  'CORP_ACTION',
  'ADJUST_FACTOR',
  'INVESTOR_BACKFILL',
  'FINANCIAL_BACKFILL',
  'OVERSEAS_BACKFILL',
  'ETF_NAV_BACKFILL',
  'MARKET_INVESTOR_BACKFILL',
  'DERIVED_REFRESH',
  'VALIDATE',
  'DAILY',
  'WEEKLY',
  'OVERSEAS_DAILY',
  'MACRO',
  'NEWS',
  'RELOAD',
] as const;
export type CollectJobType = (typeof COLLECT_JOB_TYPES)[number];

export const COLLECT_STATUSES = ['RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'CANCELED'] as const;
export type CollectStatus = (typeof COLLECT_STATUSES)[number];

export const CHECKPOINT_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'DONE',
  'EXHAUSTED',
  'FAILED',
  'PAUSED',
] as const;
export type CheckpointStatus = (typeof CHECKPOINT_STATUSES)[number];

/** `CollectRunResponse` — `metadata` 는 잡마다 모양이 다르다(파이프라인은 `steps[]`, 백필은 요청 요약). */
export type CollectRunResponse = {
  runId: number;
  jobType: CollectJobType;
  jobDescription: string;
  triggerType: TriggerType;
  targetDate: string | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  status: CollectStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  rowsUpserted: number;
  apiCallCount: number;
  apiFailCount: number;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
};

export type CollectCheckpointResponse = {
  jobType: string;
  targetKey: string;
  cursorDate: string | null;
  earliestLoaded: string | null;
  latestLoaded: string | null;
  status: CheckpointStatus;
  attemptCount: number;
  lastRunId: number | null;
  errorMessage: string | null;
  updatedAt: string;
};

/** `KisTokenStatus` — 토큰 값은 노출하지 않는다. */
export type KisTokenStatus = {
  configured: boolean;
  present: boolean;
  issuedAt: string | null;
  expiresAt: string | null;
  remainingMinutes: number | null;
};

/**
 * 수집 잡 트리거 요청 — 전부 선택. 잡 유형마다 해석이 다르다(백엔드 Javadoc 참조).
 * 검증 규칙(6자 영숫자·4자 숫자·최대 5000·start≤end)은 M3 의 `lib/quant/backfillValidation.ts` 가 복제한다.
 */
export type BackfillRequest = {
  startDate?: string;
  endDate?: string;
  tickerFrom?: string;
  tickerTo?: string;
  tickers?: string[];
  indexCodes?: string[];
  resetCheckpoint?: boolean;
  force?: boolean;
};

/** `GET /runs` 필터 — M1 에서 status·from·to(startedAt 기준, ISO date) 가 추가됐다. */
export type RunFilter<J extends string, S extends string> = {
  jobType?: J;
  status?: S;
  from?: string;
  to?: string;
  limit?: number;
};

// ── advisor (/api/advisor/admin) ──────────────────────────────────────────

export const ADVISOR_JOB_TYPES = [
  'ADVISE',
  'SCORE',
  'INTRADAY',
  'MORNING_CHECK',
  'MORNING_ADVISE',
  'WEEKLY_REVIEW',
  'IC_BACKFILL',
  'ADVISE_ADHOC',
  'ADVISE_H20',
  'ADVISE_H60',
  'ADVISE_H180',
] as const;
export type AdvisorJobType = (typeof ADVISOR_JOB_TYPES)[number];

/**
 * 판단 종류 (`AdviceKind`, tb_advisor_advice.advice_kind). 같은 (baseDate, variant) 에 종류별로 한 행씩 공존한다 —
 * 조회·KPI 는 종류를 명시해야 한다(백엔드 기본값 DAILY).
 */
export const ADVICE_KINDS = ['DAILY', 'MORNING', 'H20', 'H60', 'H180', 'ADHOC'] as const;
export type AdviceKind = (typeof ADVICE_KINDS)[number];

/** 가중치 학습·IC 저장 호라이즌 (`advisor.horizons` 키). 60·180 은 learn=false 모니터링 전용. */
export const IC_HORIZONS = [5, 20, 60, 180] as const;
export type IcHorizon = (typeof IC_HORIZONS)[number];

export const ADVISOR_STATUSES = [
  'RUNNING',
  'SUCCESS',
  'PARTIAL',
  'FAILED',
  'SKIPPED',
  'CANCELED',
] as const;
export type AdvisorStatus = (typeof ADVISOR_STATUSES)[number];

export const ADVICE_VARIANTS = [
  'LIVE',
  'QUANT_TOPN',
  'LLM_NOMEM',
  'LLM_NONEWS',
  'QUANT_TOPN_BROAD',
] as const;
export type AdviceVariant = (typeof ADVICE_VARIANTS)[number];

export type DataQuality = 'OK' | 'DEGRADED';
export type MarketRegimeCode = 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';
export type DirectionCall = 'UP' | 'NEUTRAL' | 'DOWN';
export type MarketTrendCode = 'BULL' | 'SIDEWAYS' | 'BEAR';
export type PickDirection = 'LONG' | 'AVOID';
export type ScoreStage = 'PROVISIONAL' | 'CONFIRMED';
export type ScoreStatus = 'SCORED' | 'MISSING' | 'SUSPENDED' | 'DELISTED';
export type CallSubject = 'INDEX' | 'SECTOR' | 'TREND' | 'TREND_INV' | 'MORNING';
export type IntradayVerdict = 'ON_TRACK' | 'MIXED' | 'OFF_TRACK';
export type MorningVerdict = 'REINFORCE' | 'HOLD' | 'CAUTION';
export type LessonStatus = 'CANDIDATE' | 'ACTIVE' | 'RETIRED';
export type LessonScope = 'SIGNAL' | 'REGIME' | 'SECTOR' | 'CALIBRATION';
export type WeightSetSource = 'SEED' | 'BACKFILL' | 'WEEKLY' | 'MANUAL';
/** 아침 재판정(MORNING)이 저녁 픽에 내린 조치 (`PickAction`). */
export type PickAction = 'KEEP' | 'ADD' | 'DROP';
/** 합성 국면의 변동성 축 (`VolRegimeCode`) — σ20 백분위. 이력 부족이면 UNKNOWN. */
export type VolRegimeCode = 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';
export type ThemeStrength = 'STRONG' | 'NEUTRAL' | 'WEAK';

/**
 * `AdvisorRunResponse`. `metadata.requested` (boolean) 는 baseDate 를 명시해 부른 run 인지 — 재실행 인자 복원의 근거
 * (`lib/quant/stepRetry.ts#advisorRerunArgs`). `costUsd` 는 단가(`advisor.cost.*`)가 0 이면 항상 0 이다.
 */
export type AdvisorRunResponse = {
  runId: number;
  jobType: AdvisorJobType;
  jobDescription: string;
  triggerType: TriggerType;
  status: AdvisorStatus;
  baseDate: string | null;
  model: string | null;
  promptVersion: string | null;
  llmCalls: number;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  costUsd: number | string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
};

export type SectorCall = { code: string; name: string; reason: string };

export type MarketTrend = {
  indexCode: string;
  tradeDate: string;
  code: MarketTrendCode;
  rawCode: MarketTrendCode;
  score: number;
  components: Record<string, number>;
  since: string | null;
  days: number;
  close: number | null;
  ma20: number | null;
  ma60: number | null;
  ma120: number | null;
  breadth: number | null;
  base: Record<string, unknown> | null;
};

export type TrendOutlook = {
  indexCode: string;
  persist: string;
  confidence: number;
  invalidation: string;
};

/** 정책 표 한도 (`MarketRegime.Policy`) — 수치를 바꾸면 version 이 오른다. */
export type RegimePolicy = {
  version: string;
  longMax: number;
  convictionCap: number | null;
  avoidMax: number;
};

/** 테마(KOSPI200 섹터 대분류) 강약 (`MarketRegime.Theme`). rs·breadth 는 소수 비율. */
export type RegimeTheme = {
  code: string;
  members: number;
  rs5: number | null;
  rs20: number | null;
  rs60: number | null;
  breadth: number | null;
  strength: ThemeStrength;
  leaders: string[] | null;
};

/**
 * 합성 국면 스냅샷 (`MarketRegime`, DB `regime_json` → JSON 키 `regime`). 추세 × 변동성 → 정책 표 한도.
 * DAILY·ADHOC LIVE 와 LLM 섀도에만 저장되고 MORNING 은 저녁 값을 읽기만 해 null, M6 이전 행도 null.
 */
export type MarketRegime = {
  indexCode: string;
  tradeDate: string | null;
  trend: MarketTrendCode | null;
  trendScore: number | null;
  vol: VolRegimeCode | null;
  volPct: number | null;
  sigma20: number | null;
  volHistoryDays: number | null;
  policy: RegimePolicy | null;
  themes: RegimeTheme[] | null;
};

/** 아침 재판정 조치 1건 (`diff_json.keep|add|drop[]`). drop 에만 저녁 픽의 방향·확신이 붙는다. */
export type MorningDiffAction = {
  ticker: string;
  reason: string | null;
  direction?: PickDirection | null;
  conviction?: number | null;
};

/** 밤사이 트리거 플래그 (`diff_json.triggers`) — LLM 호출 여부가 아니라 사후 분석(트리거일 KPI)용 기록이다. */
export type MorningTriggers = {
  gap: boolean;
  gapIndexes: string[];
  sector: boolean;
  sectorSymbols: string[];
  caution: boolean;
  morningCheck: boolean;
  any: boolean;
};

/** 아침 재판정의 저녁 대비 조치 (`MorningAdviseJob.diffJson`, DB `diff_json` → JSON 키 `diffJson`). DROP 은 여기가 유일한 기록이다. */
export type MorningDiff = {
  parentAdviceId: number | null;
  keep: MorningDiffAction[];
  add: MorningDiffAction[];
  drop: MorningDiffAction[];
  triggers: MorningTriggers | null;
  usDate: string | null;
  usClosed: boolean | null;
};

/**
 * `AdviceHeader` (tb_advisor_advice). M1~M8 필드(`memoryJson`·`parentAdviceId`·`diffJson`·`regime`)는 구버전 백엔드에 없을 수 있어 optional 이다.
 */
export type AdviceHeader = {
  adviceId: number;
  runId: number;
  baseDate: string;
  adviceKind: AdviceKind;
  variant: AdviceVariant;
  horizonDays: number;
  regimeCode: MarketRegimeCode | null;
  kospiDir: DirectionCall | null;
  kosdaqDir: DirectionCall | null;
  pUp: number | null;
  regimeRationale: string | null;
  leadingSectors: SectorCall[] | null;
  summary: string | null;
  trendKospi: MarketTrendCode | null;
  trendKosdaq: MarketTrendCode | null;
  trends: MarketTrend[] | null;
  outlooks: TrendOutlook[] | null;
  dataAsOf: Record<string, unknown> | null;
  entryDate: string | null;
  exitDate: string | null;
  newsIds: string[] | null;
  promptVersion: string | null;
  model: string | null;
  systemFingerprint: string | null;
  weightSetId: number | null;
  activeLessonIds: number[] | null;
  dataQuality: DataQuality | null;
  guard: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  /** 프롬프트에 실린 메모리 요약 (note-v1). 하나도 안 실렸으면 null. */
  memoryJson?: Record<string, unknown> | null;
  /** 아침 재판정이 다시 본 원 저녁 판단(DAILY LIVE) id. 다른 종류는 null. */
  parentAdviceId?: number | null;
  /** 아침 재판정의 저녁 대비 조치·트리거. 다른 종류는 null. */
  diffJson?: MorningDiff | null;
  /** 합성 국면 스냅샷. */
  regime?: MarketRegime | null;
};

export type SignalValue = { pct: number; w: number; raw: number | null };

export type CandidateRow = {
  ticker: string;
  quantRank: number;
  quantScore: number;
  stockName: string | null;
  marketType: string | null;
  benchIndexCode: string | null;
  sectorCode: string | null;
  sectorName: string | null;
  signals: Record<string, SignalValue> | null;
  features: Record<string, unknown> | null;
  appliedLessonIds: number[] | null;
  refRawClose: number | string | null;
  refAdjClose: number | null;
};

export type CitedFeature = { name: string; value: number };

export type PickRow = {
  ticker: string;
  pickRank: number;
  direction: PickDirection;
  conviction: number;
  thesis: string | null;
  riskNote: string | null;
  cited: CitedFeature[] | null;
  citedNews: string[] | null;
  /** 아침 재판정의 조치(KEEP·ADD) — MORNING 이 아닌 판단은 null. DROP 픽은 저장되지 않아 `diffJson.drop` 에만 있다. */
  action?: PickAction | null;
  actionReason?: string | null;
};

export type CandidateScoreRow = {
  adviceId: number;
  ticker: string;
  horizonDays: number;
  stage: ScoreStage;
  status: ScoreStatus;
  entryDate: string | null;
  entryPrice: number | null;
  exitDate: string | null;
  exitPrice: number | null;
  ret: number | null;
  dividendRet: number;
  benchRet: number | null;
  excessRet: number | null;
  costAdjExcess: number | null;
};

export type CallScoreRow = {
  adviceId: number;
  subjectType: CallSubject;
  subjectCode: string;
  horizonDays: number;
  stage: ScoreStage;
  status: ScoreStatus;
  predicted: string | null;
  pUp: number | null;
  baseValue: number | null;
  exitValue: number | null;
  actualRet: number | null;
  benchRet: number | null;
  band: number | null;
  actualDir: string | null;
  hit: boolean | null;
  brier: number | null;
  eventDate: string | null;
};

export type IntradayCheckRow = {
  checkId: number | null;
  adviceId: number;
  runId: number | null;
  checkedAt: string;
  indexJson: Record<string, unknown> | null;
  pickJson: Record<string, unknown>[] | null;
  agreementRatio: number | null;
  verdict: IntradayVerdict;
  comment: string | null;
};

export type MorningCheckRow = {
  checkId: number | null;
  adviceId: number;
  runId: number | null;
  baseDate: string;
  usDate: string | null;
  gapKospi: number | null;
  gapKosdaq: number | null;
  verdict: MorningVerdict;
  detailJson: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
};

/** `GET /advices/{id}` — 아침 점검은 advice 당 1행이라 없으면 null. */
export type AdviceDetailResponse = {
  header: AdviceHeader;
  candidates: CandidateRow[];
  picks: PickRow[];
  candidateScores: CandidateScoreRow[];
  callScores: CallScoreRow[];
  intradayChecks: IntradayCheckRow[];
  morningCheck: MorningCheckRow | null;
};

/** `GET /advices/{id}/prompt` — variant 코드(LIVE·LLM_NOMEM) → 원문. payload·options·rawOutput 은 JSON 문자열. */
export type PromptInputRow = {
  runId: number;
  variant: AdviceVariant;
  promptVersion: string;
  systemSha256: string;
  userPayload: string;
  optionsJson: string;
  rawOutput: string;
};

export type VariantSummary = {
  variant: AdviceVariant;
  advices: number;
  picks: number;
  hitRate: number | null;
  meanExcess: number | null;
  seExcess: number | null;
  meanCostAdj: number | null;
  poolMeanExcess: number | null;
  /** 부가가치 = 픽 − 후보군 — LLM 층의 1차 KPI */
  valueAdd: number | null;
  avoidMeanExcess: number | null;
  avoidPicks: number;
  /** 판정 불가 종류(learn=false 호라이즌, 기본 H60·H180)일 때만 문구, 그 밖은 null (M8). */
  verdictLabel?: string | null;
};

export type RegimeSummary = {
  calls: number;
  hitRate: number | null;
  meanBrier: number | null;
  brierSkill: number | null;
};

export type CalibrationRow = {
  conviction: number;
  n: number;
  hitRate: number | null;
  meanExcess: number | null;
};

export type RecentPick = {
  baseDate: string;
  ticker: string;
  stockName: string | null;
  conviction: number;
  excess: number | null;
  hit: boolean | null;
};

/** `GET /scores/summary` — `note` 는 판정 시점 경고 문구라 그대로 노출한다. kind·horizonDays 는 실제 집계한 값(M5). */
export type ScoreSummaryResponse = {
  from: string;
  to: string;
  horizonDays: number;
  variants: VariantSummary[];
  regime: RegimeSummary;
  calibration: CalibrationRow[];
  recent: RecentPick[];
  note: string;
  kind?: AdviceKind;
};

/** 대응 차이(MORNING − DAILY) 요약 (`AdvisorKpiService.PairedDiff`). n = 기준일 수, n<2 면 se·t 는 null. */
export type PairedDiff = {
  n: number;
  meanDiff: number | null;
  seDiff: number | null;
  t: number | null;
};

/** 같은 기준일 아침·저녁 LONG 픽 평균 초과 1쌍 (`MorningPair`). */
export type MorningPair = {
  baseDate: string;
  dailyMean: number;
  morningMean: number;
  dailyPicks: number;
  morningPicks: number;
  triggered: boolean;
};

/** `GET /scores/morning-vs-daily` (M4) — 전체·트리거일·비트리거일. */
export type MorningVsDailyResponse = {
  from: string;
  to: string;
  horizonDays: number;
  all: PairedDiff;
  triggered: PairedDiff;
  untriggered: PairedDiff;
  pairs: MorningPair[];
};

/** `SignalWeightMath.IcStat` — `GET /scores/ic` 는 signalCode → IcStat 맵이다. */
export type IcStat = {
  signalCode: string;
  nDays: number;
  nEff: number;
  mean: number;
  se: number;
  tStat: number;
};

export type SignalWeightRow = {
  signalCode: string;
  baseWeight: number;
  multiplier: number;
  weight: number;
  enabled: boolean;
  icMean: number | null;
  icSe: number | null;
  tStat: number | null;
  nDays: number | null;
  flagged: boolean;
  note: string | null;
};

export type WeightSet = {
  weightSetId: number;
  asOf: string;
  windowDays: number;
  nEff: number;
  source: WeightSetSource;
  active: boolean;
  reason: string | null;
  runId: number | null;
  weights: SignalWeightRow[];
  /** 학습 호라이즌(5 DAILY·20 H20) — 활성 세트는 호라이즌마다 1개(M5). 구버전 백엔드는 없음. */
  horizonDays?: number;
};

export type LessonRow = {
  lessonId: number;
  status: LessonStatus;
  scope: LessonScope;
  condition: Record<string, unknown> | null;
  observation: string | null;
  evidence: Record<string, unknown> | null;
  rule: string | null;
  lessonText: string | null;
  appliedCount: number;
  postNApplied: number | null;
  postExcessApplied: number | null;
  postNNotApplied: number | null;
  postExcessNotApplied: number | null;
  activatedAt: string | null;
  retiredAt: string | null;
  retiredReason: string | null;
  model: string | null;
  runId: number | null;
  createdAt: string;
};

export type ChatRow = {
  chatId: number;
  eventId: string | null;
  channelId: string | null;
  threadTs: string | null;
  messageTs: string | null;
  slackUserId: string | null;
  question: string | null;
  answer: string | null;
  status: AdvisorStatus;
  model: string | null;
  promptVersion: string | null;
  historyMessages: number;
  toolCalls: number;
  toolCallNames: string[] | null;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  costUsd: number | string | null;
  dataAsOf: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string | null;
};

/**
 * `GET /gate?baseDate` (M1 신설) — 스케줄러가 쓰는 ADVISE 게이트 판정과 같은 값.
 * `reason` 은 백엔드가 만드는 한글 사유 문장이라 화면이 그대로 보여준다.
 */
export type AdvisorGateResponse = {
  baseDate: string;
  tradingDay: boolean;
  alreadyDone: boolean;
  dataReady: boolean;
  pastDeadline: boolean;
  quality: DataQuality | null;
  reason: string;
  ready: boolean;
  waitQuietly: boolean;
};

/** `DELETE /advices/{id}` 응답. */
export type AdviceDeleteResponse = { adviceId: number; deleted: number };

// ── stats (health 확장) ────────────────────────────────────────────────────

/**
 * 스케줄러 행이 부르는 잡의 수동 실행 매핑 (M1 `SchedulerStatus.manualTrigger`, additive).
 * `jobTypes` 가 둘 이상이면 앞 잡이 끝난 뒤 다음 잡을 순차로 부른다(stock-master: MASTER → HOLIDAY).
 */
export type ManualTrigger = {
  module: RunModule;
  jobTypes: string[];
};
