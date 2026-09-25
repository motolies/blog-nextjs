/**
 * AI 판단 화면 전용 라벨·톤 — variant·국면·방향·데이터 품질·교훈 상태·채점 단계 등.
 *
 * run 상태처럼 두 모듈이 공유하는 라벨은 `lib/quant/runStatus.ts` 가 정본이고, 여기는 **advisor 탭에서만** 쓰는
 * enum 의 표기다(PLAN "화면 전용 라벨은 컴포넌트 모듈 상수"). 라벨 맵이 `Record<Enum, string>` 인 것이 유일한
 * 타입 방어다(strict:false 라 누락을 tsc 가 못 잡는다).
 *
 * 톤 규약(PLAN Badge tone 표): danger=조치 필요 · warning=확인 필요 · success=목표 도달 · primary=진행 · neutral=의도된 무동작.
 */
import type { SearchField } from '@/lib/gridSearch';
import type { BadgeTone } from '@/lib/quant/runStatus';
import type {
  AdviceKind,
  AdviceVariant,
  CallSubject,
  DataQuality,
  DirectionCall,
  IntradayVerdict,
  LessonScope,
  LessonStatus,
  MarketRegimeCode,
  MarketTrendCode,
  MorningVerdict,
  PickAction,
  PickDirection,
  ScoreStage,
  ScoreStatus,
  VolRegimeCode,
  WeightSetSource,
} from '@/types/quant';

/** 모르는 코드(백엔드가 앞선 경우)는 원문을 그대로 보여준다. */
function labelOf<K extends string>(map: Record<K, string>, code: K | string | null | undefined) {
  if (code === null || code === undefined) return '—';
  return (map as Record<string, string>)[code] ?? String(code);
}

// ── variant ───────────────────────────────────────────────────────────────

export const VARIANT_LABEL: Record<AdviceVariant, string> = {
  LIVE: 'LIVE',
  QUANT_TOPN: '퀀트 Top-N',
  LLM_NOMEM: 'LLM 무기억',
  LLM_NONEWS: 'LLM 무뉴스',
  QUANT_TOPN_BROAD: '규칙 Top-N(전체 유니버스)',
};

export const variantLabel = (variant: AdviceVariant | string | null | undefined) =>
  labelOf(VARIANT_LABEL, variant);

/** LIVE 만 primary(발행되는 판단) — 섀도 변형은 neutral. */
export function variantTone(variant: AdviceVariant | string): BadgeTone {
  return variant === 'LIVE' ? 'primary' : 'neutral';
}

/** 검색 select 옵션 — "전체" 는 DynamicSearchFields 가 sentinel 로 자동 삽입(`as const` 금지 규칙은 runStatus.ts 와 같다). */
export const VARIANT_OPTIONS: NonNullable<SearchField['options']> = (
  Object.keys(VARIANT_LABEL) as AdviceVariant[]
).map((variant) => ({ value: variant, label: `${VARIANT_LABEL[variant]} (${variant})` }));

// ── 판단 종류 ───────────────────────────────────────────────────────────────

export const KIND_LABEL: Record<AdviceKind, string> = {
  DAILY: '일일',
  MORNING: '아침 재판정',
  H20: '20일',
  H60: '60일',
  H180: '180일',
  ADHOC: '수시',
};

export const kindLabel = (kind: AdviceKind | string | null | undefined) =>
  labelOf(KIND_LABEL, kind);

/** DAILY 는 기본값이라 neutral, 나머지는 primary 로 "기본이 아닌 종류를 보고 있다" 를 드러낸다. */
export function kindTone(kind: AdviceKind | string | null | undefined): BadgeTone {
  return kind === 'DAILY' ? 'neutral' : 'primary';
}

/**
 * 종류 select 옵션 — "전체" 가 없다(백엔드는 kind 를 생략하면 DAILY 로 본다 — "전체" 를 두면 DAILY 만 보이는 거짓 전체가 된다).
 * 라벨에 코드를 함께 둔다(Slack·채팅 도구는 코드로 말한다).
 */
export function kindOptions(kinds: readonly AdviceKind[]): NonNullable<SearchField['options']> {
  return kinds.map((kind) => ({ value: kind, label: `${KIND_LABEL[kind]} (${kind})` }));
}

// ── 시장 판단 ───────────────────────────────────────────────────────────────

export const REGIME_LABEL: Record<MarketRegimeCode, string> = {
  RISK_ON: '위험 선호',
  NEUTRAL: '중립',
  RISK_OFF: '위험 회피',
};
export const regimeLabel = (code: MarketRegimeCode | string | null | undefined) =>
  labelOf(REGIME_LABEL, code);

export const DIRECTION_LABEL: Record<DirectionCall, string> = {
  UP: '상승',
  NEUTRAL: '중립',
  DOWN: '하락',
};
export const directionLabel = (code: DirectionCall | string | null | undefined) =>
  labelOf(DIRECTION_LABEL, code);

export const TREND_LABEL: Record<MarketTrendCode, string> = {
  BULL: '상승 추세',
  SIDEWAYS: '횡보',
  BEAR: '하락 추세',
};
export const trendLabel = (code: MarketTrendCode | string | null | undefined) =>
  labelOf(TREND_LABEL, code);

export const VOL_REGIME_LABEL: Record<VolRegimeCode, string> = {
  LOW: '저변동',
  NORMAL: '보통 변동',
  HIGH: '고변동',
  UNKNOWN: '변동성 판정 불가',
};
export const volRegimeLabel = (code: VolRegimeCode | string | null | undefined) =>
  labelOf(VOL_REGIME_LABEL, code);
/** HIGH warning(정책 표가 한도를 조인다) · UNKNOWN neutral(정책 가산 없음) · 나머지 neutral. */
export function volRegimeTone(code: VolRegimeCode | string | null | undefined): BadgeTone {
  return code === 'HIGH' ? 'warning' : 'neutral';
}

/** 추세 톤 — BULL success · BEAR danger · SIDEWAYS/없음 neutral. */
export function trendTone(code: MarketTrendCode | string | null | undefined): BadgeTone {
  if (code === 'BULL') return 'success';
  if (code === 'BEAR') return 'danger';
  return 'neutral';
}

export const DATA_QUALITY_LABEL: Record<DataQuality, string> = { OK: '정상', DEGRADED: '저하' };
export const dataQualityLabel = (code: DataQuality | string | null | undefined) =>
  labelOf(DATA_QUALITY_LABEL, code);
export function dataQualityTone(code: DataQuality | string | null | undefined): BadgeTone {
  if (code === 'OK') return 'success';
  if (code === 'DEGRADED') return 'warning';
  return 'neutral';
}

// ── 픽·채점 ─────────────────────────────────────────────────────────────────

export const PICK_ACTION_LABEL: Record<PickAction, string> = {
  KEEP: '유지',
  ADD: '추가',
  DROP: '제외',
};
export const pickActionLabel = (code: PickAction | string | null | undefined) =>
  labelOf(PICK_ACTION_LABEL, code);
/** DROP warning(저녁 판단을 뒤집음) · ADD primary(새로 들어옴) · KEEP neutral(의도된 무변경). */
export function pickActionTone(code: PickAction | string | null | undefined): BadgeTone {
  if (code === 'DROP') return 'warning';
  if (code === 'ADD') return 'primary';
  return 'neutral';
}

export const PICK_DIRECTION_LABEL: Record<PickDirection, string> = { LONG: '매수', AVOID: '회피' };
export const pickDirectionLabel = (code: PickDirection | string | null | undefined) =>
  labelOf(PICK_DIRECTION_LABEL, code);
export function pickDirectionTone(code: PickDirection | string): BadgeTone {
  return code === 'LONG' ? 'primary' : 'warning';
}

export const SCORE_STAGE_LABEL: Record<ScoreStage, string> = {
  PROVISIONAL: '잠정',
  CONFIRMED: '확정',
};
export const scoreStageLabel = (code: ScoreStage | string | null | undefined) =>
  labelOf(SCORE_STAGE_LABEL, code);

export const SCORE_STATUS_LABEL: Record<ScoreStatus, string> = {
  SCORED: '채점',
  MISSING: '누락',
  SUSPENDED: '거래정지',
  DELISTED: '상폐',
};
export const scoreStatusLabel = (code: ScoreStatus | string | null | undefined) =>
  labelOf(SCORE_STATUS_LABEL, code);
export function scoreStatusTone(code: ScoreStatus | string): BadgeTone {
  switch (code) {
    case 'SCORED':
      return 'success';
    case 'MISSING':
      return 'warning';
    case 'SUSPENDED':
    case 'DELISTED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export const CALL_SUBJECT_LABEL: Record<CallSubject, string> = {
  INDEX: '지수',
  SECTOR: '섹터',
  TREND: '추세',
  TREND_INV: '추세 반전',
  MORNING: '아침',
};
export const callSubjectLabel = (code: CallSubject | string | null | undefined) =>
  labelOf(CALL_SUBJECT_LABEL, code);

// ── 점검 ───────────────────────────────────────────────────────────────────

export const INTRADAY_VERDICT_LABEL: Record<IntradayVerdict, string> = {
  ON_TRACK: '순항',
  MIXED: '혼조',
  OFF_TRACK: '이탈',
};
export const intradayVerdictLabel = (code: IntradayVerdict | string | null | undefined) =>
  labelOf(INTRADAY_VERDICT_LABEL, code);
export function intradayVerdictTone(code: IntradayVerdict | string): BadgeTone {
  switch (code) {
    case 'ON_TRACK':
      return 'success';
    case 'MIXED':
      return 'warning';
    case 'OFF_TRACK':
      return 'danger';
    default:
      return 'neutral';
  }
}

export const MORNING_VERDICT_LABEL: Record<MorningVerdict, string> = {
  REINFORCE: '강화',
  HOLD: '유지',
  CAUTION: '주의',
};
export const morningVerdictLabel = (code: MorningVerdict | string | null | undefined) =>
  labelOf(MORNING_VERDICT_LABEL, code);
export function morningVerdictTone(code: MorningVerdict | string): BadgeTone {
  switch (code) {
    case 'REINFORCE':
      return 'success';
    case 'HOLD':
      return 'neutral';
    case 'CAUTION':
      return 'warning';
    default:
      return 'neutral';
  }
}

// ── 가중치·교훈 ─────────────────────────────────────────────────────────────

export const WEIGHT_SOURCE_LABEL: Record<WeightSetSource, string> = {
  SEED: '시드',
  BACKFILL: '백필',
  WEEKLY: '주간 갱신',
  MANUAL: '수동 활성화',
};
export const weightSourceLabel = (code: WeightSetSource | string | null | undefined) =>
  labelOf(WEIGHT_SOURCE_LABEL, code);

export const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  CANDIDATE: '후보',
  ACTIVE: '활성',
  RETIRED: '폐기',
};
export const lessonStatusLabel = (code: LessonStatus | string | null | undefined) =>
  labelOf(LESSON_STATUS_LABEL, code);
/** CANDIDATE warning(검토 필요) · ACTIVE success(적용 중) · RETIRED neutral(의도된 종료). */
export function lessonStatusTone(code: LessonStatus | string): BadgeTone {
  switch (code) {
    case 'CANDIDATE':
      return 'warning';
    case 'ACTIVE':
      return 'success';
    default:
      return 'neutral';
  }
}

export const LESSON_STATUS_OPTIONS: NonNullable<SearchField['options']> = (
  Object.keys(LESSON_STATUS_LABEL) as LessonStatus[]
).map((status) => ({ value: status, label: LESSON_STATUS_LABEL[status] }));

export const LESSON_SCOPE_LABEL: Record<LessonScope, string> = {
  SIGNAL: '시그널',
  REGIME: '국면',
  SECTOR: '섹터',
  CALIBRATION: '보정',
};
export const lessonScopeLabel = (code: LessonScope | string | null | undefined) =>
  labelOf(LESSON_SCOPE_LABEL, code);

// ── 공통 빈 상태 ──────────────────────────────────────────────────────────────

/** advisor 404 빈 상태 문구 — M2 `GateWidget` 과 같은 문장(화면마다 문구가 갈리면 운영자가 다른 장애로 읽는다). */
export const ADVISOR_DISABLED_EMPTY = {
  message: 'AI 어드바이저가 비활성입니다',
  hint: 'advisor.enabled=false 환경 — 판단·게이트를 조회할 수 없습니다',
} as const;
