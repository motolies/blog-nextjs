import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * 개발 전용 — 목 핸들러 호출 카운터 조회/리셋.
 *
 * 구체 라우트가 catch-all([...path].ts)보다 우선하므로 백엔드 프록시를 타지 않는다.
 * MOCK_DOWNSTREAM=false 면 500 — 운영에 실수로 남아도 아무것도 노출하지 않는다.
 * 동적 import 유지 — 꺼진 환경에서 mocks/ 가 번들에 딸려오지 않게 한다.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { isMockDownstream } = await import('../../../../mocks/env');
  if (!isMockDownstream()) {
    res
      .status(500)
      .json({ message: 'mock stats 는 MOCK_DOWNSTREAM=true 에서만 사용할 수 있습니다' });
    return;
  }

  const { callCounters } = await import('../../../../mocks/handlers');
  if (req.query.reset === 'true') {
    callCounters.reset();
    res.json({ reset: true });
    return;
  }
  res.json(callCounters.snapshot());
}
