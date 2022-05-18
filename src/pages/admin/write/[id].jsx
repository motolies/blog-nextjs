import PostModifyComponent from "../../../components/post/PostModifyComponent"
import service from "../../../service"
import {Box} from "@mui/material"
import PostPage from "../../post/[id]"

export default function ModifyPostPage({post}) {
    return (
        <Box sx={{m: 2}}>
            <PostModifyComponent post={post}/>
        </Box>
    )
}

ModifyPostPage.getInitialProps = async (ctx) => {
    const postId = ctx.query.id
    const post = await service.post.getPost({postId})
        .then(res => res.data)
    return {
        post
    }
}