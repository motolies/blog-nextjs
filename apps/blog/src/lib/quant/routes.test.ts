import { describe, expect, it } from 'vitest';
import { ADVISOR_TABS, adviceHref, COLLECT_TABS, resolveTab, runHref } from './routes';

describe('resolveTab', () => {
  it('허용 목록의 값만 통과시키고 나머지는 fallback', () => {
    expect(resolveTab('checkpoints', COLLECT_TABS, 'runs')).toBe('checkpoints');
    expect(resolveTab('evil', COLLECT_TABS, 'runs')).toBe('runs');
    expect(resolveTab(null, ADVISOR_TABS, 'runs')).toBe('runs');
    expect(resolveTab(undefined, ADVISOR_TABS, 'kpi')).toBe('kpi');
  });
});

describe('딥링크', () => {
  it('run 상세는 모듈별 실행 이력 탭으로 간다', () => {
    expect(runHref('STOCK', 1201)).toBe('/admin/quant/collect?tab=runs&run=1201');
    expect(runHref('ADVISOR', '77')).toBe('/admin/quant/advisor?tab=runs&run=77');
  });

  it('판단 상세는 판단 이력 탭으로 간다', () => {
    expect(adviceHref(77)).toBe('/admin/quant/advisor?tab=advices&advice=77');
  });
});
