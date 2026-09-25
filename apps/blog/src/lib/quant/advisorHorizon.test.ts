import { describe, expect, it } from 'vitest';
import {
  adviseJobOf,
  decisionHorizonOf,
  isMonitoringHorizon,
  KPI_KINDS,
  kpiHorizonsOf,
  resolveAdviceKind,
  resolveIcHorizon,
  resolveKind,
  resolveKpiHorizon,
  weightConsumerJobOf,
} from './advisorHorizon';

describe('decisionHorizonOf', () => {
  it('MORNING·ADHOC 은 DAILY 와 같은 5, 장기 종류는 자기 호라이즌', () => {
    expect(decisionHorizonOf('DAILY')).toBe(5);
    expect(decisionHorizonOf('MORNING')).toBe(5);
    expect(decisionHorizonOf('ADHOC')).toBe(5);
    expect(decisionHorizonOf('H20')).toBe(20);
    expect(decisionHorizonOf('H60')).toBe(60);
    expect(decisionHorizonOf('H180')).toBe(180);
  });
});

describe('kpiHorizonsOf', () => {
  it('KPI 종류에 ADHOC 은 없다(채점 루프 밖)', () => {
    expect(KPI_KINDS).not.toContain('ADHOC');
  });

  it('DAILY·MORNING 은 결정 5 + 진단 1·20, 장기 종류는 결정 호라이즌 하나', () => {
    expect(kpiHorizonsOf('DAILY')).toEqual([5, 1, 20]);
    expect(kpiHorizonsOf('MORNING')).toEqual([5, 1, 20]);
    expect(kpiHorizonsOf('H60')).toEqual([60]);
  });
});

describe('resolveKpiHorizon', () => {
  it('진단 호라이즌만 값으로 남기고 결정 호라이즌·무효는 null(파라미터 생략)', () => {
    expect(resolveKpiHorizon('DAILY', '20')).toBe(20);
    expect(resolveKpiHorizon('DAILY', '1')).toBe(1);
    expect(resolveKpiHorizon('DAILY', '5')).toBeNull();
    expect(resolveKpiHorizon('DAILY', '60')).toBeNull();
    expect(resolveKpiHorizon('DAILY', 'abc')).toBeNull();
    expect(resolveKpiHorizon('DAILY', null)).toBeNull();
  });

  it('종류를 바꾸면 옛 진단 호라이즌이 끌려오지 않는다', () => {
    expect(resolveKpiHorizon('H20', '1')).toBeNull();
    expect(resolveKpiHorizon('H20', '20')).toBeNull();
  });
});

describe('resolveKind·resolveAdviceKind', () => {
  it('허용 목록 밖은 fallback', () => {
    expect(resolveAdviceKind('MORNING')).toBe('MORNING');
    expect(resolveAdviceKind('ADHOC')).toBe('ADHOC');
    expect(resolveAdviceKind('WEEKLY')).toBe('DAILY');
    expect(resolveAdviceKind(null)).toBe('DAILY');
    expect(resolveKind('ADHOC', KPI_KINDS, 'DAILY')).toBe('DAILY');
  });
});

describe('resolveIcHorizon·isMonitoringHorizon', () => {
  it('IC 대상 5·20·60·180 만 통과, 그 밖은 5', () => {
    expect(resolveIcHorizon('20')).toBe(20);
    expect(resolveIcHorizon('180')).toBe(180);
    expect(resolveIcHorizon('1')).toBe(5);
    expect(resolveIcHorizon(null)).toBe(5);
  });

  it('60·180 은 모니터링 전용', () => {
    expect(isMonitoringHorizon(60)).toBe(true);
    expect(isMonitoringHorizon(180)).toBe(true);
    expect(isMonitoringHorizon(20)).toBe(false);
  });
});

describe('adviseJobOf·weightConsumerJobOf', () => {
  it('종류 → 재판단 잡, ADHOC 은 관리자 트리거 대상이 아니다', () => {
    expect(adviseJobOf('DAILY')).toBe('ADVISE');
    expect(adviseJobOf('MORNING')).toBe('MORNING_ADVISE');
    expect(adviseJobOf('H180')).toBe('ADVISE_H180');
    expect(adviseJobOf('ADHOC')).toBeNull();
  });

  it('가중치 소비 잡은 학습 호라이즌에만 있다', () => {
    expect(weightConsumerJobOf(5)).toBe('ADVISE');
    expect(weightConsumerJobOf(20)).toBe('ADVISE_H20');
    expect(weightConsumerJobOf(60)).toBeNull();
  });
});
