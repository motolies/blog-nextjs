import { describe, expect, it } from 'vitest';
import { compareValues, type SearchField, sanitizeSearchParams } from './gridSearch';

describe('sanitizeSearchParams', () => {
  const fields: SearchField[] = [
    {
      type: 'numberRange',
      fromName: 'priceFrom',
      toName: 'priceTo',
      min: 0,
      max: 1000,
      integerOnly: true,
      allowNegative: false,
    },
  ];

  it('빈 값(undefined/null/빈 문자열)을 제거한다', () => {
    expect(
      sanitizeSearchParams({ a: undefined, b: null, c: '', d: 'keep', e: 0, f: false }, []),
    ).toEqual({ d: 'keep', e: 0, f: false });
  });

  it('numberRange 필드를 숫자로 변환하고 min/max 로 클램프한다', () => {
    expect(sanitizeSearchParams({ priceFrom: '-50', priceTo: '99999' }, fields)).toEqual({
      priceFrom: 0,
      priceTo: 1000,
    });
  });

  it('integerOnly 필드는 소수부를 버린다', () => {
    expect(sanitizeSearchParams({ priceFrom: '12.9' }, fields)).toEqual({ priceFrom: 12 });
  });

  it('숫자로 해석되지 않는 numberRange 값은 통째로 버린다', () => {
    expect(sanitizeSearchParams({ priceFrom: 'abc' }, fields)).toEqual({});
  });

  it('numberRange 가 아닌 필드는 원본 값을 유지한다', () => {
    expect(sanitizeSearchParams({ keyword: '검색어' }, fields)).toEqual({ keyword: '검색어' });
  });

  it('allowNegative 가 false 가 아니면 음수를 허용한다', () => {
    const signed: SearchField[] = [{ type: 'numberRange', fromName: 'delta', toName: 'deltaTo' }];
    expect(sanitizeSearchParams({ delta: '-5' }, signed)).toEqual({ delta: -5 });
  });
});

describe('compareValues', () => {
  it('null 은 항상 앞으로 정렬된다', () => {
    expect(compareValues(null, 1)).toBe(-1);
    expect(compareValues(1, null)).toBe(1);
    expect(compareValues(null, null)).toBe(0);
  });

  it('숫자는 수치 비교한다', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
  });

  it('문자열은 한국어 로케일로 비교한다', () => {
    expect(compareValues('가', '나')).toBeLessThan(0);
    expect(compareValues('나', '가')).toBeGreaterThan(0);
  });
});
