import { describe, expect, it } from 'vitest';
import {
  addDays,
  dailyTokenSeries,
  hasCostPricing,
  summarizeUsage,
  sumUsage,
  totalTokens,
  type UsageRun,
  windowStart,
} from './usage';

const TODAY = '2026-09-20';

/** KST 벽시계 `date HH:mm` → Instant ISO(백엔드 직렬화와 같은 꼴). */
function atKst(date: string, time: string): string {
  return new Date(`${date}T${time}:00+09:00`).toISOString();
}

function run(startedAt: string, tokens: Partial<UsageRun> = {}): UsageRun {
  return {
    startedAt,
    llmCalls: 1,
    promptTokens: 100,
    completionTokens: 10,
    reasoningTokens: 5,
    cachedTokens: 2,
    costUsd: 0,
    ...tokens,
  };
}

describe('addDays · windowStart', () => {
  it('월말·연말 경계를 넘긴다', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('창 시작일은 today 를 포함해 N일 — 7일 창은 today-6', () => {
    expect(windowStart(TODAY, 1)).toBe('2026-09-20');
    expect(windowStart(TODAY, 7)).toBe('2026-09-14');
    expect(windowStart(TODAY, 30)).toBe('2026-08-22');
  });
});

describe('sumUsage — KST 날짜 경계', () => {
  it('KST 23:59 은 오늘, KST 00:00 다음 날은 내일 — UTC 로 자르면 둘 다 틀린다', () => {
    const runs = [
      run(atKst(TODAY, '23:59'), { promptTokens: 1 }),
      run(atKst('2026-09-21', '00:00'), { promptTokens: 1000 }),
      // UTC 로는 09-19 이지만 KST 로는 09-20 07:00
      run('2026-09-19T22:00:00Z', { promptTokens: 10 }),
    ];
    const today = sumUsage(runs, TODAY, TODAY);
    expect(today.promptTokens).toBe(11);
    expect(today.llmCalls).toBe(2);
  });

  it('7일 창은 today-6 을 포함하고 today-7 은 제외한다', () => {
    const runs = [
      run(atKst('2026-09-14', '19:30'), { promptTokens: 1 }),
      run(atKst('2026-09-13', '19:30'), { promptTokens: 1000 }),
    ];
    const week = sumUsage(runs, windowStart(TODAY, 7), TODAY);
    expect(week.promptTokens).toBe(1);
  });

  it('30일 창은 today-29 을 포함하고 today-30 은 제외한다', () => {
    const runs = [
      run(atKst('2026-08-22', '10:00'), { completionTokens: 7 }),
      run(atKst('2026-08-21', '10:00'), { completionTokens: 7000 }),
    ];
    const month = sumUsage(runs, windowStart(TODAY, 30), TODAY);
    expect(month.completionTokens).toBe(7);
  });

  it('파싱 불가한 startedAt 은 건너뛴다 · 빈 목록은 전부 0', () => {
    expect(sumUsage([run('not-a-date')], TODAY, TODAY).llmCalls).toBe(0);
    const empty = sumUsage([], TODAY, TODAY);
    expect(empty).toEqual({
      llmCalls: 0,
      promptTokens: 0,
      completionTokens: 0,
      reasoningTokens: 0,
      cachedTokens: 0,
      costUsd: 0,
    });
  });
});

describe('summarizeUsage', () => {
  it('세 창이 중첩 누적된다(오늘 ⊂ 7일 ⊂ 30일)', () => {
    const runs = [
      run(atKst(TODAY, '19:30'), { llmCalls: 4 }),
      run(atKst('2026-09-16', '19:30'), { llmCalls: 4 }),
      run(atKst('2026-09-01', '19:30'), { llmCalls: 1 }),
      run(atKst('2026-07-01', '19:30'), { llmCalls: 100 }),
    ];
    const summary = summarizeUsage(runs, TODAY);
    expect(summary.today.llmCalls).toBe(4);
    expect(summary.week.llmCalls).toBe(8);
    expect(summary.month.llmCalls).toBe(9);
  });
});

describe('costUsd 판정', () => {
  it('합이 0 이면 단가 미설정 — number 0·null·빈 문자열 전부', () => {
    const totals = sumUsage(
      [
        run(atKst(TODAY, '09:00'), { costUsd: 0 }),
        run(atKst(TODAY, '10:00'), { costUsd: null }),
        run(atKst(TODAY, '11:00'), { costUsd: '' }),
      ],
      TODAY,
      TODAY,
    );
    expect(totals.costUsd).toBe(0);
    expect(hasCostPricing(totals)).toBe(false);
  });

  it('BigDecimal 문자열도 숫자로 접는다', () => {
    const totals = sumUsage(
      [
        run(atKst(TODAY, '09:00'), { costUsd: '0.0125' }),
        run(atKst(TODAY, '10:00'), { costUsd: 0.0075 }),
      ],
      TODAY,
      TODAY,
    );
    expect(totals.costUsd).toBeCloseTo(0.02, 6);
    expect(hasCostPricing(totals)).toBe(true);
  });

  it('totalTokens 는 입력+출력만 — 추론·캐시는 보조', () => {
    expect(
      totalTokens({
        llmCalls: 1,
        promptTokens: 100,
        completionTokens: 20,
        reasoningTokens: 500,
        cachedTokens: 900,
        costUsd: 0,
      }),
    ).toBe(120);
  });
});

describe('dailyTokenSeries', () => {
  it('같은 KST 날의 run 은 한 버킷에 합쳐지고, 없는 날은 0 으로 채워 길이가 days 다', () => {
    const runs = [
      run(atKst(TODAY, '07:30'), { promptTokens: 10, completionTokens: 1 }),
      run(atKst(TODAY, '19:30'), { promptTokens: 20, completionTokens: 2 }),
      run(atKst('2026-09-18', '19:30'), { promptTokens: 5, completionTokens: 5 }),
    ];
    const series = dailyTokenSeries(runs, TODAY, 3);
    expect(series.map((p) => p.label)).toEqual(['2026-09-18', '2026-09-19', '2026-09-20']);
    expect(series.map((p) => p.value)).toEqual([10, 0, 33]);
  });

  it('창 밖(today 이후·start 이전)은 버린다', () => {
    const runs = [
      run(atKst('2026-09-21', '09:00'), { promptTokens: 999 }),
      run(atKst('2026-09-17', '09:00'), { promptTokens: 999 }),
    ];
    const series = dailyTokenSeries(runs, TODAY, 3);
    expect(series.every((p) => p.value === 0)).toBe(true);
  });

  it('빈 목록도 0 으로 채운 시계열을 돌려준다(스파크라인이 빈 배열을 받으면 "데이터 없음"이 된다)', () => {
    expect(dailyTokenSeries([], TODAY, 30)).toHaveLength(30);
  });
});
