import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// server-only 미사용: Pages Router API 라우트(mock-stats)가 import 하면 RSC 전용 가드가 throw 한다.
// 이 디렉터리는 instrumentation·API 라우트에서만 import 되므로 구조상 서버 전용이다.
/**
 * Node 사이드 MSW. 브라우저 서비스워커는 쓰지 않는다 —
 * 백엔드(hvy-blog) 호출은 전부 Next 서버에서 일어나므로(SSR axios · BFF 프록시 fetch)
 * 인터셉트 지점도 서버 하나뿐이다.
 *
 * ⚠️ `globalThis` 에 붙이는 이유: Next dev 의 HMR 이 서버 모듈을 재평가하면 모듈 스코프
 * 변수가 초기화되어 "이미 켰다"는 사실을 잃어버린다. 그러면 목이 조용히 꺼진 채로
 * 실제 백엔드를 호출하러 가고, 원인을 찾기 매우 어렵다.
 * `instrumentation.ts` 의 `register()` 는 프로세스당 한 번만 실행되므로 재등록 기회도 없다.
 */
type MockGlobal = typeof globalThis & {
  __hvyMswServer?: ReturnType<typeof setupServer>;
};

const store = globalThis as MockGlobal;

export function startMockDownstream(): void {
  if (store.__hvyMswServer) return;

  const server = setupServer(...handlers);
  server.listen({
    // 목이 없는 요청은 그냥 통과시킨다 — 점진적으로 핸들러를 늘릴 수 있다.
    onUnhandledRequest: 'bypass',
  });

  store.__hvyMswServer = server;
}

/** HMR 이후에도 목이 살아 있는지 확인하고, 죽었으면 다시 켠다. */
export function ensureMockDownstream(): void {
  if (!store.__hvyMswServer) startMockDownstream();
}

export function stopMockDownstream(): void {
  store.__hvyMswServer?.close();
  store.__hvyMswServer = undefined;
}
