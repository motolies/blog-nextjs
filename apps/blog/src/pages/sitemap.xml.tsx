import type { GetServerSidePropsContext } from 'next';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { buildForwardedHeaders } from '@/lib/forwardedHeaders';
import { currentTraceparent } from '@/lib/sentryTrace';

function generateSiteMap(posts: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!--We manually set the two URLs we know already-->
     <url>
       <loc>${process.env.META_URL}</loc>
     </url>
     ${posts
       .map((id) => {
         return `
       <url>
           <loc>${`${process.env.META_URL}/post/${id}`}</loc>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  // raw fetch 라 axiosClient 인터셉터를 타지 않는다 — traceparent 를 직접 실어 백엔드 로그와 traceId 를 맞춘다
  const traceparent = currentTraceparent();
  const request = await fetch(`${getBackendBaseUrl()}/api/post/public-content`, {
    headers: { ...buildForwardedHeaders(req), ...(traceparent ? { traceparent } : {}) },
  });
  // 백엔드 응답은 {timestamp, path, status, data} 봉투 — raw fetch 라 axios 인터셉터 평탄화가 없다
  const posts = (await request.json()).data;

  const sitemap = generateSiteMap(posts);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
