import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { conflictOf, failMessageOf, isNotFound } from './apiOutcome';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('failed', String(status), config, undefined, response);
}

describe('conflictOf', () => {
  it('409 FAIL 봉투의 data.runningRunId 를 문자열로 꺼낸다', () => {
    const error = axiosErrorWith(409, {
      status: 'FAIL',
      message: 'DAILY 가 이미 실행 중',
      data: { jobType: 'DAILY', runningRunId: '1230' },
    });
    expect(conflictOf(error)).toEqual({ jobType: 'DAILY', runningRunId: '1230' });
  });

  it('숫자로 와도 문자열로 정규화한다', () => {
    const error = axiosErrorWith(409, { status: 'FAIL', data: { runningRunId: 7 } });
    expect(conflictOf(error)).toEqual({ jobType: null, runningRunId: '7' });
  });

  it('409 가 아니거나 data 가 없으면 null', () => {
    expect(conflictOf(axiosErrorWith(400, { status: 'FAIL', message: 'x' }))).toBeNull();
    expect(conflictOf(axiosErrorWith(409, { status: 'FAIL', data: [] }))).toBeNull();
    expect(conflictOf(new Error('plain'))).toBeNull();
  });
});

describe('isNotFound / failMessageOf', () => {
  it('404 판정', () => {
    expect(isNotFound(axiosErrorWith(404, null))).toBe(true);
    expect(isNotFound(axiosErrorWith(500, null))).toBe(false);
    expect(isNotFound(new Error('x'))).toBe(false);
  });

  it('실패 봉투 message 를 돌려주고 없으면 null', () => {
    expect(
      failMessageOf(
        axiosErrorWith(400, { status: 'FAIL', message: 'tickers 는 최대 5000개입니다' }),
      ),
    ).toBe('tickers 는 최대 5000개입니다');
    expect(failMessageOf(axiosErrorWith(500, 'oops'))).toBeNull();
    expect(failMessageOf(new Error('x'))).toBeNull();
  });
});
