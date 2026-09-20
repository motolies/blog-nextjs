import { describe, expect, it } from 'vitest';
import { COLLECT_JOB_TYPES } from '../../types/quant';
import {
  BACKFILL_QUEUE_CAPACITY,
  buildTriggerConfirmMessage,
  CHECKPOINT_JOB_TYPES,
  CHECKPOINT_MAX_ATTEMPTS,
  countOccupyingBackfillRuns,
  EMPTY_BACKFILL_FORM,
  forceEffectOf,
  isAttemptsExhausted,
  MAX_TICKERS,
  parseCodeList,
  resolveCheckpointStatus,
  resolveCollectJobType,
  usesCheckpoint,
  validateBackfillForm,
} from './backfillValidation';

const form = (patch: Partial<typeof EMPTY_BACKFILL_FORM>) => ({ ...EMPTY_BACKFILL_FORM, ...patch });

describe('parseCodeList', () => {
  it('줄바꿈·쉼표·공백을 전부 구분자로 보고 대문자화·중복 제거한다', () => {
    expect(parseCodeList('005930\n000660, 035420 a082640\n005930')).toEqual([
      '005930',
      '000660',
      '035420',
      'A082640',
    ]);
  });

  it('빈 문자열·구분자만 있으면 빈 배열', () => {
    expect(parseCodeList('')).toEqual([]);
    expect(parseCodeList(' , \n ')).toEqual([]);
  });
});

describe('validateBackfillForm — 정상', () => {
  it('빈 폼은 빈 요청(전부 기본값)', () => {
    expect(validateBackfillForm(EMPTY_BACKFILL_FORM, 'PRICE_BACKFILL')).toEqual({
      ok: true,
      request: {},
      tickerCount: 0,
    });
  });

  it('채운 필드만 요청에 싣고 boolean 은 true 일 때만 싣는다', () => {
    const result = validateBackfillForm(
      form({
        startDate: '2026-01-01',
        endDate: '2026-09-19',
        tickerFrom: '000020',
        tickerTo: '099999',
        tickers: '005930, 000660',
        indexCodes: '0001 1001',
        resetCheckpoint: true,
        force: false,
      }),
      'PRICE_BACKFILL',
    );
    expect(result).toEqual({
      ok: true,
      tickerCount: 2,
      request: {
        startDate: '2026-01-01',
        endDate: '2026-09-19',
        tickerFrom: '000020',
        tickerTo: '099999',
        tickers: ['005930', '000660'],
        indexCodes: ['0001', '1001'],
        resetCheckpoint: true,
      },
    });
  });

  it('RELOAD 는 tickers 가 있으면 통과', () => {
    const result = validateBackfillForm(form({ tickers: '005930' }), 'RELOAD');
    expect(result.ok).toBe(true);
  });
});

describe('validateBackfillForm — 형식 오류', () => {
  it('종목코드는 6자 영숫자(대문자 정규화 뒤) — 위반 표본을 문구에 싣는다', () => {
    const result = validateBackfillForm(
      form({ tickers: '005930 12345 abcdefg' }),
      'PRICE_BACKFILL',
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errors.tickers).toContain('12345');
      expect(result.errors.tickers).toContain('ABCDEFG');
    }
  });

  it('지수코드는 4자 숫자', () => {
    const result = validateBackfillForm(form({ indexCodes: '0001, 12A4' }), 'INDEX_BACKFILL');
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errors.indexCodes).toContain('12A4');
  });

  it('tickerFrom / tickerTo 형식은 각자 필드에 붙는다', () => {
    const result = validateBackfillForm(
      form({ tickerFrom: '00002', tickerTo: '0999999' }),
      'PRICE_BACKFILL',
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errors.tickerFrom).toBeDefined();
      expect(result.errors.tickerTo).toBeDefined();
    }
  });

  it('날짜는 YYYY-MM-DD', () => {
    const result = validateBackfillForm(form({ startDate: '20260101' }), 'PRICE_BACKFILL');
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errors.startDate).toBeDefined();
  });
});

describe('validateBackfillForm — 한도·순서·필수', () => {
  it('tickers 5000 초과 — 개수 문구, 형식은 보지 않는다', () => {
    const many = Array.from({ length: MAX_TICKERS + 1 }, (_, i) => String(i).padStart(6, '0')).join(
      '\n',
    );
    const result = validateBackfillForm(form({ tickers: many }), 'PRICE_BACKFILL');
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errors.tickers).toContain('5,000');
  });

  it('기간 역전(startDate > endDate) 은 endDate 오류', () => {
    const result = validateBackfillForm(
      form({ startDate: '2026-09-20', endDate: '2026-09-19' }),
      'PRICE_BACKFILL',
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.errors.endDate).toBe('시작일이 종료일보다 늦습니다');
      expect(result.errors.startDate).toBeUndefined();
    }
  });

  it('tickerFrom > tickerTo 는 tickerTo 오류', () => {
    const result = validateBackfillForm(
      form({ tickerFrom: '099999', tickerTo: '000020' }),
      'PRICE_BACKFILL',
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errors.tickerTo).toBe('종목 범위 시작이 끝보다 큽니다');
  });

  it('RELOAD 는 tickers 누락이 오류다 — 다른 잡은 아니다', () => {
    const reload = validateBackfillForm(EMPTY_BACKFILL_FORM, 'RELOAD');
    expect(reload.ok).toBe(false);
    if (reload.ok === false) expect(reload.errors.tickers).toContain('RELOAD');
    expect(validateBackfillForm(EMPTY_BACKFILL_FORM, 'DAILY').ok).toBe(true);
  });

  it('여러 필드 오류를 한 번에 모은다', () => {
    const result = validateBackfillForm(
      form({ startDate: '2026-09-20', endDate: '2026-09-19', indexCodes: 'xx', tickerFrom: '1' }),
      'PRICE_BACKFILL',
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(Object.keys(result.errors).sort()).toEqual(['endDate', 'indexCodes', 'tickerFrom']);
    }
  });
});

describe('URL 값 해석', () => {
  it('잡·상태는 허용 목록 밖이면 null', () => {
    expect(resolveCollectJobType('RELOAD')).toBe('RELOAD');
    expect(resolveCollectJobType('nope')).toBeNull();
    expect(resolveCollectJobType(null)).toBeNull();
    expect(resolveCheckpointStatus('FAILED')).toBe('FAILED');
    expect(resolveCheckpointStatus('SUCCESS')).toBeNull();
  });
});

describe('체크포인트 판정', () => {
  it('CHECKPOINT_JOB_TYPES 는 전부 실제 잡 유형이다', () => {
    for (const jobType of CHECKPOINT_JOB_TYPES) {
      expect(COLLECT_JOB_TYPES).toContain(jobType);
    }
    expect(usesCheckpoint('PRICE_BACKFILL')).toBe(true);
    expect(usesCheckpoint('MASTER')).toBe(false);
  });

  it('attemptCount 임계(5) 이상은 재개 제외', () => {
    expect(isAttemptsExhausted(CHECKPOINT_MAX_ATTEMPTS - 1)).toBe(false);
    expect(isAttemptsExhausted(CHECKPOINT_MAX_ATTEMPTS)).toBe(true);
  });

  it('force 효과는 DAILY·DERIVED_REFRESH 만', () => {
    expect(forceEffectOf('DAILY')).toContain('휴장일');
    expect(forceEffectOf('DERIVED_REFRESH')).toContain('전체');
    expect(forceEffectOf('PRICE_BACKFILL')).toBeNull();
  });
});

describe('countOccupyingBackfillRuns', () => {
  const run = (patch: {
    runId: number;
    jobType: (typeof COLLECT_JOB_TYPES)[number];
    status: 'RUNNING' | 'SUCCESS';
    triggerType: 'API' | 'SCHEDULER';
  }) => ({ jobDescription: patch.jobType, ...patch });

  it('API 트리거 longRunning RUNNING 만 실행기를 점유하고, 전부 센다', () => {
    // startedAt DESC 입력 — 뒤가 오래된 run
    const runs = [
      run({ runId: 6, jobType: 'INVESTOR_BACKFILL', status: 'RUNNING', triggerType: 'API' }),
      run({ runId: 5, jobType: 'ETF_NAV_BACKFILL', status: 'RUNNING', triggerType: 'API' }),
      run({ runId: 1, jobType: 'DAILY', status: 'RUNNING', triggerType: 'SCHEDULER' }),
      run({ runId: 2, jobType: 'MASTER', status: 'RUNNING', triggerType: 'API' }),
      run({ runId: 3, jobType: 'PRICE_BACKFILL', status: 'SUCCESS', triggerType: 'API' }),
      run({ runId: 4, jobType: 'PRICE_BACKFILL', status: 'RUNNING', triggerType: 'API' }),
    ];
    const occupancy = countOccupyingBackfillRuns(runs);
    expect(occupancy.total).toBe(3);
    expect(occupancy.queued).toBe(2);
    // 가장 오래된(마지막) 점유 run 이 실제 실행 중
    expect(occupancy.executing?.runId).toBe(4);
  });

  it('점유 run 이 없으면 비어 있다', () => {
    expect(countOccupyingBackfillRuns(undefined)).toEqual({ executing: null, queued: 0, total: 0 });
    const runs = [run({ runId: 1, jobType: 'DAILY', status: 'RUNNING', triggerType: 'SCHEDULER' })];
    expect(countOccupyingBackfillRuns(runs).total).toBe(0);
  });
});

describe('buildTriggerConfirmMessage', () => {
  it('202 잡 — 인자 요약·대기열(실행 1 · 대기 n/10)·소요·reset/force 경고를 한 문장으로 잇는다', () => {
    const message = buildTriggerConfirmMessage({
      jobType: 'DAILY',
      request: { startDate: '2026-09-01', resetCheckpoint: true, force: true },
      occupancy: {
        executing: { runId: 1202, jobDescription: '종목 일봉 백필' },
        queued: 2,
        total: 3,
      },
    });
    expect(message).toContain('일일 증분 수집 (DAILY) 을 실행합니다');
    expect(message).toContain('기간 2026-09-01~오늘');
    expect(message).toContain('백그라운드(202)');
    expect(message).toContain('약 20~25분');
    expect(message).toContain('run #1202 실행 중 · 대기 2/10');
    expect(message).toContain('대기열 3번째');
    expect(message).toContain('체크포인트를 초기화');
    expect(message).toContain('휴장일 스킵 해제');
    expect(message).toContain('오늘(KST) 기준 증분');
    expect(BACKFILL_QUEUE_CAPACITY).toBe(10);
  });

  it('200 잡 — 동기 안내, 경고 없음, 실행기 점유가 있어도 대기열 문구 없음', () => {
    const message = buildTriggerConfirmMessage({
      jobType: 'MASTER',
      request: {},
      occupancy: { executing: { runId: 1, jobDescription: 'x' }, queued: 0, total: 1 },
    });
    expect(message).toContain('동기(200)');
    expect(message).toContain('인자 없음(기본값)');
    expect(message).not.toContain('주의:');
    expect(message).not.toContain('대기');
  });
});
