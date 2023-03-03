import PostComponent from "../../components/post/PostComponent"
import service from "../../service"
import {getAllTags} from "../../store/actions/tagActions"
import Head from "next/head";

export default function PostPage({children, post, prevNext, meta}) {


    return (
        <>
            <Head>
                <title>{meta.title}</title>
                <meta name='description' content={meta.description}/>
                <meta name="keyword" content={meta.tags}/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content={meta.page}/>
                <meta property="og:title" content={meta.title}/>
                <meta property="og:image" content={meta.logo} />
                <meta property="og:description" content={meta.description}/>
                <meta property="og:site_name" content="Skyscape"/>
            </Head>
            <PostComponent post={post} prevNext={prevNext}/>
        </>
    )
}

PostPage.getInitialProps = async (ctx) => {
    // tag 정보를 새로 가져온다 
    const store = ctx.store
    await store.dispatch(getAllTags())

    const postId = ctx.query.id
    const postReq = await service.post.getPost({postId})
    const prevNextReq = await service.post.getPrevNext({postId})

    const [post, prevNext] = await Promise.all([
        postReq,
        prevNextReq
    ])

    return {
        post: post.data,
        prevNext: prevNext.data,
        meta: {
            title: post?.data?.subject,
            description: post?.data?.body?.replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/img, " ").replace(/&nbsp;/img, "").replace(/\r\n/img, " ").replace(/\s+/img, " ").trim(),
            tags: post?.data?.tag?.map(tag => tag.name).join(', '),
            page: process.env.META_URL + "/post/" + postId,
            logo : process.env.META_URL + "/images/og-logo.png"
        }
    }
}
