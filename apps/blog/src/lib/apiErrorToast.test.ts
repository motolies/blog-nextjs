import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// @hvy/ui 는 React 컴포넌트까지 끌고 오므로 스토어 대신 showToast 호출 인자만 검증한다
const showToast = vi.fn();
vi.mock('@hvy/ui', () => ({ showToast: (...args: unknown[]) => showToast(...args) }));

const { showApiErrorToast } = await import('./apiErrorToast');

const TRACE_ID = 'aabbccddeeff00112233445566778899';
const TRACEPARENT = `00-${TRACE_ID}-1122334455667788-01`;

function axiosErrorWithTraceparent(traceparent?: string): AxiosError {
  const config = {
    headers: new AxiosHeaders(traceparent ? { traceparent } : {}),
  } as InternalAxiosRequestConfig;
  return new AxiosError('Request failed with status code 500', 'ERR_BAD_RESPONSE', config);
}

describe('showApiErrorToast', () => {
  beforeEach(() => showToast.mockClear());

  it('traceId 가 있으면 앞 8자 제목·복사 액션·연장된 표시 시간으로 띄운다', () => {
    showApiErrorToast('데이터를 불러오지 못했습니다.', axiosErrorWithTraceparent(TRACEPARENT));

    expect(showToast).toHaveBeenCalledTimes(1);
    const [message, tone, options] = showToast.mock.calls[0];
    expect(message).toBe('데이터를 불러오지 못했습니다.');
    expect(tone).toBe('error');
    expect(options.title).toBe(`trace ${TRACE_ID.slice(0, 8)}`);
    expect(options.action.label).toBe('traceId 복사');
    expect(options.durationMs).toBe(8000);
  });

  it('복사 액션은 traceId 전체를 클립보드에 쓴다', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    try {
      showApiErrorToast('실패', axiosErrorWithTraceparent(TRACEPARENT));
      showToast.mock.calls[0][2].action.onClick();
      expect(writeText).toHaveBeenCalledWith(TRACE_ID);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('traceparent 가 없는 AxiosError 는 일반 오류 토스트로 띄운다', () => {
    showApiErrorToast('실패', axiosErrorWithTraceparent());
    expect(showToast).toHaveBeenCalledWith('실패', 'error');
  });

  it('AxiosError 가 아니거나 error 를 생략하면 일반 오류 토스트로 띄운다', () => {
    showApiErrorToast('실패', new Error('local'));
    showApiErrorToast('실패');
    expect(showToast).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenNthCalledWith(1, '실패', 'error');
    expect(showToast).toHaveBeenNthCalledWith(2, '실패', 'error');
  });
});
