import PostComponent from "../../components/post/PostComponent"
import service from "../../service"
import {getAllTags} from "../../store/actions/tagActions"
import Head from "next/head";
import {wrapper} from "../../store";
import {buildBackendAuthConfig} from "../../lib/ssrRequestAuth"

export default function PostPage({children, post, prevNext, meta}) {


    return (
        <>
            <Head>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description}/>
                <meta name="keywords" content={meta.tags}/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content={meta.page}/>
                <meta property="og:title" content={meta.title}/>
                <meta property="og:image" content={meta.logo}/>
                <meta property="og:description" content={meta.description}/>
                <meta property="og:site_name" content="Skyscape"/>
            </Head>
            <PostComponent post={post} prevNext={prevNext}/>
        </>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) => async (context) => {
        // tag 정보를 새로 가져온다
        await store.dispatch(getAllTags())

        const postId = context.params.id
        const authConfig = buildBackendAuthConfig(context.req)
        // 두 요청을 동시에 실행
        const [postResult, prevNextResult] = await Promise.allSettled([
            service.post.getPost({ postId }, authConfig),
            service.post.getPrevNext({ postId }, authConfig)
        ]);

        if (postResult.status === 'rejected') {
            const status = postResult.reason?.response?.status
            if (status === 400 || status === 403 || status === 404) {
                return {
                    notFound: true
                }
            }
            throw postResult.reason
        }

        const post = postResult.value?.data ?? null
        if (!post) {
            return {
                notFound: true
            }
        }

        const prevNext = prevNextResult.status === 'fulfilled' ? prevNextResult.value.data : null;

        return {
            props: {
                post: post,
                prevNext: prevNext,
                meta: {
                    title: post?.subject ?? null,
                    description: post?.body
                        ? post.body.replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/img, " ")
                            .replace(/&nbsp;/img, "")
                            .replace(/\r\n/img, " ")
                            .replace(/\s+/img, " ")
                            .trim()
                        : null,
                    tags: post?.tags?.map(tag => tag.name).join(', ') ?? null,
                    page: process.env.META_URL + "/post/" + postId,
                    logo: process.env.META_URL + "/images/og-logo.png"
                }
            }
        }
    }
)
