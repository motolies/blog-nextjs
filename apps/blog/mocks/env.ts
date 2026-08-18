/**
 * MOCK_DOWNSTREAM env 파서 — 'true' | 'false' | 미설정만 허용한다.
 *
 * zod 계층(@deleo/core)을 가져오지 않았으므로 최소 구현으로 대체하되,
 * 오타('ture' 등)는 조용히 꺼지는 대신 기동 실패로 드러낸다 — 목이 꺼진 채
 * 실제 백엔드를 호출하는 사고가 가장 찾기 어렵기 때문이다.
 */
export function isMockDownstream(): boolean {
  const value = process.env.MOCK_DOWNSTREAM;
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  throw new Error(`MOCK_DOWNSTREAM 은 'true' | 'false' 만 허용합니다: ${value}`);
}
