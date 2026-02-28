import PostModifyComponent from "../../../components/post/PostModifyComponent"
import {useDispatch} from "react-redux"
import {useEffect} from "react"
import {loadContentForModify} from "../../../store/actions/postActions"
import {useRouter} from "next/router"
import AdminPageFrame from "../../../components/layout/admin/AdminPageFrame"

export default function ModifyPostPage() {
    const router = useRouter()
    const dispatch = useDispatch()
    const postId = router.query.id

    useEffect(() => {
        dispatch(loadContentForModify({postId: postId}))
    }, [])

    return (
        <AdminPageFrame contentClassName="min-h-0">
            <PostModifyComponent/>
        </AdminPageFrame>
    )
}
