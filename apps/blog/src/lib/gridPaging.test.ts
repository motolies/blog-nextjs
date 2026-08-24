import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, resolvePageSize } from './gridPaging';

describe('resolvePageSize', () => {
  it('저장값이 없으면(레거시 JSON·첫 방문) 기본값이다', () => {
    expect(resolvePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(undefined)).toBe(10);
  });

  it('허용 목록 안의 저장값은 그대로 쓴다', () => {
    expect(resolvePageSize(20)).toBe(20);
    for (const option of PAGE_SIZE_OPTIONS) {
      expect(resolvePageSize(option)).toBe(option);
    }
  });

  it('목록 밖 값은 가까운 값으로 붙이지 않고 기본값으로 떨어진다 — 옵션에서 빠진 25 포함', () => {
    expect(resolvePageSize(25)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(100000)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(0)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(-10)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(Number.NaN)).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('페이지 크기 계약', () => {
  it('기본값은 허용 목록의 원소다 — 타입으로도 묶여 있지만 런타임 값도 확인한다', () => {
    expect(PAGE_SIZE_OPTIONS).toContain(DEFAULT_PAGE_SIZE);
  });

  it('선택지는 10·20·50·100 — 25 는 제거됐다', () => {
    expect([...PAGE_SIZE_OPTIONS]).toEqual([10, 20, 50, 100]);
  });
});
