import { describe, expect, it } from 'vitest';
import { orderRange } from './rangeOrder';

describe('orderRange', () => {
  it('정순이면 그대로 둔다', () => {
    const range = { start: '2026-08-01', end: '2026-08-18' };
    expect(orderRange(range)).toEqual(range);
  });

  it('역순이면 맞바꾼다', () => {
    expect(orderRange({ start: '2026-08-18', end: '2026-08-01' })).toEqual({
      start: '2026-08-01',
      end: '2026-08-18',
    });
  });

  it('같은 날짜는 역순이 아니다', () => {
    const range = { start: '2026-08-01', end: '2026-08-01' };
    expect(orderRange(range)).toEqual(range);
  });

  // 기간을 채워가는 도중(반쪽)을 뒤집으면 사용자가 방금 고른 값이 반대편으로 튄다.
  it('한쪽이 비면 비교하지 않는다', () => {
    expect(orderRange({ start: '2026-08-18', end: '' })).toEqual({ start: '2026-08-18', end: '' });
    expect(orderRange({ start: '', end: '2026-08-01' })).toEqual({ start: '', end: '2026-08-01' });
    expect(orderRange({ start: '', end: '' })).toEqual({ start: '', end: '' });
  });

  // datetime 은 `날짜 공백 시각` 이라 사전순 비교가 그대로 성립한다 — 같은 함수를 공유하는 근거다.
  it('datetime 도 같은 규칙으로 맞바꾼다', () => {
    expect(orderRange({ start: '2026-08-01 13:00:00', end: '2026-08-01 09:30:00' })).toEqual({
      start: '2026-08-01 09:30:00',
      end: '2026-08-01 13:00:00',
    });
  });

  it('같은 날 시각만 다르면 시각으로 판정한다', () => {
    const range = { start: '2026-08-01 09:30:00', end: '2026-08-01 13:00:00' };
    expect(orderRange(range)).toEqual(range);
  });

  it('입력 객체를 변형하지 않는다', () => {
    const range = { start: '2026-08-18', end: '2026-08-01' };
    orderRange(range);
    expect(range).toEqual({ start: '2026-08-18', end: '2026-08-01' });
  });
});
