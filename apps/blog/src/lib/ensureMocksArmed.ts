/**
 * 목 다운스트림 재확인 — 개발 전용. BFF Route Handler(catch-all 프록시·로그인)가 요청 진입점에서 호출한다.
 *
 * `instrumentation.register()` 는 프로세스당 한 번만 돈다. 그런데 Turbopack 이
 * 리빌드할 때마다 MSW 가 심어 둔 전역 fetch 가 원본으로 되돌아가서, 그 다음 요청부터
 * **목이 켜져 있는데 실 백엔드로 나간다.** 요청 진입점에서 한 번 더 확인해야 한다.
 * 프로덕션에서는 env 가 없어 동적 import 자체가 실행되지 않는다.
 */
export async function ensureMocksArmed(): Promise<void> {
  if (process.env.MOCK_DOWNSTREAM !== 'true') return;
  const { ensureMockDownstream } = await import('@mocks/server');
  ensureMockDownstream();
}
