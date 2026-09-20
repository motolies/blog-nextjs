import { describe, expect, it } from 'vitest';
import {
  advisorRerunArgs,
  describeBackfillRequest,
  isTickersTruncated,
  planStepRetry,
  restoreBackfillRequest,
  STEP_RETRY_TARGET,
} from './stepRetry';
import { DAILY_STEPS, WEEKLY_STEPS } from './steps';

const TODAY = '2026-09-20';

describe('STEP_RETRY_TARGET', () => {
  it('DAILY·WEEKLY 단계 전부에 항목이 있다(null 포함)', () => {
    for (const step of [...DAILY_STEPS, ...WEEKLY_STEPS]) {
      expect(step in STEP_RETRY_TARGET).toBe(true);
    }
  });

  it('INDEX·PRICE·CA_HINT 는 대응 없음 — PRICE_BACKFILL 을 권하면 수 시간짜리 전체 백필이 돈다', () => {
    expect(STEP_RETRY_TARGET.INDEX).toBeNull();
    expect(STEP_RETRY_TARGET.PRICE).toBeNull();
    expect(STEP_RETRY_TARGET.CA_HINT).toBeNull();
  });
});

describe('planStepRetry', () => {
  it('대응 없는 단계는 사유와 함께 비활성', () => {
    const plan = planStepRetry('PRICE', { targetDate: TODAY }, TODAY);
    expect(plan.available).toBe(false);
    if (plan.available === false) expect(plan.reason).toContain('다음 DAILY');
  });

  it('VALUATION 은 endDate=targetDate 를 싣고 당일에만 가능하다', () => {
    const today = planStepRetry('VALUATION', { targetDate: TODAY }, TODAY);
    expect(today).toMatchObject({
      available: true,
      jobType: 'VALUATION',
      body: { endDate: TODAY },
      summary: 'VALUATION 단계 → VALUATION 잡 · 대상일 2026-09-20',
    });

    const yesterday = planStepRetry('VALUATION', { targetDate: '2026-09-19' }, TODAY);
    expect(yesterday.available).toBe(false);
    if (yesterday.available === false) expect(yesterday.reason).toContain('당일 한정');
  });

  it('DERIVED 는 body 없는 DERIVED_REFRESH(증분), DERIVED_FULL 은 force', () => {
    expect(planStepRetry('DERIVED', { targetDate: TODAY }, TODAY)).toMatchObject({
      available: true,
      jobType: 'DERIVED_REFRESH',
      body: {},
    });
    expect(planStepRetry('DERIVED_FULL', { targetDate: null }, TODAY)).toMatchObject({
      available: true,
      jobType: 'DERIVED_REFRESH',
      body: { force: true },
    });
  });

  it('DAILY 나머지 단계는 개별 백필 잡으로, STATS 는 MARKET_STAT 으로', () => {
    const expected: Record<string, string> = {
      INVESTOR: 'INVESTOR_BACKFILL',
      MARKET_INVESTOR: 'MARKET_INVESTOR_BACKFILL',
      ETF_NAV: 'ETF_NAV_BACKFILL',
      STATS: 'MARKET_STAT',
      VALIDATE: 'VALIDATE',
    };
    for (const [step, jobType] of Object.entries(expected)) {
      expect(planStepRetry(step, { targetDate: TODAY }, TODAY)).toMatchObject({
        available: true,
        jobType,
      });
    }
  });

  it('WEEKLY 의 문서 미명시 매핑은 inferred 로 표시된다', () => {
    const plan = planStepRetry('FINANCIAL', { targetDate: null }, TODAY);
    expect(plan).toMatchObject({ available: true, jobType: 'FINANCIAL_BACKFILL', inferred: true });
  });

  it('모르는 단계는 대응 없음으로 닫는다', () => {
    expect(planStepRetry('NEW_STEP', { targetDate: TODAY }, TODAY).available).toBe(false);
  });
});

describe('restoreBackfillRequest', () => {
  it('metadata 요약을 BackfillRequest 로 되돌린다 — resetCheckpoint 는 복원하지 않는다', () => {
    const body = restoreBackfillRequest({
      metadata: {
        startDate: '2026-01-01',
        endDate: '2026-09-19',
        tickerFrom: '000020',
        tickerTo: '099999',
        tickerCount: 2,
        tickers: ['005930', '000660'],
        indexCodes: ['0001'],
        resetCheckpoint: true,
        force: true,
        steps: [],
      },
    });
    expect(body).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-09-19',
      tickerFrom: '000020',
      tickerTo: '099999',
      tickers: ['005930', '000660'],
      indexCodes: ['0001'],
      force: true,
    });
  });

  it('metadata 가 없으면 빈 요청(기본값)', () => {
    expect(restoreBackfillRequest({ metadata: null })).toEqual({});
  });

  it('tickerCount > 20 이면 절단된 목록이라 복원을 거부한다', () => {
    const run = { metadata: { tickerCount: 25, tickers: Array(20).fill('005930') } };
    expect(restoreBackfillRequest(run)).toBeNull();
    expect(isTickersTruncated(run)).toBe(true);
    expect(isTickersTruncated({ metadata: { tickerCount: 20 } })).toBe(false);
  });
});

describe('describeBackfillRequest', () => {
  it('confirm 문구용 요약', () => {
    expect(describeBackfillRequest({})).toBe('인자 없음(기본값)');
    expect(
      describeBackfillRequest({
        startDate: '2026-01-01',
        tickers: ['a', 'b', 'c'],
        force: true,
        resetCheckpoint: true,
      }),
    ).toBe('기간 2026-01-01~오늘 · 종목 3개 · force · 체크포인트 초기화');
  });
});

describe('advisorRerunArgs', () => {
  it('requested=false 이고 오늘이면 baseDate 를 생략한다(스케줄 run 재현)', () => {
    expect(advisorRerunArgs({ baseDate: TODAY, metadata: { requested: false } }, TODAY)).toEqual(
      {},
    );
  });

  it('requested=false 라도 어제 run 이면 날짜를 고정한다', () => {
    expect(
      advisorRerunArgs({ baseDate: '2026-09-19', metadata: { requested: false } }, TODAY),
    ).toEqual({ baseDate: '2026-09-19' });
  });

  it('requested=true 는 오늘이어도 baseDate 를 붙인다 — IC_BACKFILL 시작일 결정이 달라진다', () => {
    expect(advisorRerunArgs({ baseDate: TODAY, metadata: { requested: true } }, TODAY)).toEqual({
      baseDate: TODAY,
    });
  });

  it('metadata 가 없는 옛 run 은 날짜를 고정한다', () => {
    expect(advisorRerunArgs({ baseDate: TODAY, metadata: null }, TODAY)).toEqual({
      baseDate: TODAY,
    });
    expect(advisorRerunArgs({ baseDate: null, metadata: null }, TODAY)).toEqual({});
  });
});
