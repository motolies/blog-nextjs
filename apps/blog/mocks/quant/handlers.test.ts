import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { handlers } from '../handlers';
import { resetQuantMockState } from './handlers';

/**
 * Quant 목의 상태 기계 검증 — 409·202/200·취소·필터·게이트·advisor 404 토글.
 * 전체 `handlers` 배열로 서버를 띄운다 — 등록 순서(reload/cancel 이 :jobType 보다 위)까지 함께 검증된다.
 */
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetQuantMockState());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const BASE = 'https://mock-backend.test';
const STOCK = `${BASE}/api/stock/admin/collect`;
const ADVISOR = `${BASE}/api/advisor/admin`;

async function post(url: string, body?: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('stats health', () => {
  it('스케줄러 20행 중 stock 7행(eventfeed am/pm 포함)·advisor 8행에 manualTrigger 가 있다', async () => {
    const json = await (await fetch(`${BASE}/api/stats/admin/health`)).json();
    const schedulers = json.data.schedulers as { manualTrigger: { module: string } | null }[];
    expect(schedulers).toHaveLength(20);
    const withTrigger = schedulers.filter((s) => s.manualTrigger !== null);
    expect(withTrigger).toHaveLength(15);
    expect(withTrigger.filter((s) => s.manualTrigger?.module === 'STOCK')).toHaveLength(7);
    expect(withTrigger.filter((s) => s.manualTrigger?.module === 'ADVISOR')).toHaveLength(8);
  });
});

describe('stock 트리거', () => {
  it('RUNNING 인 PRICE_BACKFILL 을 다시 부르면 409 + data.runningRunId 문자열', async () => {
    const response = await post(`${STOCK}/PRICE_BACKFILL`, {});
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.status).toBe('FAIL');
    expect(json.data).toEqual({ jobType: 'PRICE_BACKFILL', runningRunId: '1202' });
  });

  it('longRunning 잡은 202 RUNNING, 두 번째는 409 로 새 run 을 가리킨다', async () => {
    const first = await post(`${STOCK}/DAILY`, {});
    expect(first.status).toBe(202);
    const run = (await first.json()).data;
    expect(run.status).toBe('RUNNING');
    expect(run.triggerType).toBe('API');

    const second = await post(`${STOCK}/DAILY`, {});
    expect(second.status).toBe(409);
    expect((await second.json()).data.runningRunId).toBe(String(run.runId));
  });

  it('MASTER 는 200 + SUCCESS 로 즉시 끝난다', async () => {
    const response = await post(`${STOCK}/MASTER`);
    expect(response.status).toBe(200);
    expect((await response.json()).data.status).toBe('SUCCESS');
  });

  it('metadata 는 toMetadata 규칙 — tickers 20개 절단 + tickerCount', async () => {
    const tickers = Array.from({ length: 25 }, (_, i) => String(i).padStart(6, '0'));
    const response = await post(`${STOCK}/RELOAD`, { tickers, startDate: '2026-09-01' });
    expect(response.status).toBe(202);
    const meta = (await response.json()).data.metadata;
    expect(meta.tickerCount).toBe(25);
    expect(meta.tickers).toHaveLength(20);
    expect(meta.startDate).toBe('2026-09-01');
  });

  it('모르는 잡 유형은 400, RELOAD 는 tickers 필수', async () => {
    expect((await post(`${STOCK}/NOPE`, {})).status).toBe(400);
    expect((await post(`${STOCK}/RELOAD`, {})).status).toBe(400);
  });
});

describe('stock 취소·조회', () => {
  it('RUNNING run 취소 → CANCELED, 종료 run 은 그대로', async () => {
    const canceled = (await (await post(`${STOCK}/runs/1202/cancel`)).json()).data;
    expect(canceled.status).toBe('CANCELED');
    expect(canceled.finishedAt).not.toBeNull();

    const untouched = (await (await post(`${STOCK}/runs/1201/cancel`)).json()).data;
    expect(untouched.status).toBe('FAILED');
  });

  it('runs 필터 — jobType·status·from/to·limit', async () => {
    const failed = (await (await fetch(`${STOCK}/runs?jobType=DAILY&status=FAILED`)).json()).data;
    expect(failed.length).toBeGreaterThan(0);
    for (const run of failed) {
      expect(run.jobType).toBe('DAILY');
      expect(run.status).toBe('FAILED');
    }
    const limited = (await (await fetch(`${STOCK}/runs?limit=3`)).json()).data;
    expect(limited).toHaveLength(3);
    // startedAt DESC
    expect(limited[0].startedAt >= limited[2].startedAt).toBe(true);
  });

  it('없는 run 은 404 실패 봉투', async () => {
    const response = await fetch(`${STOCK}/runs/999999`);
    expect(response.status).toBe(404);
    expect((await response.json()).status).toBe('FAIL');
  });

  it('체크포인트 summary·목록은 PRICE_BACKFILL 만 채워져 있다', async () => {
    const summary = (
      await (await fetch(`${STOCK}/checkpoints/summary?jobType=PRICE_BACKFILL`)).json()
    ).data;
    expect(summary.DONE).toBeGreaterThan(0);
    const rows = (
      await (await fetch(`${STOCK}/checkpoints?jobType=PRICE_BACKFILL&status=FAILED`)).json()
    ).data;
    expect(rows).toHaveLength(1);
    expect(rows[0].attemptCount).toBe(5);
  });
});

describe('advisor', () => {
  it('게이트는 오늘 ready:false 이고 사유가 DAILY 단계 실패다', async () => {
    const gate = (await (await fetch(`${ADVISOR}/gate`)).json()).data;
    expect(gate.ready).toBe(false);
    expect(gate.dataReady).toBe(false);
    expect(gate.reason).toContain('DAILY');
  });

  it('ADVISE 트리거는 202 RUNNING 으로 시작한다(게이트 불통은 잠시 뒤 SKIPPED)', async () => {
    const response = await post(`${ADVISOR}/jobs/ADVISE`);
    expect(response.status).toBe(202);
    const run = (await response.json()).data;
    expect(run.status).toBe('RUNNING');
    expect(run.metadata.requested).toBe(false);
  });

  it('baseDate 를 주면 requested:true 로 남는다', async () => {
    const run = (await (await post(`${ADVISOR}/jobs/SCORE?baseDate=2026-09-01`)).json()).data;
    expect(run.baseDate).toBe('2026-09-01');
    expect(run.metadata.requested).toBe(true);
  });

  it('오늘 LIVE 판단은 없고 어제는 있다', async () => {
    const todayLive = (await (await fetch(`${ADVISOR}/advices?variant=LIVE&limit=50`)).json()).data;
    const today = (await (await fetch(`${ADVISOR}/gate`)).json()).data.baseDate as string;
    expect(todayLive.some((a: { baseDate: string }) => a.baseDate === today)).toBe(false);
    expect(todayLive.length).toBeGreaterThan(0);
  });

  it('horizon 은 IC_BACKFILL 에만, IC 대상 호라이즌만 받는다(백엔드 400 과 같다)', async () => {
    const ok = await post(`${ADVISOR}/jobs/IC_BACKFILL?horizon=20`);
    expect(ok.status).toBe(202);
    expect((await ok.json()).data.metadata.horizon).toBe(20);
    expect((await post(`${ADVISOR}/jobs/ADVISE_H20?horizon=20`)).status).toBe(400);
    expect((await post(`${ADVISOR}/jobs/IC_BACKFILL?horizon=7`)).status).toBe(400);
  });

  it('판단 목록은 kind 로 나뉜다 — 생략하면 DAILY, 모르는 값은 400', async () => {
    const daily = (await (await fetch(`${ADVISOR}/advices?limit=100`)).json()).data;
    expect(daily.every((a: { adviceKind: string }) => a.adviceKind === 'DAILY')).toBe(true);
    const morning = (await (await fetch(`${ADVISOR}/advices?kind=MORNING`)).json()).data;
    expect(morning).toHaveLength(1);
    expect(morning[0].diffJson.drop).toHaveLength(1);
    expect((await fetch(`${ADVISOR}/advices?kind=WEEKLY`)).status).toBe(400);
  });

  it('H60 요약은 판정 불가 라벨을 싣고 호라이즌은 60 이다', async () => {
    const summary = (await (await fetch(`${ADVISOR}/scores/summary?kind=H60`)).json()).data;
    expect(summary.horizonDays).toBe(60);
    expect(summary.variants[0].verdictLabel).toContain('판정 불가');
    const daily = (await (await fetch(`${ADVISOR}/scores/summary`)).json()).data;
    expect(daily.variants[0].verdictLabel).toBeNull();
  });

  it('가중치 세트는 호라이즌별로 활성 1개', async () => {
    const h20 = (await (await fetch(`${ADVISOR}/weights/sets?horizon=20`)).json()).data;
    expect(h20).toHaveLength(1);
    expect(h20[0].active).toBe(true);
    const h60 = (await (await fetch(`${ADVISOR}/weights/sets?horizon=60`)).json()).data;
    expect(h60).toHaveLength(0);
  });

  it('MOCK_ADVISOR_DISABLED=true 면 advisor 전체가 404', async () => {
    const previous = process.env.MOCK_ADVISOR_DISABLED;
    process.env.MOCK_ADVISOR_DISABLED = 'true';
    try {
      expect((await fetch(`${ADVISOR}/runs`)).status).toBe(404);
      expect((await fetch(`${ADVISOR}/gate`)).status).toBe(404);
      expect((await post(`${ADVISOR}/jobs/ADVISE`)).status).toBe(404);
    } finally {
      if (previous === undefined) delete process.env.MOCK_ADVISOR_DISABLED;
      else process.env.MOCK_ADVISOR_DISABLED = previous;
    }
  });
});

describe('결정론', () => {
  it('같은 조회 2회는 같은 응답 (상태 변이 없이)', async () => {
    const first = await (await fetch(`${STOCK}/runs?limit=10`)).json();
    const second = await (await fetch(`${STOCK}/runs?limit=10`)).json();
    expect(second).toEqual(first);
  });
});
