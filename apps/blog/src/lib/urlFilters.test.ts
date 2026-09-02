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

  it('URL 이 날짜를 명시하면 그 값을 쓴다 — 일시 계약으로 넓혀서', () => {
    expect(pickLogFilters('traceId=abc&createdAtFrom=2026-08-01', fallback)).toEqual({
      traceId: 'abc',
      createdAtFrom: '2026-08-01 00:00',
    });
  });
});

/**
 * 기간 필터가 일시로 올라가기 전에 만들어진 링크가 북마크에 남아 있을 수 있다 —
 * 그 링크가 예전과 같은 구간을 조회해야 한다.
 */
describe('날짜만 있는 URL 하위호환', () => {
  it('날짜만 온 값을 하루 전체로 넓힌다', () => {
    expect(pickLogFilters('createdAtFrom=2026-08-01&createdAtTo=2026-08-20', {})).toEqual({
      createdAtFrom: '2026-08-01 00:00',
      createdAtTo: '2026-08-20 23:59',
    });
  });

  it('한쪽만 온 값은 한쪽만 넓힌다 — 없던 조건을 만들지 않는다', () => {
    expect(pickLogFilters('createdAtFrom=2026-08-01', {})).toEqual({
      createdAtFrom: '2026-08-01 00:00',
    });
  });

  it('이미 시각이 붙은 값은 분까지만 남긴다 — 양식이 분 정밀도다', () => {
    expect(pickLogFilters('createdAtFrom=2026-08-01 09:30:00', {})).toEqual({
      createdAtFrom: '2026-08-01 09:30',
    });
  });

  it('posts 의 옛 작성일 키는 기준일 구간(dateFrom/dateTo)으로 옮긴다', () => {
    expect(pickPostFilters('status=TEM&createdAtTo=2026-08-20')).toEqual({
      status: 'TEM',
      dateTo: '2026-08-20 23:59',
    });
  });

  it('posts 의 새 키가 옛 키를 이기고, 기준일은 허용값만 통과한다', () => {
    expect(
      pickPostFilters('dateField=updatedAt&dateFrom=2026-08-01&createdAtFrom=2026-01-01'),
    ).toEqual({ dateField: 'updatedAt', dateFrom: '2026-08-01 00:00' });
    expect(pickPostFilters('dateField=evil&dateTo=2026-08-20')).toEqual({
      dateTo: '2026-08-20 23:59',
    });
  });
});
