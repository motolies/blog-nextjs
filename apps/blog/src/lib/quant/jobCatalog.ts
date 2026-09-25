/**
 * 잡 카탈로그 — 백엔드 enum `CollectJobType`(23)·`AdvisorJobType`(11) 의 desc·longRunning 복제본.
 *
 * run 응답에는 `jobDescription` 이 실려 오므로 목록·상세는 그 값을 쓴다. 이 복제본은 **run 이 없는 자리**
 * (검색 select·M3 수동 실행 폼·스케줄러 위젯의 잡 이름) 전용이다.
 *
 * ⚠️ 두 저장소가 분리돼 백엔드 enum 과 대조하는 테스트를 둘 수 없다 — enum 을 고치면 여기도 함께 고친다.
 *    `jobCatalog.test.ts` 는 `types/quant.ts` 의 상수 배열과 이 맵의 키 집합이 같은지만 검증한다.
 */

import {
  ADVISOR_JOB_TYPES,
  type AdvisorJobType,
  COLLECT_JOB_TYPES,
  type CollectJobType,
} from '../../types/quant';
import type { SearchField } from '../gridSearch';

export type JobMeta = {
  /** 백엔드 enum desc(한글) */
  desc: string;
  /**
   * API 트리거 시 202(백그라운드)로 돌아오는 잡인지. false 면 완료 후 200.
   * stock: kisBackfillExecutor core/max 1·queue 10 → 동시 1개, 최대 10개 대기, 11번째는 400.
   */
  longRunning: boolean;
  /** confirm 문구에 쓰는 소요 시간 기준(`claudedocs/stock-collect.md:52,86,90`). 없으면 표시하지 않는다. */
  durationHint?: string;
};

export const COLLECT_JOB_META: Record<CollectJobType, JobMeta> = {
  BACKFILL_ALL: {
    desc: '전체 백필 (순차 하위 run)',
    longRunning: true,
    durationHint: '약 4~5시간',
  },
  MASTER: { desc: '종목 마스터 갱신', longRunning: false },
  HOLIDAY: { desc: '휴장일 수집', longRunning: false },
  INDEX_BACKFILL: { desc: '지수 일봉 백필', longRunning: true },
  PRICE_BACKFILL: { desc: '종목 일봉 백필', longRunning: true },
  STOCK_INFO: { desc: '종목 기본정보 수집', longRunning: true },
  VALUATION: { desc: '밸류에이션 스냅샷', longRunning: true },
  MARKET_STAT: { desc: '시장 통계(공매도·신용·프로그램)', longRunning: true },
  CORP_ACTION: { desc: '기업행사 수집', longRunning: true },
  ADJUST_FACTOR: { desc: '수정주가 계수 산출', longRunning: true },
  INVESTOR_BACKFILL: { desc: '투자자 수급 백필', longRunning: true },
  FINANCIAL_BACKFILL: { desc: '재무제표 백필', longRunning: true },
  OVERSEAS_BACKFILL: { desc: '해외 지표 백필', longRunning: true },
  ETF_NAV_BACKFILL: { desc: 'ETF NAV 일별 백필', longRunning: true },
  MARKET_INVESTOR_BACKFILL: { desc: '시장별 투자자 일별 백필', longRunning: true },
  DERIVED_REFRESH: { desc: '파생 지표 갱신', longRunning: true },
  VALIDATE: { desc: '정합성 검증', longRunning: false },
  DAILY: { desc: '일일 증분 수집', longRunning: true, durationHint: '약 20~25분' },
  WEEKLY: { desc: '주간 수집', longRunning: true, durationHint: '약 60~90분' },
  OVERSEAS_DAILY: { desc: '해외 일일 증분', longRunning: true },
  MACRO: { desc: '거시 위험 지표 수집', longRunning: true },
  NEWS: { desc: '사건 피드·헤드라인 수집', longRunning: true },
  RELOAD: { desc: '부분 재적재', longRunning: true },
};

export const ADVISOR_JOB_META: Record<AdvisorJobType, JobMeta> = {
  ADVISE: { desc: '일일 시장 판단·추천', longRunning: true },
  SCORE: { desc: '채점·IC 계산 (보충 실행)', longRunning: true },
  INTRADAY: { desc: '장중 점검', longRunning: false },
  MORNING_CHECK: { desc: '아침 해외 반영 점검', longRunning: false },
  MORNING_ADVISE: { desc: '아침 재판정', longRunning: true },
  WEEKLY_REVIEW: { desc: '주간 검토 (가중치·보정·교훈·보고)', longRunning: true },
  IC_BACKFILL: { desc: '시그널 IC 사전 추정', longRunning: true },
  ADVISE_ADHOC: { desc: '수시 판단(채팅 요청)', longRunning: true },
  ADVISE_H20: { desc: '20거래일 주간 판단', longRunning: true },
  ADVISE_H60: { desc: '60거래일 규칙 추천(격주)', longRunning: true },
  ADVISE_H180: { desc: '180거래일 규칙 추천(월간)', longRunning: true },
};

/**
 * 관리자 화면에서 수동 실행할 수 있는 advisor 잡 — 백엔드 `SchedulerCatalog` 의 advisor `manualTrigger` 8개 + IC_BACKFILL(호라이즌 지정 백필).
 * ADVISE_ADHOC(채팅 봇 전용)·SCORE(보충 실행)는 카탈로그에 없어 넣지 않는다.
 */
export const ADVISOR_MANUAL_JOB_TYPES = [
  'ADVISE',
  'MORNING_ADVISE',
  'ADVISE_H20',
  'ADVISE_H60',
  'ADVISE_H180',
  'INTRADAY',
  'MORNING_CHECK',
  'WEEKLY_REVIEW',
  'IC_BACKFILL',
] as const satisfies readonly AdvisorJobType[];
export type AdvisorManualJobType = (typeof ADVISOR_MANUAL_JOB_TYPES)[number];

/** URL `?job=` 값을 수동 실행 대상으로 해석한다. 모르는 값·없음은 null(경로 변수로 나가므로 허용 목록이 유일한 방어). */
export function resolveAdvisorManualJob(
  value: string | null | undefined,
): AdvisorManualJobType | null {
  return value && (ADVISOR_MANUAL_JOB_TYPES as readonly string[]).includes(value)
    ? (value as AdvisorManualJobType)
    : null;
}

/** 잡 이름 → 표기. 모르는 코드(백엔드가 앞선 경우)는 원문. */
export function collectJobLabel(jobType: string): string {
  return (COLLECT_JOB_META as Record<string, JobMeta>)[jobType]?.desc ?? jobType;
}

export function advisorJobLabel(jobType: string): string {
  return (ADVISOR_JOB_META as Record<string, JobMeta>)[jobType]?.desc ?? jobType;
}

/** 모듈을 알 때 한 함수로 — 스케줄러 위젯이 `manualTrigger.module` 로 고른다. */
export function jobLabel(module: 'STOCK' | 'ADVISOR', jobType: string): string {
  return module === 'STOCK' ? collectJobLabel(jobType) : advisorJobLabel(jobType);
}

/**
 * 검색 select 옵션 — 라벨은 "desc (CODE)" 로 둔다. desc 만 두면 코드로 찾는 운영자(Slack 알림은 코드로 온다)가 못 찾는다.
 * `as const` 금지·"전체" 미삽입 규칙은 `runStatus.ts` 와 같다.
 */
export const COLLECT_JOB_OPTIONS: NonNullable<SearchField['options']> = COLLECT_JOB_TYPES.map(
  (jobType) => ({ value: jobType, label: `${COLLECT_JOB_META[jobType].desc} (${jobType})` }),
);

export const ADVISOR_JOB_OPTIONS: NonNullable<SearchField['options']> = ADVISOR_JOB_TYPES.map(
  (jobType) => ({ value: jobType, label: `${ADVISOR_JOB_META[jobType].desc} (${jobType})` }),
);
