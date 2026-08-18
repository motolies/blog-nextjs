import { describe, expect, it } from 'vitest';
import { resolveControlState, resolveMode } from './fieldState';
import type { FieldMode } from './form-mode';

const MODES: readonly FieldMode[] = ['edit', 'view', 'disabled'];

describe('resolveMode', () => {
  it('우선순위 전수 — 명시 > 컨텍스트 > FormMode > edit', () => {
    const layers = [...MODES, undefined] as const;
    for (const explicit of layers) {
      for (const context of layers) {
        for (const form of [...MODES, null] as const) {
          const expected = explicit ?? context ?? form ?? 'edit';
          expect(resolveMode(explicit, context, form)).toBe(expected);
        }
      }
    }
  });

  it('폼이 view 여도 명시 edit 이 이긴다 — 단독 상태 유지의 근거', () => {
    expect(resolveMode('edit', undefined, 'view')).toBe('edit');
    expect(resolveMode('edit', 'view', 'view')).toBe('edit');
  });
});

describe('resolveControlState', () => {
  it('edit + 축 없음 — 완전 개방', () => {
    const state = resolveControlState({ mode: 'edit' });
    expect(state).toEqual({
      view: false,
      readOnly: false,
      disabled: false,
      submits: true,
      lockClass: undefined,
      dataProps: { 'data-mode': 'edit' },
    });
  });

  it('lock 은 edit 를 이긴다 — readOnly 이되 전송은 된다', () => {
    const state = resolveControlState({ mode: 'edit', lock: true });
    expect(state.readOnly).toBe(true);
    expect(state.submits).toBe(true);
    expect(state.lockClass).toBe('dl-field-locked dl-field-locked-hint');
    expect(state.dataProps).toEqual({ 'data-mode': 'edit', 'data-locked': '' });
  });

  it('masking 은 readOnly + 미전송 — 마스킹값 저장사고의 구조적 방어', () => {
    const state = resolveControlState({ mode: 'edit', masking: true });
    expect(state.readOnly).toBe(true);
    expect(state.submits).toBe(false);
    expect(state.lockClass).toBe('dl-field-locked dl-field-masked');
    expect(state.dataProps).toEqual({ 'data-mode': 'edit', 'data-masked': '' });
  });

  it('lock + masking 동시 — 배색·전송은 masking 이 이기고 data 속성은 둘 다 남는다', () => {
    const state = resolveControlState({ mode: 'edit', lock: true, masking: true });
    expect(state.lockClass).toBe('dl-field-locked dl-field-masked');
    expect(state.submits).toBe(false);
    expect(state.dataProps).toEqual({
      'data-mode': 'edit',
      'data-locked': '',
      'data-masked': '',
    });
  });

  it('disabled 모드 — 잠금 배색 + 미전송(네이티브 규약)', () => {
    const state = resolveControlState({ mode: 'disabled' });
    expect(state.disabled).toBe(true);
    expect(state.submits).toBe(false);
    expect(state.lockClass).toBe('dl-field-locked');
    expect(state.dataProps).toEqual({ 'data-mode': 'disabled' });
  });

  it('view 모드 — 입력 DOM 이 없으므로 전송도 없다', () => {
    const state = resolveControlState({ mode: 'view' });
    expect(state.view).toBe(true);
    expect(state.submits).toBe(false);
  });

  it('view + masking — data 속성으로 마스킹이 표식된다(FieldViewText 가 소비)', () => {
    const state = resolveControlState({ mode: 'view', masking: true });
    expect(state.dataProps).toEqual({ 'data-mode': 'view', 'data-masked': '' });
  });
});
