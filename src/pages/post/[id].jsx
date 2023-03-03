import PostComponent from "../../components/post/PostComponent"
import service from "../../service"
import {getAllTags} from "../../store/actions/tagActions"
import Head from "next/head";

export default function PostPage({children, post, prevNext}) {

    const description = post?.body?.replace(/<\/?[a-z][a-z0-9]*[^<>]*>|<!--.*?-->/img, "").replace(/&nbsp;/img, "")
    const tags = post?.tag?.map(tag => tag.name).join(', ')

    return (
        <>
            <Head>
                <title>{post.subject}</title>
                <meta name='description' content={description} />
                <meta name="keyword" content={tags}/>
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
        prevNext: prevNext.data
    }
}
