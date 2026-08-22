import { describe, expect, it } from 'vitest';
import { GRID_ANONYMOUS_USER, resolveGridUserKey } from './gridUserKey';

describe('resolveGridUserKey', () => {
  it('username 이 있으면 그대로 사용자 축이 된다', () => {
    expect(resolveGridUserKey('knw')).toBe('knw');
  });

  it('프로필 로드 전(undefined)에는 fallback 으로 격리한다 — 기형 키(nx:grid::…) 방지', () => {
    expect(resolveGridUserKey(undefined)).toBe(GRID_ANONYMOUS_USER);
  });

  it('빈 문자열도 fallback 으로 격리한다', () => {
    expect(resolveGridUserKey('')).toBe(GRID_ANONYMOUS_USER);
  });
});
