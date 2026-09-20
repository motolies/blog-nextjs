import { describe, expect, it } from 'vitest';
import { ADVISOR_STATUSES, COLLECT_STATUSES } from '../../types/quant';
import {
  ADVISOR_RUN_STATUS_OPTIONS,
  isFailureLike,
  isTerminal,
  RUN_STATUS_LABEL,
  RUN_STATUS_OPTIONS,
  runStatusLabel,
  runStatusTone,
  stepStatusTone,
} from './runStatus';

describe('RUN_STATUS_LABEL', () => {
  it('두 모듈의 상태 전부에 라벨이 있다', () => {
    for (const status of [...COLLECT_STATUSES, ...ADVISOR_STATUSES]) {
      expect(RUN_STATUS_LABEL[status]).toBeTruthy();
    }
  });

  it('모르는 값은 원문을 그대로 돌려준다 — 백엔드가 앞서가도 빈 배지가 되지 않는다', () => {
    expect(runStatusLabel('NEW_STATE')).toBe('NEW_STATE');
  });
});

describe('runStatusTone', () => {
  it('PLAN 의 tone 표와 같다', () => {
    expect(runStatusTone('RUNNING')).toBe('primary');
    expect(runStatusTone('SUCCESS')).toBe('success');
    expect(runStatusTone('PARTIAL')).toBe('warning');
    expect(runStatusTone('FAILED')).toBe('danger');
    expect(runStatusTone('SKIPPED')).toBe('neutral');
    expect(runStatusTone('CANCELED')).toBe('neutral');
  });
});

describe('select 옵션', () => {
  it('stock 옵션에는 SKIPPED 가 없다 — CollectStatus 에 없는 값은 400 이 되고 Slack 을 울린다', () => {
    const values = RUN_STATUS_OPTIONS.map((o) => o.value);
    expect(values).toEqual([...COLLECT_STATUSES]);
    expect(values).not.toContain('SKIPPED');
  });

  it('advisor 옵션은 AdvisorStatus 전부를 덮는다', () => {
    expect(new Set(ADVISOR_RUN_STATUS_OPTIONS.map((o) => o.value))).toEqual(
      new Set(ADVISOR_STATUSES),
    );
  });

  it('"전체" 항목을 넣지 않는다 — DynamicSearchFields 가 sentinel 로 삽입한다', () => {
    expect(RUN_STATUS_OPTIONS.some((o) => o.value === '')).toBe(false);
  });
});

describe('isTerminal / isFailureLike', () => {
  it('RUNNING 만 비종료다', () => {
    expect(isTerminal('RUNNING')).toBe(false);
    expect(isTerminal('SKIPPED')).toBe(true);
    expect(isTerminal('SUCCESS')).toBe(true);
  });

  it('실패 계열은 FAILED·PARTIAL·CANCELED — SKIPPED 는 의도된 무동작이라 제외', () => {
    expect(isFailureLike('FAILED')).toBe(true);
    expect(isFailureLike('PARTIAL')).toBe(true);
    expect(isFailureLike('CANCELED')).toBe(true);
    expect(isFailureLike('SKIPPED')).toBe(false);
    expect(isFailureLike('SUCCESS')).toBe(false);
  });
});

describe('stepStatusTone', () => {
  it('PipelineSteps 모양(OK/FAILED/SKIPPED/CANCELED)', () => {
    expect(stepStatusTone('OK')).toBe('success');
    expect(stepStatusTone('FAILED')).toBe('danger');
    expect(stepStatusTone('SKIPPED')).toBe('warning');
    expect(stepStatusTone('CANCELED')).toBe('neutral');
  });

  it('BACKFILL_ALL 하위 run 모양(CollectStatus)도 같은 함수로 처리한다', () => {
    expect(stepStatusTone('SUCCESS')).toBe('success');
    expect(stepStatusTone('PARTIAL')).toBe('warning');
    expect(stepStatusTone('RUNNING')).toBe('primary');
  });
});
