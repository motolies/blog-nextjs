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
  /**
   * `server.listen()` 직후의 `globalThis.fetch`.
   *
   * MSW 는 전역 fetch 를 **자기 함수로 교체**해서 가로챈다. 그런데 Turbopack 이
   * 리빌드할 때마다 전역 fetch 가 원본으로 되돌아가고, 그러면 목은 켜져 있는데
   * 아무것도 가로채지 못한다 — 브라우저→BFF 호출이 전부 실 백엔드로 나간다.
   * "우리가 심은 fetch 가 아직 살아 있는가"를 판정하려면 심은 순간의 참조가 필요하다.
   * (MSW 내부 심볼을 읽지 않는 이유: 버전이 바뀌면 조용히 판정이 깨진다.)
   */
  __hvyMswFetch?: typeof globalThis.fetch;
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
  store.__hvyMswFetch = globalThis.fetch;
}

/**
 * 요청 처리 직전에 목이 **실제로 가로채는 상태인지** 확인하고, 아니면 다시 켠다.
 *
 * 서버 객체가 살아 있는지만 보면 안 된다 — Turbopack 리빌드는 객체를 그대로 두고
 * 전역 fetch 만 원본으로 되돌린다. 그 상태가 정확히 이 파일 상단이 경고하는
 * "목이 조용히 꺼진 채 실 백엔드를 호출하는" 사고이고, 판정 대상이 틀리면 경고가 무의미하다.
 */
export function ensureMockDownstream(): void {
  if (!store.__hvyMswServer) {
    startMockDownstream();
    return;
  }
  if (store.__hvyMswFetch === globalThis.fetch) return;

  store.__hvyMswServer.close();
  store.__hvyMswServer = undefined;
  store.__hvyMswFetch = undefined;
  startMockDownstream();
}

export function stopMockDownstream(): void {
  store.__hvyMswServer?.close();
  store.__hvyMswServer = undefined;
  store.__hvyMswFetch = undefined;
}
