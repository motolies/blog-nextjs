import PostComponent from "../components/post/PostComponent"
import service from "../service"

export default function IndexPage({post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}


IndexPage.getInitialProps = async (ctx) => {
    const post = await service.post.mainPost()
        .then(res => res.data)
    return {
        post
    }
}
