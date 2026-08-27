import 'server-only';
import type { HeaderSource } from '@/lib/requestHeaders';
import { buildBackendAuthConfig } from '@/lib/ssrRequestAuth';
import service from '@/service';
import type { User } from '@/types/user';

// 서버에서 현재 요청의 쿠키로 프로필을 조회한다(admin 서버 가드용).
// 401/403(미인증)은 null — 호출 측이 redirect('/login') 을 try 밖에서 부른다. 그 외(네트워크·5xx)는 throw → error.tsx/onRequestError
export async function fetchProfileOrNull(headers: HeaderSource): Promise<User | null> {
  try {
    return (await service.user.profile(buildBackendAuthConfig(headers))).data ?? null;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 403) return null;
    throw error;
  }
}
