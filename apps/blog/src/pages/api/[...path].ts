import { Readable } from 'node:stream';
import * as Sentry from '@sentry/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthTokenFromRequest } from '@/lib/authCookie';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { traceparentToSentryTrace } from '@/lib/traceparent';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

function toReadableStream(req: NextApiRequest): ReadableStream<Uint8Array> {
  return Readable.toWeb(req) as ReadableStream<Uint8Array>;
}

/**
 * 목 다운스트림 재확인 — 개발 전용.
 *
 * `instrumentation.register()` 는 프로세스당 한 번만 돈다. 그런데 Turbopack 이
 * 리빌드할 때마다 MSW 가 심어 둔 전역 fetch 가 원본으로 되돌아가서, 그 다음 요청부터
 * **목이 켜져 있는데 실 백엔드로 나간다.** 요청 진입점에서 한 번 더 확인해야 한다.
 * 프로덕션에서는 env 가 없어 동적 import 자체가 실행되지 않는다.
 */
async function ensureMocksArmed(): Promise<void> {
  if (process.env.MOCK_DOWNSTREAM !== 'true') return;
  const { ensureMockDownstream } = await import('../../../mocks/server');
  ensureMockDownstream();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureMocksArmed();

  // 인바운드 W3C traceparent 로 Sentry 트레이스를 이어 — 여기서 캡처되는 에러가
  // 브라우저 이벤트·백엔드 로그와 같은 traceId 를 갖는다 (없으면 새 트레이스로 실행).
  const sentryTrace = traceparentToSentryTrace(req.headers.traceparent);
  // baggage 는 와이어에서 배제한다 — 전파는 W3C traceparent 단일 헤더 원칙
  return Sentry.continueTrace({ sentryTrace, baggage: undefined }, () => proxyRequest(req, res));
}

// 요청 바디/응답을 스트리밍으로 백엔드에 중계한다 — cookie/host 외 헤더는 그대로 전달
// (traceparent 도 이 경로로 백엔드까지 흘러간다)
async function proxyRequest(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const token = getAuthTokenFromRequest(req);
  const target = getBackendBaseUrl();
  const url = `${target}${req.url}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'cookie' || key === 'host') continue;
    if (typeof value === 'string') headers[key] = value;
  }
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? toReadableStream(req) : undefined,
      // @ts-expect-error Node.js fetch supports duplex for streaming request bodies
      duplex: hasBody ? 'half' : undefined,
    });

    res.status(upstream.status);
    for (const [key, value] of upstream.headers.entries()) {
      if (key === 'set-cookie' || key === 'transfer-encoding') continue;
      res.setHeader(key, value);
    }

    if (upstream.body) {
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    res.end();
  } catch (error) {
    Sentry.captureException(error, { tags: { source: 'bff-proxy' } });
    console.error('BFF proxy failed:', error);
    if (!res.headersSent) {
      res.status(502).json({ message: 'Bad Gateway' });
    } else {
      res.end();
    }
  }
}
