import * as Sentry from '@sentry/nextjs';
import { getAuthTokenFromRequest } from '@/lib/authCookie';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { ensureMocksArmed } from '@/lib/ensureMocksArmed';
import { traceparentToSentryTrace } from '@/lib/traceparent';

/**
 * 업스트림 응답에서 중계하지 않는 헤더.
 *
 * - set-cookie: 백엔드 Authorization 쿠키를 브라우저에 노출하지 않는다(로그인 라우트만 hvy_access_token 으로 재포장).
 * - content-encoding / content-length: undici fetch 는 gzip/br 바디를 **자동 해제하면서 헤더는 남긴다**.
 *   원 헤더를 그대로 넘기면 브라우저가 이미 풀린 바디를 다시 풀거나 길이 불일치로 끊는다 —
 *   새 Response 가 chunked 로 다시 프레이밍하고 필요하면 Next 의 compress 가 재압축한다.
 * - transfer-encoding / connection / keep-alive: hop-by-hop — 이 홉(Node HTTP 서버)이 스스로 정한다.
 */
const DROP_RESPONSE_HEADERS = new Set([
  'set-cookie',
  'transfer-encoding',
  'content-encoding',
  'content-length',
  'connection',
  'keep-alive',
]);

// 요청 바디/응답을 스트리밍으로 백엔드에 중계한다 — cookie/host 외 헤더는 그대로 전달
// (traceparent 도 이 경로로 백엔드까지 흘러간다)
async function proxyRequest(request: Request): Promise<Response> {
  const token = getAuthTokenFromRequest(request.headers);
  const { pathname, search } = new URL(request.url);
  const url = `${getBackendBaseUrl()}${pathname}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key === 'cookie' || key === 'host') return;
    headers.set(key, value);
  });
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      // Request.body 는 이미 Web ReadableStream — Node Readable → Web 변환(Readable.toWeb)이 필요 없다
      body: hasBody ? request.body : undefined,
      // @ts-expect-error Node.js fetch 는 스트리밍 요청 바디에 duplex 가 필요하다
      duplex: hasBody ? 'half' : undefined,
      // redirect 는 기본값(follow). manual 로 두면 운영에서 내부 호스트(blogback)의 Location 이 브라우저로 새어 나간다
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!DROP_RESPONSE_HEADERS.has(key)) responseHeaders.set(key, value);
    });
    // body 스트림을 그대로 넘기면 Next 가 흘려보낸다 — 수동 reader/res.write 루프가 필요 없다
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    Sentry.captureException(error, { tags: { source: 'bff-proxy' } });
    console.error('BFF proxy failed:', error);
    return Response.json({ message: 'Bad Gateway' }, { status: 502 });
  }
}

// 모든 메서드의 진입점 — 목 재무장 후, 인바운드 W3C traceparent 로 Sentry 트레이스를 이어
// 여기서 캡처되는 에러가 브라우저 이벤트·백엔드 로그와 같은 traceId 를 갖는다 (없으면 새 트레이스로 실행)
async function proxy(request: Request): Promise<Response> {
  await ensureMocksArmed();
  const sentryTrace = traceparentToSentryTrace(request.headers.get('traceparent'));
  // baggage 는 와이어에서 배제한다 — 전파는 W3C traceparent 단일 헤더 원칙
  return Sentry.continueTrace({ sentryTrace, baggage: undefined }, () => proxyRequest(request));
}

export {
  proxy as DELETE,
  proxy as GET,
  proxy as HEAD,
  proxy as OPTIONS,
  proxy as PATCH,
  proxy as POST,
  proxy as PUT,
};
