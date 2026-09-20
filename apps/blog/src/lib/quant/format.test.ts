import { describe, expect, it } from 'vitest';
import { formatCallsWithFailures, formatCostUsd, formatDurationMs, formatTokens } from './format';

describe('formatDurationMs', () => {
  it('단위가 자연스럽게 바뀐다', () => {
    expect(formatDurationMs(850)).toBe('850ms');
    expect(formatDurationMs(12_345)).toBe('12.3초');
    expect(formatDurationMs(245_000)).toBe('4분 05초');
    expect(formatDurationMs(4_320_000)).toBe('1시간 12분');
  });

  it('없거나 음수면 대시', () => {
    expect(formatDurationMs(null)).toBe('—');
    expect(formatDurationMs(undefined)).toBe('—');
    expect(formatDurationMs(-1)).toBe('—');
  });
});

describe('formatCostUsd', () => {
  it('0 이나 없음은 단가 미설정 — 무료로 오독하지 않게', () => {
    expect(formatCostUsd(0)).toBe('단가 미설정');
    expect(formatCostUsd('0.0000')).toBe('단가 미설정');
    expect(formatCostUsd(null)).toBe('단가 미설정');
  });

  it('BigDecimal 문자열도 숫자로 읽는다', () => {
    expect(formatCostUsd('0.12345')).toBe('$0.1235');
    expect(formatCostUsd(1.5)).toBe('$1.5000');
  });
});

describe('formatTokens / formatCallsWithFailures', () => {
  it('큰 수는 축약, 없음은 대시', () => {
    expect(formatTokens(12_345)).toBe('1.2만');
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(null)).toBe('—');
    expect(formatCallsWithFailures(2500, 3)).toBe('2,500 / 3');
  });
});
