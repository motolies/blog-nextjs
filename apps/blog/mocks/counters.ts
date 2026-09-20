/**
 * 목 핸들러 호출 카운터 — `handlers.ts` 에서 분리했다. 도메인별 핸들러 파일(`quant/handlers.ts`)이
 * `handlers.ts` 를 import 하면 순환이 생기므로 카운터를 독립 모듈로 둔다.
 *
 * globalThis 보관 이유: HMR 로 모듈 그래프가 갈라지면 카운터가 분리되는 것을 방지. 조회는 /api/dev/mock-stats.
 */
export type CounterKey =
  | 'auth'
  | 'post'
  | 'search'
  | 'category'
  | 'tag'
  | 'series'
  | 'stock'
  | 'advisor'
  | 'stats';

type CounterGlobal = typeof globalThis & {
  __hvyMockCounters?: Record<CounterKey, number>;
};

const counterStore = globalThis as CounterGlobal;

function counters(): Record<CounterKey, number> {
  if (!counterStore.__hvyMockCounters) {
    counterStore.__hvyMockCounters = {
      auth: 0,
      post: 0,
      search: 0,
      category: 0,
      tag: 0,
      series: 0,
      stock: 0,
      advisor: 0,
      stats: 0,
    };
  }
  return counterStore.__hvyMockCounters;
}

export function count(key: CounterKey): void {
  counters()[key] += 1;
}

export const callCounters = {
  snapshot: (): Record<CounterKey, number> => ({ ...counters() }),
  reset: (): void => {
    counterStore.__hvyMockCounters = undefined;
  },
};
