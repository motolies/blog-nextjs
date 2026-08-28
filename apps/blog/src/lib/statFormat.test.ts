import { describe, expect, it } from 'vitest';
import { formatCompact, formatDelta, formatRelativeTime, truncateMiddle } from './statFormat';

describe('formatDelta', () => {
  it('기준이 0이고 현재가 있으면 "신규" — +∞% 를 만들지 않는다', () => {
    expect(formatDelta(5, 0)).toMatchObject({ kind: 'new', text: '신규' });
  });

  it('둘 다 0이면 변화 없음', () => {
    expect(formatDelta(0, 0)).toMatchObject({ kind: 'flat' });
  });

  it('증가는 + 부호를 붙인다', () => {
    expect(formatDelta(120, 100)).toMatchObject({ kind: 'up', text: '+20%', good: true });
  });

  it('감소는 부호 없이 음수로 표기한다', () => {
    expect(formatDelta(80, 100)).toMatchObject({ kind: 'down', text: '-20%', good: false });
  });

  it('invert 면 감소가 좋은 변화 — 에러 지표용', () => {
    expect(formatDelta(80, 100, { invert: true }).good).toBe(true);
    expect(formatDelta(120, 100, { invert: true }).good).toBe(false);
  });

  it('0.5% 미만 변화는 노이즈로 보고 변화 없음 처리', () => {
    expect(formatDelta(1002, 1000)).toMatchObject({ kind: 'flat' });
  });

  it('10% 미만은 소수 첫째 자리까지 보여준다', () => {
    expect(formatDelta(105, 100).text).toBe('+5.0%');
  });
});

describe('formatCompact', () => {
  it('천 단위는 콤마', () => {
    expect(formatCompact(1234)).toBe('1,234');
  });

  it('만 단위는 축약', () => {
    expect(formatCompact(23456)).toBe('2.3만');
  });

  it('세 자리 이하는 그대로', () => {
    expect(formatCompact(42)).toBe('42');
  });

  it('유한하지 않은 값은 대시', () => {
    expect(formatCompact(Number.NaN)).toBe('—');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-08-28T12:00:00Z');

  it('빈 값은 "기록 없음" — 스케줄러가 한 번도 안 돈 경우', () => {
    expect(formatRelativeTime(null, now)).toBe('기록 없음');
    expect(formatRelativeTime(undefined, now)).toBe('기록 없음');
    expect(formatRelativeTime('', now)).toBe('기록 없음');
  });

  it('파싱 불가한 값도 "기록 없음"', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('기록 없음');
  });

  it('1분 미만은 방금', () => {
    expect(formatRelativeTime('2026-08-28T11:59:30Z', now)).toBe('방금');
  });

  it('분·시간·일 단위를 구분한다', () => {
    expect(formatRelativeTime('2026-08-28T11:30:00Z', now)).toBe('30분 전');
    expect(formatRelativeTime('2026-08-28T09:00:00Z', now)).toBe('3시간 전');
    expect(formatRelativeTime('2026-08-26T12:00:00Z', now)).toBe('2일 전');
  });

  it('미래 시각은 방금으로 처리한다 (시계 오차 방어)', () => {
    expect(formatRelativeTime('2026-08-28T12:05:00Z', now)).toBe('방금');
  });
});

describe('truncateMiddle', () => {
  it('짧으면 그대로', () => {
    expect(truncateMiddle('/api/post', 40)).toBe('/api/post');
  });

  it('길면 가운데를 접어 앞뒤를 모두 남긴다', () => {
    const result = truncateMiddle('/api/very/long/path/that/keeps/going/forever/and/ever', 20);
    expect(result).toHaveLength(20);
    expect(result.startsWith('/api/very/')).toBe(true);
    expect(result.endsWith('and/ever')).toBe(true);
  });
});
