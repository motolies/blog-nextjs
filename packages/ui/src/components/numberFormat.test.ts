import { describe, expect, it } from 'vitest';
import { clampNumber, formatThousands, parseNumberText } from './numberFormat';

describe('formatThousands', () => {
  it('천단위 구분 — 음수·소수 포함', () => {
    expect(formatThousands(1234567)).toBe('1,234,567');
    expect(formatThousands(-1234567.5)).toBe('-1,234,567.5');
    expect(formatThousands(999)).toBe('999');
  });

  it('decimalPlaces 는 자릿수를 고정한다', () => {
    expect(formatThousands(1234.5, 2)).toBe('1,234.50');
    expect(formatThousands(1234.567, 2)).toBe('1,234.57');
    expect(formatThousands(1000, 0)).toBe('1,000');
  });

  it('null 은 빈칸', () => {
    expect(formatThousands(null)).toBe('');
  });
});

describe('parseNumberText', () => {
  it('구분자·공백을 걷어내고 파싱한다', () => {
    expect(parseNumberText('1,234,567')).toEqual({ ok: true, value: 1234567 });
    expect(parseNumberText(' 12 000 ')).toEqual({ ok: true, value: 12000 });
  });

  it('빈 값은 null 확정 — 그리드 commitTextValue 와 같은 규칙', () => {
    expect(parseNumberText('')).toEqual({ ok: true, value: null });
    expect(parseNumberText('  ')).toEqual({ ok: true, value: null });
  });

  it('숫자가 아니면 실패 — 호출부가 이전 값으로 되돌린다', () => {
    expect(parseNumberText('abc')).toEqual({ ok: false });
    expect(parseNumberText('1.2.3')).toEqual({ ok: false });
  });

  it('min/max 클램프 + 소수 자릿수 반올림', () => {
    expect(parseNumberText('150', { min: 0, max: 100 })).toEqual({ ok: true, value: 100 });
    expect(parseNumberText('-5', { min: 0 })).toEqual({ ok: true, value: 0 });
    expect(parseNumberText('1.005', { decimalPlaces: 2 })).toEqual({ ok: true, value: 1.0 });
  });
});

describe('clampNumber', () => {
  it('스텝 증감 결과도 같은 클램프를 지난다', () => {
    expect(clampNumber(101, { max: 100 })).toBe(100);
    expect(clampNumber(0.30000000000000004, { decimalPlaces: 2 })).toBe(0.3);
  });
});
