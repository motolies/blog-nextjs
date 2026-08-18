/**
 * Next 서버 프로세스 기동 훅 — MOCK_DOWNSTREAM=true 면 MSW 목을 켠다.
 *
 * ⚠️ 위치 함정: src/ 디렉터리를 쓰는 앱은 반드시 src/instrumentation.ts 여야 한다.
 *    앱 루트에 두면 Next 가 조용히 무시한다.
 * ⚠️ register() 는 프로세스당 1회 — mocks/ 를 수정하면 dev 서버를 재시작해야 한다.
 *    HMR 은 인터셉터를 재등록하지 않으며, 그 상태로는 실 백엔드를 호출하기 시작한다.
 *
 * 동적 import — 목이 꺼져 있으면 msw 가 번들에 들어오지 않는다.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { isMockDownstream } = await import('../mocks/env');
  if (!isMockDownstream()) return;

  const { startMockDownstream } = await import('../mocks/server');
  startMockDownstream();
  console.warn('[mock] MSW 목 다운스트림 활성 — 실제 백엔드를 호출하지 않는다');
}
