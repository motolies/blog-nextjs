import PostComponent from "../components/post/PostComponent"
import service from "../service"

export default function Index({post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}


Index.getInitialProps = async (ctx) => {
    const post = await service.post.mainPost()
        .then(res => res.data)
    return {
        post
    }
}
