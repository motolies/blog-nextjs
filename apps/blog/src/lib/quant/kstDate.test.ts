import { describe, expect, it } from 'vitest';
import { isIsoDate, kstDateOf, todayKst } from './kstDate';

describe('todayKst', () => {
  it('UTC 자정 직전은 KST 로 이미 다음 날이다', () => {
    // 2026-09-19T23:30Z = 2026-09-20 08:30 KST
    expect(todayKst(new Date('2026-09-19T23:30:00Z'))).toBe('2026-09-20');
  });

  it('KST 자정 직전은 아직 같은 날이다', () => {
    // 2026-09-20T14:59Z = 2026-09-20 23:59 KST
    expect(todayKst(new Date('2026-09-20T14:59:00Z'))).toBe('2026-09-20');
  });
});

describe('kstDateOf', () => {
  it('Instant 를 KST 날짜로 바꾼다', () => {
    expect(kstDateOf('2026-09-20T09:30:00Z')).toBe('2026-09-20');
    expect(kstDateOf('2026-09-20T15:30:00Z')).toBe('2026-09-21');
  });

  it('빈 값·깨진 값은 null', () => {
    expect(kstDateOf(null)).toBeNull();
    expect(kstDateOf('')).toBeNull();
    expect(kstDateOf('not-a-date')).toBeNull();
  });
});

describe('isIsoDate', () => {
  it('YYYY-MM-DD 만 통과시킨다', () => {
    expect(isIsoDate('2026-09-20')).toBe(true);
    expect(isIsoDate('2026-09-20 00:00')).toBe(false);
    expect(isIsoDate('20260920')).toBe(false);
    expect(isIsoDate(20260920)).toBe(false);
  });

  it('형식은 맞지만 존재하지 않는 날짜는 거른다 — LocalDate 역직렬화 실패는 Slack 을 울린다', () => {
    expect(isIsoDate('2026-02-31')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-04-31')).toBe(false);
    expect(isIsoDate('2026-00-10')).toBe(false);
  });

  it('윤년·월말 경계는 통과한다', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-12-31')).toBe(true);
  });
});
