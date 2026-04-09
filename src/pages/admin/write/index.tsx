import PostModifyComponent from "../../../components/post/PostModifyComponent"
import {useEffect} from "react"
import {usePostFormStore} from "../../../store/usePostFormStore"
import AdminPageFrame from "../../../components/layout/admin/AdminPageFrame"

export default function NewPostPage() {
    const loadForModify = usePostFormStore(s => s.loadForModify)
    useEffect(() => {
        loadForModify()
    }, [loadForModify])

    return (
        <AdminPageFrame contentClassName="min-h-0">
            <PostModifyComponent/>
        </AdminPageFrame>
    )
}
