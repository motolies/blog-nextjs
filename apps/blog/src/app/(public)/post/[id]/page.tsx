import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import PostComponent from '@/components/post/PostComponent';
import ReadingProgressBar from '@/components/post/ReadingProgressBar';
import { tagKeys } from '@/hooks/useTags';
import { buildBackendAuthConfig } from '@/lib/ssrRequestAuth';
import service from '@/service';

// Next 16: params 는 Promise
type Params = Promise<{ id: string }>;

const META_URL = process.env.META_URL;

// generateMetadata 와 page 가 같은 요청에서 한 번만 호출하도록 React cache 로 요청 단위 메모이즈한다.
// ⚠️ cache 의 인자는 원시값(postId)만 — authConfig 객체를 인자로 넘기면 참조가 달라 메모가 조용히 실패한다. headers() 는 안에서 부른다.
// 400/403/404 는 null(→ notFound), 그 외는 throw(→ error.tsx/onRequestError)
const loadPost = cache(async (postId: string) => {
  const authConfig = buildBackendAuthConfig(await headers());
  try {
    return (await service.post.getPost({ postId }, authConfig)).data ?? null;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 400 || status === 403 || status === 404) return null;
    throw error;
  }
});

// 본문 HTML 을 걷어내 메타 description 으로 쓸 평문을 만든다 — 태그·주석·&nbsp; 제거 후 공백 정규화
function toDescription(body: string | null | undefined): string | undefined {
  if (!body) return undefined;
  return body
    .replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/gim, ' ')
    .replace(/&nbsp;/gim, '')
    .replace(/\r\n/gim, ' ')
    .replace(/\s+/gim, ' ')
    .trim();
}

// 기존 <Head> 의 title/description/keywords/og:* 를 Metadata 로 — post 가 없으면 빈 객체(루트 기본 메타 유지, 본문은 notFound)
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id);
  if (!post) return {};

  const page = `${META_URL}/post/${id}`;
  const title: string | undefined = post.subject ?? undefined;
  const description = toDescription(post.body);
  return {
    title,
    description,
    keywords: post.tags?.map((tag: { name: string }) => tag.name).join(', ') || undefined,
    openGraph: {
      type: 'website',
      url: page,
      title,
      description,
      siteName: 'Skyscape',
      images: [`${META_URL}/images/og-logo.png`],
    },
  };
}

/**
 * 포스트 상세 — async 서버 컴포넌트. 태그 프리페치·이전/다음 조회를 포스트 조회와 병렬로 돌리고,
 * 페이지 단위 HydrationBoundary 로 클라이언트 react-query 캐시에 태그 목록을 넘긴다(기존 dehydratedState).
 */
export default async function PostPage({ params }: { params: Params }) {
  const { id } = await params;
  const authConfig = buildBackendAuthConfig(await headers());
  // 요청마다 새 QueryClient — 사용자 간 캐시 격리. makeQueryClient 의 retry:1 은 브라우저용이라 서버에선 쓰지 않는다
  const queryClient = new QueryClient();

  const [post, prevNext] = await Promise.all([
    loadPost(id),
    service.post
      .getPrevNext({ postId: id }, authConfig)
      .then((res) => res.data)
      .catch(() => null),
    queryClient.prefetchQuery({
      queryKey: tagKeys.list(),
      queryFn: () => service.tag.allTags().then((res) => res.data),
    }),
  ]);

  // try/catch 밖에서 호출 — notFound 는 throw 로 동작한다
  if (!post) notFound();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReadingProgressBar />
      <PostComponent post={post} prevNext={prevNext} />
    </HydrationBoundary>
  );
}
