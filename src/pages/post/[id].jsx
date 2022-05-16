import PostComponent from "../../components/post/PostComponent"
import service from "../../service"

export default function PostPage({children, post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}

PostPage.getInitialProps = async (ctx) => {
    const postId = ctx.query.id
    const post = await service.post.getPost({postId})
        .then(res => res.data)
    return {
        post
    }
}