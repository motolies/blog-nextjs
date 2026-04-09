import PostComponent from "../../components/post/PostComponent"
import service from "../../service"
import {tagKeys} from "../../hooks/useTags"
import Head from "next/head"
import {buildBackendAuthConfig} from "../../lib/ssrRequestAuth"
import {dehydrate, QueryClient} from '@tanstack/react-query'

interface PostMeta {
    title: string | null
    description: string | null
    tags: string | null
    page: string
    logo: string
}

interface PostPageProps {
    children?: React.ReactNode
    post: any
    prevNext: any
    meta: PostMeta
}

export default function PostPage({children, post, prevNext, meta}: PostPageProps) {


    return (
        <>
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description ?? undefined}/>
                <meta name="keywords" content={meta.tags ?? undefined}/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content={meta.page}/>
                <meta property="og:title" content={meta.title ?? undefined}/>
                <meta property="og:image" content={meta.logo}/>
                <meta property="og:description" content={meta.description ?? undefined}/>
                <meta property="og:site_name" content="Skyscape"/>
            </Head>
            <PostComponent post={post} prevNext={prevNext}/>
        </>
    )
}

export const getServerSideProps = async (context: import('next').GetServerSidePropsContext) => {
    const queryClient = new QueryClient()
    const postId = context.params!.id as string
    const authConfig = buildBackendAuthConfig(context.req)

    // tag prefetch와 post/prevNext를 동시에 실행
    const [, postResult, prevNextResult] = await Promise.allSettled([
        queryClient.prefetchQuery({
            queryKey: tagKeys.list(),
            queryFn: () => service.tag.allTags().then(res => res.data),
        }),
        service.post.getPost({postId}, authConfig),
        service.post.getPrevNext({postId}, authConfig),
    ])

    if (postResult.status === 'rejected') {
        const status = (postResult.reason as any)?.response?.status
        if (status === 400 || status === 403 || status === 404) {
            return {notFound: true}
        }
        throw postResult.reason
    }

    const post = postResult.value?.data ?? null
    if (!post) {
        return {notFound: true}
    }

    const prevNext = prevNextResult.status === 'fulfilled' ? prevNextResult.value.data : null

    return {
        props: {
            post,
            prevNext,
            dehydratedState: dehydrate(queryClient),
            meta: {
                title: post?.subject ?? null,
                description: post?.body
                    ? post.body.replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/img, " ")
                        .replace(/&nbsp;/img, "")
                        .replace(/\r\n/img, " ")
                        .replace(/\s+/img, " ")
                        .trim()
                    : null,
                tags: post?.tags?.map((tag: any) => tag.name).join(', ') ?? null,
                page: process.env.META_URL + "/post/" + postId,
                logo: process.env.META_URL + "/images/og-logo.png"
            }
        }
    }
}
