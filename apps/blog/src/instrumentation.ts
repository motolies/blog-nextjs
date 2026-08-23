import * as Sentry from '@sentry/nextjs';

/**
 * Next 서버 프로세스 기동 훅 — Sentry(서버) 초기화 후, MOCK_DOWNSTREAM=true 면 MSW 목을 켠다.
 *
 * ⚠️ 위치 함정: src/ 디렉터리를 쓰는 앱은 반드시 src/instrumentation.ts 여야 한다.
 *    앱 루트에 두면 Next 가 조용히 무시한다.
 * ⚠️ register() 는 프로세스당 1회 — mocks/ 를 수정하면 dev 서버를 재시작해야 한다.
 *    HMR 은 인터셉터를 재등록하지 않으며, 그 상태로는 실 백엔드를 호출하기 시작한다.
 *
 * 동적 import — 목이 꺼져 있으면 msw 가 번들에 들어오지 않는다.
 * Sentry 를 MSW 보다 먼저 init 한다 — 모니터링이 가장 먼저 서야 이후 부팅 오류도 잡힌다.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  await import('../sentry.server.config');

  const { isMockDownstream } = await import('../mocks/env');
  if (!isMockDownstream()) return;

  const { startMockDownstream } = await import('../mocks/server');
  startMockDownstream();
  console.warn('[mock] MSW 목 다운스트림 활성 — 실제 백엔드를 호출하지 않는다');
}

// nodejs 런타임의 요청 처리 중 오류(getServerSideProps, API 라우트 등)를 Sentry 로 후킹한다.
// edge 런타임(미들웨어)은 현재 미사용 — 도입 시 sentry.edge.config.ts 를 추가해야 한다.
export const onRequestError = Sentry.captureRequestError;
