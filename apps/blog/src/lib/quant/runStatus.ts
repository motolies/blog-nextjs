/**
 * run 상태 표기 — stock·advisor 두 모듈이 공유하는 라벨·톤·select 옵션의 단일 진실.
 *
 * `lib/logStatus.ts` 관례를 따른다: 정본 파일 하나 + select 옵션 + 배지 함수 + 테스트.
 * 라벨 맵이 `Record<RunStatus, string>` 인 것이 유일한 타입 방어다(strict:false 라 누락을 tsc 가 못 잡는다).
 *
 * Badge tone 규약(PLAN 재시도 절): danger=조치 필요 · warning=확인 필요 · success=목표 도달 ·
 * primary=진행 · neutral=의도된 무동작.
 */

import type { AdvisorStatus, CollectStatus, RunStepStatus } from '../../types/quant';
import type { SearchField } from '../gridSearch';

/** 두 모듈의 상태 합집합 — SKIPPED 는 advisor 전용이다. */
export type RunStatus = CollectStatus | AdvisorStatus;

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  RUNNING: '실행 중',
  SUCCESS: '성공',
  PARTIAL: '부분 성공',
  FAILED: '실패',
  SKIPPED: '건너뜀',
  CANCELED: '취소',
};

/** RUNNING primary · SUCCESS success · PARTIAL warning · FAILED danger · SKIPPED neutral · CANCELED neutral */
export function runStatusTone(status: RunStatus | string): BadgeTone {
  switch (status) {
    case 'RUNNING':
      return 'primary';
    case 'SUCCESS':
      return 'success';
    case 'PARTIAL':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** 알 수 없는 값(백엔드가 상태를 추가한 뒤 프론트가 뒤처진 경우)은 원문을 그대로 보여준다. */
export function runStatusLabel(status: RunStatus | string): string {
  return (RUN_STATUS_LABEL as Record<string, string>)[status] ?? String(status);
}

/**
 * stock 실행 이력의 상태 select 옵션. **"전체" 는 넣지 않는다** — DynamicSearchFields 가 sentinel 로 자동 삽입한다.
 * `as const` 를 쓰지 않는 이유: readonly 튜플이 되어 가변 배열인 SearchField.options 에 대입되지 않는다.
 *
 * ⚠️ SKIPPED 는 stock `CollectStatus` 에 없다 — 여기 넣으면 요청이 400 이 되고 400 은 Slack 을 울린다.
 */
export const RUN_STATUS_OPTIONS: NonNullable<SearchField['options']> = [
  { value: 'RUNNING', label: RUN_STATUS_LABEL.RUNNING },
  { value: 'SUCCESS', label: RUN_STATUS_LABEL.SUCCESS },
  { value: 'PARTIAL', label: RUN_STATUS_LABEL.PARTIAL },
  { value: 'FAILED', label: RUN_STATUS_LABEL.FAILED },
  { value: 'CANCELED', label: RUN_STATUS_LABEL.CANCELED },
];

/** advisor 실행 이력의 상태 select 옵션 — stock 옵션 + SKIPPED. */
export const ADVISOR_RUN_STATUS_OPTIONS: NonNullable<SearchField['options']> = [
  ...RUN_STATUS_OPTIONS,
  { value: 'SKIPPED', label: RUN_STATUS_LABEL.SKIPPED },
];

/** 종료 상태인지 — 재실행 버튼은 종료 run 에만, 취소는 RUNNING 에만 뜬다. */
export function isTerminal(status: RunStatus | string): boolean {
  return status !== 'RUNNING';
}

/** 실패 계열(조치·확인이 필요한 종료) — 운영 현황의 "최근 실패" 와 배너가 같은 판정을 쓴다. */
export function isFailureLike(status: RunStatus | string): boolean {
  return status === 'FAILED' || status === 'PARTIAL' || status === 'CANCELED';
}

// ── steps[] ───────────────────────────────────────────────────────────────

export const STEP_STATUS_LABEL: Record<RunStepStatus, string> = {
  OK: '성공',
  FAILED: '실패',
  SKIPPED: '건너뜀',
  CANCELED: '취소',
};

/**
 * 단계 톤 — OK success · FAILED danger · SKIPPED warning(reason 표기) · CANCELED neutral.
 * BACKFILL_ALL 하위 run 은 `CollectStatus` 값을 쓰므로 SUCCESS/PARTIAL/RUNNING 도 함께 받는다.
 */
export function stepStatusTone(status: RunStepStatus | string): BadgeTone {
  switch (status) {
    case 'OK':
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'SKIPPED':
    case 'PARTIAL':
      return 'warning';
    case 'RUNNING':
      return 'primary';
    default:
      return 'neutral';
  }
}

export function stepStatusLabel(status: RunStepStatus | string): string {
  return (STEP_STATUS_LABEL as Record<string, string>)[status] ?? runStatusLabel(status);
}
