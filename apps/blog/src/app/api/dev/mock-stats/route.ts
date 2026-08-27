/**
 * 개발 전용 — 목 핸들러 호출 카운터 조회/리셋.
 *
 * 정적 세그먼트(api/dev/mock-stats)가 catch-all([...path]/route.ts)보다 우선하므로 백엔드 프록시를 타지 않는다.
 * MOCK_DOWNSTREAM=false 면 500 — 운영에 실수로 남아도 아무것도 노출하지 않는다.
 * 동적 import 유지 — 꺼진 환경에서 mocks/ 가 번들에 딸려오지 않게 한다.
 */
export async function GET(request: Request): Promise<Response> {
  const { isMockDownstream } = await import('@mocks/env');
  if (!isMockDownstream()) {
    return Response.json(
      { message: 'mock stats 는 MOCK_DOWNSTREAM=true 에서만 사용할 수 있습니다' },
      { status: 500 },
    );
  }

  const { callCounters } = await import('@mocks/handlers');
  if (new URL(request.url).searchParams.get('reset') === 'true') {
    callCounters.reset();
    return Response.json({ reset: true });
  }
  return Response.json(callCounters.snapshot());
}
