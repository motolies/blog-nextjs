import * as Sentry from '@sentry/nextjs';
import axios from 'axios';
import { buildAuthCookie, extractBackendAuthCookie } from '@/lib/authCookie';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { ensureMocksArmed } from '@/lib/ensureMocksArmed';
import { traceparentToSentryTrace } from '@/lib/traceparent';

// POST 만 받는다 — 그 외 메서드는 App Router 가 405(Allow: POST)로 응답한다
export async function POST(request: Request): Promise<Response> {
  await ensureMocksArmed();

  // 인바운드 W3C traceparent 로 Sentry 트레이스를 이어 — 캡처 이벤트가 브라우저와 같은 traceId 를 갖는다
  const sentryTrace = traceparentToSentryTrace(request.headers.get('traceparent'));
  // baggage 는 와이어에서 배제한다 — 전파는 W3C traceparent 단일 헤더 원칙
  return Sentry.continueTrace({ sentryTrace, baggage: undefined }, () => proxyLogin(request));
}

// 백엔드 로그인 결과의 Authorization 쿠키를 프론트 httpOnly 쿠키로 변환해 내려준다
async function proxyLogin(request: Request): Promise<Response> {
  try {
    // 바디는 파싱하지 않고 원문 그대로 백엔드에 넘긴다 — JSON 을 해석/재직렬화하지 않아 바이트가 보존된다
    const body = await request.text();
    const traceparent = request.headers.get('traceparent');

    const response = await axios.post(`${getBackendBaseUrl()}/api/auth/login`, body, {
      headers: {
        Accept: request.headers.get('accept') || 'application/json',
        'Content-Type': request.headers.get('content-type') || 'application/json',
        // 트레이스 전파는 W3C traceparent 로 통일 — 브라우저가 정한 값을 그대로 백엔드에 넘긴다
        ...(traceparent ? { traceparent } : {}),
      },
      // axios 기본 transformRequest 는 문자열도 JSON 검증·trim·재직렬화한다 — 원문을 건드리지 않도록 무력화
      transformRequest: [(data) => data],
      validateStatus: () => true,
    });

    const headers = new Headers();
    if (response.status === 200) {
      const authCookie = extractBackendAuthCookie(response.headers['set-cookie'] as string[]);
      if (!authCookie?.value) {
        return Response.json(
          { message: 'Backend login succeeded without auth token cookie.' },
          { status: 502 },
        );
      }
      headers.append(
        'Set-Cookie',
        buildAuthCookie(authCookie.value, { maxAge: authCookie.maxAge }),
      );
    }

    return sendBackendResponse(response.status, response.data, headers);
  } catch (error) {
    Sentry.captureException(error, { tags: { source: 'bff-login' } });
    console.error('BFF login proxy failed:', error);
    return Response.json({ message: 'Bad Gateway' }, { status: 502 });
  }
}

// 백엔드 응답 바디를 형태(빈 값·문자열·Buffer·객체)에 따라 그대로 내려준다
function sendBackendResponse(status: number, data: unknown, headers: Headers): Response {
  // 빈 바디는 body 없이 — '' 를 넘기면 Response 생성자가 204 같은 null body status 에서 throw 한다
  if (data === undefined || data === null || data === '') {
    return new Response(null, { status, headers });
  }
  if (typeof data === 'string') {
    return new Response(data, { status, headers });
  }
  // Buffer<ArrayBufferLike> 는 BodyInit 에 배정되지 않는다(TS 5.7+) — 바이트를 Uint8Array 로 복사해 넘긴다
  if (Buffer.isBuffer(data)) {
    return new Response(new Uint8Array(data), { status, headers });
  }
  return Response.json(data, { status, headers });
}
