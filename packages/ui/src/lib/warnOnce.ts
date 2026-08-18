/**
 * 같은 경고를 한 번만 낸다.
 *
 * 규칙 위반을 알리고 싶지만 `process.env.NODE_ENV` 를 쓸 수 없다 —
 * 이 패키지는 `process.env` 를 모르고(GritQL `no-process-env`), 예외를 늘리지 않는다.
 * 대신 중복을 지워서 프로덕션에서도 조용하게 만든다. 애초에 이 경고는 0건이어야 정상이고,
 * 0건이 아니라면 그때야말로 알아야 한다.
 *
 * ⚠️ 렌더 중 호출해도 되도록 **부수효과가 콘솔 출력뿐**이다. 상태를 바꾸지 않는다.
 */
const seen = new Set<string>();

export function warnOnce(key: string, message: string): void {
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(`[@hvy/ui] ${message}`);
}
