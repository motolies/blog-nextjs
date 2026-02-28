import PostModifyComponent from "../../../components/post/PostModifyComponent"
import {useDispatch} from "react-redux"
import {useEffect} from "react"
import {loadContentForModify} from "../../../store/actions/postActions"
import AdminPageFrame from "../../../components/layout/admin/AdminPageFrame"

export default function NewPostPage() {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(loadContentForModify({}))
    }, [])

    return (
        <AdminPageFrame contentClassName="min-h-0">
            <PostModifyComponent/>
        </AdminPageFrame>
    )
}
