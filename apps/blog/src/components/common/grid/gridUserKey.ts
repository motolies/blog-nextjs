/**
 * 그리드 저장 키의 사용자 축(`nx:grid:{userKey}:…`) 계산.
 *
 * 프로필 로드 전에는 `useAuthStore` 의 `user` 가 `{}` 인 프레임이 존재한다
 * (`app/providers.tsx` 의 AuthBootstrap — 마운트 후 loadProfile). 그 프레임의 키를 비워 두면
 * `nx:grid::…` 같은 기형 키가 생기므로 고정 fallback 으로 격리한다.
 * username 이 도착하면 키가 전환되고 useGridPreference 가 `[key]` effect 로
 * 진짜 설정을 다시 로드한다 — fallback 키에 남는 찌꺼기는 무해하다.
 */
export const GRID_ANONYMOUS_USER = 'anonymous';

/** username 이 아직 없으면(undefined·빈 문자열) fallback 사용자 축을 돌려준다. */
export function resolveGridUserKey(username: string | undefined): string {
  return username && username.length > 0 ? username : GRID_ANONYMOUS_USER;
}
