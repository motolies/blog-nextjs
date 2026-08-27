import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { ensureMocksArmed } from '@/lib/ensureMocksArmed';
import { buildForwardedHeaders } from '@/lib/forwardedHeaders';
import { currentTraceparent } from '@/lib/sentryTrace';

/**
 * /sitemap.xml — MetadataRoute.Sitemap 관용구로 URL·Content-Type 을 Next 가 보장한다. headers() 사용으로 동적 렌더.
 * raw fetch 라 axios 인터셉터를 타지 않으므로 traceparent 를 직접 싣는다(기존 sitemap.xml.tsx 와 동일).
 * raw fetch 는 MSW 패치가 Turbopack 리빌드로 풀리는 함정에도 노출되므로 Route Handler 와 같이 ensureMocksArmed(프로덕션 no-op)를 선행한다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureMocksArmed();

  const traceparent = currentTraceparent();
  const response = await fetch(`${getBackendBaseUrl()}/api/post/public-content`, {
    headers: {
      ...buildForwardedHeaders(await headers()),
      ...(traceparent ? { traceparent } : {}),
    },
    cache: 'no-store',
  });
  // 백엔드 응답은 {timestamp, path, status, data} 봉투 — raw fetch 라 axios 인터셉터 평탄화가 없다
  const ids: Array<string | number> = (await response.json()).data;

  const base = process.env.META_URL as string;
  return [{ url: base }, ...ids.map((id) => ({ url: `${base}/post/${id}` }))];
}
