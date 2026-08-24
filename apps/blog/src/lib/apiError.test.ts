import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorTraceId } from './apiError';

const TRACE_ID = 'aabbccddeeff00112233445566778899';
const SPAN_ID = '1122334455667788';
const TRACEPARENT = `00-${TRACE_ID}-${SPAN_ID}-01`;

// axiosClient 요청 인터셉터가 `config.headers.traceparent = …` 로 싣는 형태를 그대로 재현한다
function axiosErrorWithHeaders(headers: Record<string, string>): AxiosError {
  const config = { headers: new AxiosHeaders(headers) } as InternalAxiosRequestConfig;
  return new AxiosError('Request failed with status code 500', 'ERR_BAD_RESPONSE', config);
}

describe('getApiErrorTraceId', () => {
  it('AxiosError 의 요청 헤더 traceparent 에서 traceId 를 꺼낸다', () => {
    expect(getApiErrorTraceId(axiosErrorWithHeaders({ traceparent: TRACEPARENT }))).toBe(TRACE_ID);
  });

  it('traceparent 헤더가 없으면 undefined 를 반환한다', () => {
    expect(getApiErrorTraceId(axiosErrorWithHeaders({}))).toBeUndefined();
  });

  it('traceparent 형식이 어긋나면 undefined 를 반환한다', () => {
    expect(getApiErrorTraceId(axiosErrorWithHeaders({ traceparent: 'garbage' }))).toBeUndefined();
  });

  it('config 가 없는 AxiosError(네트워크 단절 등)도 안전하게 undefined 를 반환한다', () => {
    expect(getApiErrorTraceId(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeUndefined();
  });

  it('AxiosError 가 아니면 undefined 를 반환한다', () => {
    expect(getApiErrorTraceId(new Error('local failure'))).toBeUndefined();
    expect(getApiErrorTraceId(undefined)).toBeUndefined();
    expect(getApiErrorTraceId(null)).toBeUndefined();
    expect(getApiErrorTraceId('string error')).toBeUndefined();
  });
});
