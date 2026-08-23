import * as Sentry from '@sentry/nextjs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildAuthCookie, extractBackendAuthCookie } from '@/lib/authCookie';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { traceparentToSentryTrace } from '@/lib/traceparent';

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
  const { ensureMockDownstream } = await import('../../../../mocks/server');
  ensureMockDownstream();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureMocksArmed();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  // 인바운드 W3C traceparent 로 Sentry 트레이스를 이어 — 캡처 이벤트가 브라우저와 같은 traceId 를 갖는다
  const sentryTrace = traceparentToSentryTrace(req.headers.traceparent);
  // baggage 는 와이어에서 배제한다 — 전파는 W3C traceparent 단일 헤더 원칙
  return Sentry.continueTrace({ sentryTrace, baggage: undefined }, () => proxyLogin(req, res));
}

// 백엔드 로그인 결과의 Authorization 쿠키를 프론트 httpOnly 쿠키로 변환해 내려준다
async function proxyLogin(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await axios.post(`${getBackendBaseUrl()}/api/auth/login`, req.body, {
      headers: {
        Accept: (req.headers.accept as string) || 'application/json',
        'Content-Type': (req.headers['content-type'] as string) || 'application/json',
        // 트레이스 전파는 W3C traceparent 로 통일 — 브라우저가 정한 값을 그대로 백엔드에 넘긴다
        ...(typeof req.headers.traceparent === 'string'
          ? { traceparent: req.headers.traceparent }
          : {}),
      },
      validateStatus: () => true,
    });

    if (response.status === 200) {
      const authCookie = extractBackendAuthCookie(response.headers['set-cookie'] as string[]);
      if (!authCookie?.value) {
        return res.status(502).json({
          message: 'Backend login succeeded without auth token cookie.',
        });
      }

      res.setHeader('Set-Cookie', buildAuthCookie(authCookie.value, { maxAge: authCookie.maxAge }));
    }

    return sendBackendResponse(res, response.status, response.data);
  } catch (error) {
    Sentry.captureException(error, { tags: { source: 'bff-login' } });
    console.error('BFF login proxy failed:', error);
    return res.status(502).json({ message: 'Bad Gateway' });
  }
}

function sendBackendResponse(res: NextApiResponse, status: number, data: unknown) {
  if (data === undefined || data === null) {
    return res.status(status).end();
  }

  if (Buffer.isBuffer(data) || typeof data === 'string') {
    return res.status(status).send(data);
  }

  return res.status(status).json(data);
}
