import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunModule } from '../../types/quant';
import { type RunActions, useRunActions } from './useRunActions';

const mocks = vi.hoisted(() => ({
  stock: { run: vi.fn(), cancel: vi.fn() },
  advisor: { run: vi.fn(), cancel: vi.fn() },
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  toast: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@hvy/ui', () => ({ showToast: mocks.toast }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => mocks }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/useDashboard', () => ({ dashboardKeys: { health: () => ['health'] } }));
vi.mock('@/hooks/useQuant', () => ({
  quantKeys: { all: ['quant'], run: (module: string, id: string) => ['quant', module, 'run', id] },
}));
vi.mock('@/lib/apiErrorToast', () => ({ showApiErrorToast: mocks.error }));
vi.mock('@/service', () => ({
  default: { stockCollect: mocks.stock, advisor: mocks.advisor },
}));

// SSR runs the real hook once; its ref guards and async methods remain alive for each assertion.
function mountActions(onChanged: () => void) {
  let actions: RunActions;
  function Harness() {
    actions = useRunActions({ onChanged });
    return null;
  }
  renderToStaticMarkup(createElement(Harness));
  return actions!;
}

beforeEach(() => vi.resetAllMocks());

describe.each<RunModule>(['STOCK', 'ADVISOR'])('%s stop requests', (module) => {
  const target = { runId: 17, jobDescription: '테스트 잡' };
  const api = module === 'STOCK' ? mocks.stock : mocks.advisor;

  it('suppresses duplicate submissions and refreshes list/detail after success', async () => {
    let release: (value: { status: string }) => void;
    api.run.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    api.cancel.mockResolvedValue({ ...target, status: 'CANCELED' });
    const changed = vi.fn();
    const actions = mountActions(changed);
    const first = actions.cancel(module, target);
    expect(await actions.cancel(module, target)).toBeUndefined();
    release!({ status: 'RUNNING' });
    expect(await first).toBe(true);
    expect(api.cancel).toHaveBeenCalledExactlyOnceWith(17);
    expect(mocks.setQueryData).toHaveBeenLastCalledWith(['quant', module, 'run', '17'], {
      ...target,
      status: 'CANCELED',
    });
    expect(changed).toHaveBeenCalledOnce();
    expect(mocks.toast).toHaveBeenCalledWith('정지 요청을 전달했습니다', 'success');
  });

  it('refreshes a naturally completed run without submitting cancellation', async () => {
    api.run.mockResolvedValue({ ...target, status: 'SUCCESS' });
    const changed = vi.fn();
    expect(await mountActions(changed).cancel(module, target)).toBe(true);
    expect(api.cancel).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledOnce();
    expect(mocks.setQueryData).toHaveBeenCalledWith(['quant', module, 'run', '17'], {
      ...target,
      status: 'SUCCESS',
    });
  });

  it('reports API failure and releases the guard for a retry', async () => {
    api.run.mockResolvedValue({ ...target, status: 'RUNNING' });
    api.cancel.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
      ...target,
      status: 'CANCELED',
    });
    const changed = vi.fn();
    const actions = mountActions(changed);
    expect(await actions.cancel(module, target)).toBe(false);
    expect(mocks.error).toHaveBeenCalledOnce();
    expect(changed).not.toHaveBeenCalled();
    expect(await actions.cancel(module, target)).toBe(true);
    expect(api.cancel).toHaveBeenCalledTimes(2);
  });

  it('does not cancel when the preflight read fails', async () => {
    api.run.mockRejectedValue(new Error('read failed'));
    expect(await mountActions(vi.fn()).cancel(module, target)).toBe(false);
    expect(api.cancel).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledOnce();
  });
});
