import { describe, expect, it } from 'vitest';
import { ADVISOR_JOB_TYPES, COLLECT_JOB_TYPES } from '../../types/quant';
import {
  ADVISOR_JOB_META,
  ADVISOR_JOB_OPTIONS,
  ADVISOR_MANUAL_JOB_TYPES,
  advisorJobLabel,
  COLLECT_JOB_META,
  COLLECT_JOB_OPTIONS,
  collectJobLabel,
  jobLabel,
  resolveAdvisorManualJob,
} from './jobCatalog';

describe('jobCatalog', () => {
  it('stock 잡 23종 전부에 메타가 있고 키 집합이 상수 배열과 같다', () => {
    expect(COLLECT_JOB_TYPES).toHaveLength(23);
    expect(new Set(Object.keys(COLLECT_JOB_META))).toEqual(new Set(COLLECT_JOB_TYPES));
  });

  it('advisor 잡 11종 전부에 메타가 있다', () => {
    expect(ADVISOR_JOB_TYPES).toHaveLength(11);
    expect(new Set(Object.keys(ADVISOR_JOB_META))).toEqual(new Set(ADVISOR_JOB_TYPES));
  });

  it('200 으로 끝나는 짧은 잡은 MASTER·HOLIDAY·VALIDATE(stock) · INTRADAY·MORNING_CHECK(advisor) 뿐이다', () => {
    const shortStock = COLLECT_JOB_TYPES.filter((j) => !COLLECT_JOB_META[j].longRunning);
    expect(new Set(shortStock)).toEqual(new Set(['MASTER', 'HOLIDAY', 'VALIDATE']));
    const shortAdvisor = ADVISOR_JOB_TYPES.filter((j) => !ADVISOR_JOB_META[j].longRunning);
    expect(new Set(shortAdvisor)).toEqual(new Set(['INTRADAY', 'MORNING_CHECK']));
  });

  it('select 옵션은 코드를 함께 보여주고 "전체" 를 넣지 않는다', () => {
    expect(COLLECT_JOB_OPTIONS).toHaveLength(23);
    expect(COLLECT_JOB_OPTIONS.find((o) => o.value === 'DAILY')?.label).toBe(
      '일일 증분 수집 (DAILY)',
    );
    expect(ADVISOR_JOB_OPTIONS.some((o) => o.value === '')).toBe(false);
  });

  it('모르는 코드는 원문을 돌려준다', () => {
    expect(collectJobLabel('FUTURE_JOB')).toBe('FUTURE_JOB');
    expect(advisorJobLabel('ADVISE')).toBe('일일 시장 판단·추천');
    expect(jobLabel('STOCK', 'DAILY')).toBe('일일 증분 수집');
    expect(jobLabel('ADVISOR', 'SCORE')).toBe('채점·IC 계산 (보충 실행)');
  });

  it('수동 실행 목록은 SchedulerCatalog 8개 + IC_BACKFILL — 채팅 전용 ADVISE_ADHOC·보충 SCORE 는 없다', () => {
    expect(ADVISOR_MANUAL_JOB_TYPES).toHaveLength(9);
    expect(ADVISOR_MANUAL_JOB_TYPES).toContain('IC_BACKFILL');
    expect(ADVISOR_MANUAL_JOB_TYPES).not.toContain('ADVISE_ADHOC');
    expect(ADVISOR_MANUAL_JOB_TYPES).not.toContain('SCORE');
  });

  it('URL 잡 값은 수동 실행 허용 목록만 통과한다', () => {
    expect(resolveAdvisorManualJob('ADVISE_H60')).toBe('ADVISE_H60');
    expect(resolveAdvisorManualJob('ADVISE_ADHOC')).toBeNull();
    expect(resolveAdvisorManualJob('../x')).toBeNull();
    expect(resolveAdvisorManualJob(null)).toBeNull();
  });
});
