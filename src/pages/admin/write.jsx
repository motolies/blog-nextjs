import PostModifyComponent from "../../components/post/PostModifyComponent"
import service from "../../service"
import {Box} from "@mui/material"

export default function WritePage({post}) {
    return (
        <Box sx={{m: 2}}>
            <PostModifyComponent post={post}/>
        </Box>
    )
}

WritePage.getInitialProps = async () => {
    const post = await service.post.new()
        .then(res => res.data)
    return {
        post
    }
}