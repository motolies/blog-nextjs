import { describe, expect, it } from 'vitest';
import { readHeader } from './requestHeaders';

describe('readHeader', () => {
  it('Headers 의 get 결과를 그대로 돌려주고, 이름 대소문자는 무시한다', () => {
    const headers = new Headers({ Cookie: 'hvy_access_token=xyz', 'X-Real-IP': '10.0.0.2' });
    expect(readHeader(headers, 'cookie')).toBe('hvy_access_token=xyz');
    expect(readHeader(headers, 'X-Real-IP')).toBe('10.0.0.2');
    expect(readHeader(headers, 'x-real-ip')).toBe('10.0.0.2');
    expect(readHeader(headers, 'x-forwarded-host')).toBeNull();
  });

  it('null/undefined 소스는 null 을 돌려준다', () => {
    expect(readHeader(null, 'cookie')).toBeNull();
    expect(readHeader(undefined, 'cookie')).toBeNull();
  });
});
