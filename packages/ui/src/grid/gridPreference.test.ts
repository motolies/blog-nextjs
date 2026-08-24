import { describe, expect, it } from 'vitest';
import type { GridPreference } from './columns';
import {
  emptyPreference,
  PREFERENCE_VERSION,
  parsePreference,
  resetColumnPreference,
  toPageSize,
  withPageSize,
} from './gridPreference';

/** 컬럼 설정이 들어 있는 "저장된 적 있는" 사용자 — 아래 케이스가 이 값을 바탕으로 변주한다. */
const SAVED: GridPreference = {
  version: 1,
  widths: { a: 120, b: 200 },
  hidden: ['b'],
  order: ['a', 'b', 'c'],
};

/** pageSize 만 바꿔 넣은 JSON 원문 — `toPageSize` 가 항목 단위로 떨어뜨리는지 볼 때 쓴다. */
const withRawPageSize = (pageSize: string) =>
  `{"version":1,"widths":{"a":120,"b":200},"hidden":["b"],"order":["a","b","c"],"pageSize":${pageSize}}`;

describe('parsePreference', () => {
  it('전체 JSON(pageSize 포함)은 전 필드를 그대로 읽는다', () => {
    expect(parsePreference(JSON.stringify({ ...SAVED, pageSize: 20 }))).toEqual({
      ...SAVED,
      pageSize: 20,
    });
  });

  it('레거시 JSON(pageSize 없음)은 pageSize 키 없이 로드된다 — version 을 올리지 않은 이유', () => {
    const result = parsePreference(JSON.stringify(SAVED));
    expect(result).toEqual(SAVED);
    expect(result).not.toHaveProperty('pageSize');
  });

  it('pageSize 가 불량이면 그 항목만 떨어뜨리고 컬럼 설정은 유지한다', () => {
    for (const raw of ['0', '-1', '1.5', '"20"', 'null']) {
      const result = parsePreference(withRawPageSize(raw));
      expect(result, `pageSize=${raw}`).toEqual(SAVED);
      expect(result, `pageSize=${raw}`).not.toHaveProperty('pageSize');
    }
  });

  it('pageSize 가 NaN 이어도 컬럼 설정은 유지한다', () => {
    // JSON 에 NaN 은 없다 — parse 결과를 흉내 내려면 toPageSize 를 직접 본다.
    expect(toPageSize(Number.NaN)).toBeUndefined();
    expect(toPageSize(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it('version 이 다르면 전부 폐기한다 — 컬럼 스키마가 이미 바뀐 뒤다', () => {
    expect(parsePreference(JSON.stringify({ ...SAVED, version: 2, pageSize: 20 }))).toBeNull();
  });

  it('깨진 JSON·빈 값·객체가 아닌 값은 null', () => {
    expect(parsePreference('{not json')).toBeNull();
    expect(parsePreference('')).toBeNull();
    expect(parsePreference(null)).toBeNull();
    expect(parsePreference('[]')).toBeNull();
    expect(parsePreference('1')).toBeNull();
    expect(parsePreference('null')).toBeNull();
  });

  it('widths 는 양수만 받는다 — 0·음수가 섞이면 컬럼이 사라진 표가 된다', () => {
    const result = parsePreference(
      JSON.stringify({ version: 1, widths: { a: 120, b: 0, c: -5, d: '80', e: null } }),
    );
    expect(result?.widths).toEqual({ a: 120 });
  });

  it('hidden·order 는 문자열만 남긴다', () => {
    const result = parsePreference(
      JSON.stringify({ version: 1, hidden: ['a', 1, null], order: ['b', {}, 'c'] }),
    );
    expect(result?.hidden).toEqual(['a']);
    expect(result?.order).toEqual(['b', 'c']);
  });

  it('widths·hidden·order 가 없거나 형식이 틀리면 빈 값으로 채운다', () => {
    expect(parsePreference(JSON.stringify({ version: 1 }))).toEqual(emptyPreference());
    expect(
      parsePreference(JSON.stringify({ version: 1, widths: 'x', hidden: 'y', order: 3 })),
    ).toEqual(emptyPreference());
  });
});

describe('toPageSize', () => {
  it('양의 정수만 통과한다', () => {
    expect(toPageSize(10)).toBe(10);
    expect(toPageSize(100000)).toBe(100000);
    expect(toPageSize(0)).toBeUndefined();
    expect(toPageSize(-1)).toBeUndefined();
    expect(toPageSize(1.5)).toBeUndefined();
    expect(toPageSize('20')).toBeUndefined();
    expect(toPageSize(null)).toBeUndefined();
    expect(toPageSize(undefined)).toBeUndefined();
  });
});

describe('withPageSize', () => {
  it('이전 값(폭·숨김·순서)을 보존하고 pageSize 만 얹는다', () => {
    expect(withPageSize(SAVED, 50)).toEqual({ ...SAVED, pageSize: 50 });
  });

  it('이전 값을 덮어쓴다', () => {
    expect(withPageSize({ ...SAVED, pageSize: 20 }, 50).pageSize).toBe(50);
  });

  it('저장된 것이 없으면 빈 설정 + pageSize', () => {
    expect(withPageSize(null, 20)).toEqual({ ...emptyPreference(), pageSize: 20 });
  });
});

describe('resetColumnPreference', () => {
  it('pageSize 가 있으면 컬럼만 비우고 pageSize 는 남긴다', () => {
    expect(resetColumnPreference({ ...SAVED, pageSize: 50 })).toEqual({
      ...emptyPreference(),
      pageSize: 50,
    });
  });

  it('pageSize 가 없으면 null — 저장 항목 자체를 지운다', () => {
    expect(resetColumnPreference(SAVED)).toBeNull();
    expect(resetColumnPreference(null)).toBeNull();
  });
});

describe('왕복', () => {
  it('parse → stringify → parse 가 안정적이다', () => {
    for (const raw of [
      JSON.stringify({ ...SAVED, pageSize: 20 }),
      JSON.stringify(SAVED),
      withRawPageSize('0'),
    ]) {
      const once = parsePreference(raw);
      expect(once).not.toBeNull();
      expect(parsePreference(JSON.stringify(once))).toEqual(once);
    }
  });

  it('emptyPreference 는 현재 version 을 쓴다', () => {
    expect(emptyPreference().version).toBe(PREFERENCE_VERSION);
    expect(emptyPreference()).not.toHaveProperty('pageSize');
  });
});
