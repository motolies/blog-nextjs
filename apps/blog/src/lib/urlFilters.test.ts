import { describe, expect, it } from 'vitest';
import { pickLogFilters, pickPostFilters } from './urlFilters';

describe('pickPostFilters', () => {
  it('허용 목록에 있는 키만 통과시킨다', () => {
    expect(pickPostFilters('status=TEM&evil=1&hasDraft=true')).toEqual({
      status: 'TEM',
      hasDraft: 'true',
    });
  });

  it('빈 값은 버린다 — 빈 문자열이 검색 조건이 되면 안 된다', () => {
    expect(pickPostFilters('status=&subject=abc')).toEqual({ subject: 'abc' });
  });

  it('쿼리가 없으면 빈 객체', () => {
    expect(pickPostFilters('')).toEqual({});
  });
});

describe('pickLogFilters', () => {
  const fallback = { createdAtFrom: '2026-08-28', createdAtTo: '2026-08-28' };

  it('URL 필터가 없으면 기본값(오늘)을 그대로 쓴다', () => {
    expect(pickLogFilters('', fallback)).toEqual(fallback);
  });

  it('traceId 로 들어오면 날짜 기본값을 걸지 않는다 — 시점을 모르는 조회다', () => {
    expect(pickLogFilters('traceId=abc123', fallback)).toEqual({ traceId: 'abc123' });
  });

  it('URL 이 날짜를 명시하면 그 값을 쓴다', () => {
    expect(pickLogFilters('traceId=abc&createdAtFrom=2026-08-01', fallback)).toEqual({
      traceId: 'abc',
      createdAtFrom: '2026-08-01',
    });
  });
});
