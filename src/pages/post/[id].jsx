import PostComponent from "../../components/post/PostComponent"
import service from "../../service"
import {getAllTags} from "../../store/actions/tagActions"

export default function PostPage({children, post, prevNext}) {
    return (
        <>
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
