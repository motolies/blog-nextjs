import PostModifyComponent from "../../../components/post/PostModifyComponent"
import {Box} from "@mui/material"
import {useDispatch} from "react-redux"
import {useEffect} from "react"
import {loadContentForModify} from "../../../store/actions/postActions"

export default function NewPostPage() {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(loadContentForModify({}))
    }, [])

    return (
        <Box sx={{m: 2}}>
            <PostModifyComponent/>
        </Box>
    )
}
