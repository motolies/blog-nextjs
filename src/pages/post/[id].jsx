import PostComponent from "../../components/post/PostComponent"
import axiosClient from "../../service/axiosClient"
import service from "../../service"
import {LOAD_USER_REQUEST} from "../../store/types/userTypes"
import Index from "../index"

export default function Post({children, post}) {
    return (
        <>
            <PostComponent post={post}/>
        </>
    )
}

Post.getInitialProps = async (ctx) => {
    const postId = ctx.query.id
    const post = await service.post.getPost({postId})
        .then(res => res.data)
    return {
        post
    }
}