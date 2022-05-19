import PostModifyComponent from "../../../components/post/PostModifyComponent"
import service from "../../../service"
import {Box} from "@mui/material"
import {useDispatch, useSelector} from "react-redux"
import {useEffect} from "react"
import {loadContentForModify} from "../../../store/actions/postActions"
import {useRouter} from "next/router"

export default function ModifyPostPage() {
    const router = useRouter()
    const dispatch = useDispatch()
    const postId = router.query.id

    useEffect(() => {
        dispatch(loadContentForModify({postId: postId}))
    }, [])


    return (
        <Box sx={{m: 2}}>
            <PostModifyComponent/>
        </Box>
    )
}
