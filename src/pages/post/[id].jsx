import PostComponent from "../../components/post/PostComponent"
import service from "../../service"
import {getAllTags} from "../../store/actions/tagActions"
import Head from "next/head";
import {wrapper} from "../../store";

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
        const cookie = context.req?.headers?.cookie
        const headers = cookie ? { Cookie: cookie } : undefined
        // 두 요청을 동시에 실행
        const [postResult, prevNextResult] = await Promise.allSettled([
            service.post.getPost({ postId }, headers ? { headers } : undefined),
            service.post.getPrevNext({ postId }, headers ? { headers } : undefined)
        ]);

        // 각 요청의 결과 상태에 따라 처리
        const post = postResult.status === 'fulfilled' ? postResult.value.data : null;
        const prevNext = prevNextResult.status === 'fulfilled' ? prevNextResult.value.data : null;

        // post가 없을 경우, 원하는 대체 로직을 추가할 수 있음 (예: 에러 페이지, 기본 데이터 등)
        if (!post) {
            console.error('postReq 요청 중 오류 발생:', postResult.reason);
            // 여기서 에러를 던지거나, 기본값을 반환할 수 있음.
        }

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
