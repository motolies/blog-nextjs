import { describe, expect, it } from 'vitest';
import {
  describeStepSummary,
  retryableSteps,
  skippedSteps,
  stepsOf,
  summarizeSteps,
} from './steps';

const DAILY_FAILED = {
  steps: [
    { step: 'INDEX', status: 'OK', ms: 1200, processed: 3, failures: 0 },
    { step: 'PRICE', status: 'OK', ms: 90000, processed: 2500, failures: 0 },
    {
      step: 'VALUATION',
      status: 'FAILED',
      ms: 3000,
      processed: 10,
      failures: 1,
      reason: 'KIS 500',
    },
    { step: 'DERIVED', status: 'SKIPPED', reason: 'VALUATION 실패로 건너뜀' },
  ],
};

describe('stepsOf', () => {
  it('metadata.steps 배열을 그대로 꺼낸다', () => {
    expect(stepsOf(DAILY_FAILED)).toHaveLength(4);
  });

  it('없거나 배열이 아니거나 step 키가 없는 항목은 버린다', () => {
    expect(stepsOf(null)).toEqual([]);
    expect(stepsOf({ steps: 'nope' })).toEqual([]);
    expect(stepsOf({ steps: [{ status: 'OK' }, null, { step: 'X', status: 'OK' }] })).toEqual([
      { step: 'X', status: 'OK' },
    ]);
  });
});

describe('summarizeSteps / describeStepSummary', () => {
  it('성공 수와 실패·건너뜀 단계 이름을 모은다', () => {
    const summary = summarizeSteps(stepsOf(DAILY_FAILED));
    expect(summary).toEqual({
      total: 4,
      ok: 2,
      failed: ['VALUATION'],
      skipped: ['DERIVED'],
      canceled: [],
    });
    expect(describeStepSummary(summary)).toBe('2/4 성공 · 실패 VALUATION · 건너뜀 DERIVED');
  });

  it('BACKFILL_ALL 하위 run 의 SUCCESS 도 성공으로 센다', () => {
    const summary = summarizeSteps([
      { step: 'MASTER', status: 'SUCCESS', runId: 1 },
      { step: 'PRICE_BACKFILL', status: 'CANCELED', runId: 2 },
    ]);
    expect(summary.ok).toBe(1);
    expect(summary.canceled).toEqual(['PRICE_BACKFILL']);
    expect(describeStepSummary(summary)).toBe('1/2 성공 · 취소 PRICE_BACKFILL');
  });
});

describe('retryableSteps / skippedSteps', () => {
  it('FAILED 만 재실행 후보다 — SKIPPED 는 앞 단계 실패의 결과라 단독 재실행 대상이 아니다', () => {
    expect(retryableSteps(stepsOf(DAILY_FAILED)).map((s) => s.step)).toEqual(['VALUATION']);
  });

  it('SKIPPED 는 사유 표시용으로 따로 꺼낸다', () => {
    const skipped = skippedSteps(stepsOf(DAILY_FAILED));
    expect(skipped.map((s) => s.step)).toEqual(['DERIVED']);
    expect(skipped[0]?.reason).toContain('VALUATION 실패');
  });

  it('CANCELED 는 둘 다 아니다 — run 전체 재실행 대상', () => {
    const steps = [{ step: 'PRICE', status: 'CANCELED' }];
    expect(retryableSteps(steps)).toEqual([]);
    expect(skippedSteps(steps)).toEqual([]);
  });
});
