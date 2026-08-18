import { describe, expect, it } from 'vitest';
import { presetRange, toDateTimeRange } from './datePresets';

/** 산식 검증은 경계일 위주다 — 평일은 산수, 경계는 정책이다. */
describe('presetRange', () => {
  const mid = new Date(2026, 7, 20); // 2026-08-20

  it('today — 양끝이 오늘', () => {
    expect(presetRange('today', mid)).toEqual({ start: '2026-08-20', end: '2026-08-20' });
  });

  it('yesterday — 양끝이 어제', () => {
    expect(presetRange('yesterday', mid)).toEqual({ start: '2026-08-19', end: '2026-08-19' });
  });

  it('yesterday — 월초에서 전달 말일로 넘어간다', () => {
    expect(presetRange('yesterday', new Date(2026, 7, 1))).toEqual({
      start: '2026-07-31',
      end: '2026-07-31',
    });
  });

  it('last7 — 오늘 포함 7일', () => {
    expect(presetRange('last7', mid)).toEqual({ start: '2026-08-14', end: '2026-08-20' });
  });

  it('last7 — 월 경계를 넘는다', () => {
    expect(presetRange('last7', new Date(2026, 8, 3))).toEqual({
      start: '2026-08-28',
      end: '2026-09-03',
    });
  });

  it('last30 — 오늘 포함 30일', () => {
    expect(presetRange('last30', mid)).toEqual({ start: '2026-07-22', end: '2026-08-20' });
  });

  it('last30 — 연 경계를 넘는다', () => {
    expect(presetRange('last30', new Date(2026, 0, 5))).toEqual({
      start: '2025-12-07',
      end: '2026-01-05',
    });
  });

  it('thisMonth — 1일 ~ 말일', () => {
    expect(presetRange('thisMonth', mid)).toEqual({ start: '2026-08-01', end: '2026-08-31' });
  });

  it('thisMonth — 윤년 2월 말일은 29일', () => {
    expect(presetRange('thisMonth', new Date(2028, 1, 10))).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    });
  });

  it('thisMonth — 평년 2월 말일은 28일', () => {
    expect(presetRange('thisMonth', new Date(2026, 1, 10))).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
  });

  it('lastMonth — 전달 1일 ~ 말일', () => {
    expect(presetRange('lastMonth', mid)).toEqual({ start: '2026-07-01', end: '2026-07-31' });
  });

  it('lastMonth — 1월에서 전년 12월로 넘어간다', () => {
    expect(presetRange('lastMonth', new Date(2026, 0, 15))).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    });
  });

  // 3/31 의 "전달"이 2월 — 말일 산식이 31일을 2월에 끼워 3/3 으로 밀리면 안 된다.
  it('lastMonth — 말일 길이가 다른 달로 넘어가도 말일이 맞는다', () => {
    expect(presetRange('lastMonth', new Date(2026, 2, 31))).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
  });
});

describe('toDateTimeRange', () => {
  it('날짜만 있으면 하루 전체로 넓힌다 (second)', () => {
    expect(toDateTimeRange({ start: '2026-08-01', end: '2026-08-20' })).toEqual({
      start: '2026-08-01 00:00:00',
      end: '2026-08-20 23:59:59',
    });
  });

  it('minute 정밀도는 초 없이 넓힌다', () => {
    expect(toDateTimeRange({ start: '2026-08-01', end: '2026-08-20' }, 'minute')).toEqual({
      start: '2026-08-01 00:00',
      end: '2026-08-20 23:59',
    });
  });

  it('이미 datetime 인 쪽은 그대로 둔다', () => {
    expect(toDateTimeRange({ start: '2026-08-01 09:00:00', end: '2026-08-20' })).toEqual({
      start: '2026-08-01 09:00:00',
      end: '2026-08-20 23:59:59',
    });
  });

  it('빈값은 빈값으로 둔다 — 반쪽 프리셋을 하루로 오독하지 않는다', () => {
    expect(toDateTimeRange({ start: '', end: '' })).toEqual({ start: '', end: '' });
  });
});
