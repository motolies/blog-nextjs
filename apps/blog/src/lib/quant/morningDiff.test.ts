import { describe, expect, it } from 'vitest';
import type { MorningDiff, MorningTriggers } from '../../types/quant';
import { activeTriggers, morningDiffCounts, morningDiffRows } from './morningDiff';

const TRIGGERS: MorningTriggers = {
  gap: true,
  gapIndexes: ['0001'],
  sector: false,
  sectorSymbols: [],
  caution: true,
  morningCheck: true,
  any: true,
};

describe('morningDiffRows', () => {
  it('제외 → 추가 → 유지 순이고 DROP 에만 저녁 방향·확신이 붙는다', () => {
    const diff: MorningDiff = {
      parentAdviceId: 77,
      keep: [{ ticker: '005930', reason: '갭 영향 작음' }],
      add: [{ ticker: '000660', reason: 'SOX +3%' }],
      drop: [{ ticker: '035420', reason: '예상 갭 −1.2σ', direction: 'LONG', conviction: 0.7 }],
      triggers: TRIGGERS,
      usDate: '2026-09-24',
      usClosed: false,
    };
    const rows = morningDiffRows(diff);
    expect(rows.map((row) => `${row.action}:${row.ticker}`)).toEqual([
      'DROP:035420',
      'ADD:000660',
      'KEEP:005930',
    ]);
    expect(rows[0]).toMatchObject({ direction: 'LONG', conviction: 0.7 });
    expect(rows[1]).toMatchObject({ direction: null, conviction: null });
    expect(morningDiffCounts(rows)).toEqual({ KEEP: 1, ADD: 1, DROP: 1 });
  });

  it('느슨한 JSON — 배열이 없거나 ticker 없는 원소·빈 사유는 걸러 낸다', () => {
    const diff = {
      keep: null,
      add: [null, 'x', { reason: 'ticker 없음' }, { ticker: '000660', reason: '' }],
    } as unknown as MorningDiff;
    expect(morningDiffRows(diff)).toEqual([
      { action: 'ADD', ticker: '000660', reason: null, direction: null, conviction: null },
    ]);
    expect(morningDiffRows(null)).toEqual([]);
  });
});

describe('activeTriggers', () => {
  it('켜진 트리거만 코드와 함께', () => {
    expect(activeTriggers(TRIGGERS)).toEqual([
      { kind: 'gap', codes: ['0001'] },
      { kind: 'caution' },
    ]);
    expect(activeTriggers({ ...TRIGGERS, gap: false, caution: false, any: false })).toEqual([]);
    expect(activeTriggers(null)).toEqual([]);
  });
});
