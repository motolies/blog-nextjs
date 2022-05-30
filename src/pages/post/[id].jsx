import PostComponent from "../../components/post/PostComponent"
import service from "../../service"

export default function PostPage({children, post, prevNext}) {
    return (
        <>
            <PostComponent post={post} prevNext={prevNext}/>
        </>
    )
}

PostPage.getInitialProps = async (ctx) => {
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