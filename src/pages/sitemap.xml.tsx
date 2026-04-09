import {getBackendBaseUrl} from "../lib/backendUrl"
import type { GetServerSidePropsContext } from 'next'

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

export async function getServerSideProps({res}: GetServerSidePropsContext) {
    const request = await fetch(getBackendBaseUrl() + '/api/post/public-content');
    const posts = await request.json();

    const sitemap = generateSiteMap(posts);

    res.setHeader('Content-Type', 'text/xml');
    res.write(sitemap);
    res.end();

    return {
        props: {},
    };
}

export default SiteMap;
