import { describe, expect, it } from 'vitest';
import {
  abbreviateDate,
  abbreviateDateTime,
  commitRangeSide,
  footerAction,
  initialEditingSide,
  selectRangeDate,
} from './rangeFlow';

describe('initialEditingSide', () => {
  it('시작이 비었으면 시작부터', () => {
    expect(initialEditingSide({ start: '', end: '' })).toBe('start');
    expect(initialEditingSide({ start: '', end: '2026-09-02 23:59' })).toBe('start');
  });

  it('시작만 있으면 다음 빈칸인 종료로', () => {
    expect(initialEditingSide({ start: '2026-09-02 00:00', end: '' })).toBe('end');
  });

  it('둘 다 있으면 처음(시작)부터', () => {
    expect(initialEditingSide({ start: '2026-09-01 00:00', end: '2026-09-02 23:59' })).toBe(
      'start',
    );
  });
});

describe('commitRangeSide', () => {
  const range = { start: '2026-09-01 00:00', end: '2026-09-02 23:59' };

  it('순서가 유지되면 커밋한 쪽이 편집 쪽이다', () => {
    expect(commitRangeSide(range, 'end', '2026-09-03 12:00')).toEqual({
      range: { start: '2026-09-01 00:00', end: '2026-09-03 12:00' },
      editing: 'end',
    });
  });

  it('맞바뀌면 편집 쪽도 값을 따라 반대로 옮긴다 — 다음 시·분 클릭이 방금 고른 값을 고쳐야 한다', () => {
    expect(commitRangeSide(range, 'start', '2026-09-05 09:00')).toEqual({
      range: { start: '2026-09-02 23:59', end: '2026-09-05 09:00' },
      editing: 'end',
    });
    expect(commitRangeSide(range, 'end', '2026-08-20 09:00')).toEqual({
      range: { start: '2026-08-20 09:00', end: '2026-09-01 00:00' },
      editing: 'start',
    });
  });

  it('반쪽 상태(한쪽 빈값)는 비교하지 않으므로 맞바꾸지 않는다', () => {
    expect(commitRangeSide({ start: '', end: '' }, 'start', '2026-09-05 09:00')).toEqual({
      range: { start: '2026-09-05 09:00', end: '' },
      editing: 'start',
    });
  });

  it('빈 문자열 커밋(지우기)도 같은 통로를 지난다', () => {
    expect(commitRangeSide(range, 'end', '')).toEqual({
      range: { start: '2026-09-01 00:00', end: '' },
      editing: 'end',
    });
  });
});

describe('selectRangeDate — 날짜 범위의 달력 클릭', () => {
  it('반대쪽이 비어 있으면 그쪽으로 넘어가고 닫지 않는다 — 반쪽 상태는 정렬하지 않는다', () => {
    expect(selectRangeDate({ start: '', end: '' }, 'start', '2026-09-20')).toEqual({
      range: { start: '2026-09-20', end: '' },
      editing: 'end',
      close: false,
    });
    // 종료부터 골라 시작보다 뒤여도 아직 비교 대상이 없다
    expect(selectRangeDate({ start: '', end: '' }, 'end', '2026-09-01')).toEqual({
      range: { start: '', end: '2026-09-01' },
      editing: 'start',
      close: false,
    });
  });

  it('반대쪽이 있으면 정렬해 확정하고 닫는다 — 뒤집히면 맞바꾸고 편집 쪽도 따라간다', () => {
    expect(
      selectRangeDate({ start: '2026-09-01', end: '2026-09-10' }, 'end', '2026-09-20'),
    ).toEqual({
      range: { start: '2026-09-01', end: '2026-09-20' },
      editing: 'end',
      close: true,
    });
    expect(
      selectRangeDate({ start: '2026-09-01', end: '2026-09-10' }, 'start', '2026-09-25'),
    ).toEqual({
      range: { start: '2026-09-10', end: '2026-09-25' },
      editing: 'end',
      close: true,
    });
  });
});

describe('abbreviateDate', () => {
  it('연도를 뺀 MM-DD, 형식 불량은 빈 문자열', () => {
    expect(abbreviateDate('2026-09-02')).toBe('09-02');
    expect(abbreviateDate('')).toBe('');
    expect(abbreviateDate('2026-09-02 13:45')).toBe('');
  });
});

describe('footerAction', () => {
  it('시작을 고치는 중이고 종료가 비었으면 다음(종료로 넘어감)', () => {
    expect(footerAction('start', { start: '2026-09-01 00:00', end: '' })).toBe('next');
  });

  it('그 외엔 확인(닫기) — 종료 편집 중이거나 둘 다 채워졌을 때', () => {
    expect(footerAction('end', { start: '2026-09-01 00:00', end: '' })).toBe('confirm');
    expect(footerAction('start', { start: '2026-09-01 00:00', end: '2026-09-02 23:59' })).toBe(
      'confirm',
    );
  });
});

describe('abbreviateDateTime', () => {
  it('연도와 초를 뺀 MM-DD HH:mm — 두 정밀도 모두', () => {
    expect(abbreviateDateTime('2026-09-02 13:45')).toBe('09-02 13:45');
    expect(abbreviateDateTime('2026-09-02 13:45:30')).toBe('09-02 13:45');
  });

  it('빈값·형식 불량은 빈 문자열', () => {
    expect(abbreviateDateTime('')).toBe('');
    expect(abbreviateDateTime('2026-09-02')).toBe('');
  });
});
