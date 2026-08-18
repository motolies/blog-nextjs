import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildAuthCookie, extractBackendAuthCookie } from '@/lib/authCookie';
import { getBackendBaseUrl } from '@/lib/backendUrl';

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

  try {
    const response = await axios.post(`${getBackendBaseUrl()}/api/auth/login`, req.body, {
      headers: {
        Accept: (req.headers.accept as string) || 'application/json',
        'Content-Type': (req.headers['content-type'] as string) || 'application/json',
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
