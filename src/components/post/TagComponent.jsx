import {Box} from "@mui/material"
import {useState} from "react"
import {useSelector} from "react-redux"
import {useSnackbar} from "notistack"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import DeleteConfirm from "../confirm/DeleteConfirm"
import {searchObjectInit} from "../../model/searchObject"
import {base64Encode} from "../../util/base64Util"
import {useRouter} from "next/router"

export const Tag = (props) => {
    const router = useRouter()
    const userState = useSelector((state) => state.user)
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [question, setQuestion] = useState('')

    const showDeleteConfirmDialog = (e) => {
        e.stopPropagation()
        setQuestion(`이 포스트에서 ${props.name} 태그를 삭제하시겠습니까?`)
        setShowDeleteConfirm(true)
    }

    const deleteTag = async () => {
        await props.deletePostTag({tagId: props.id})
        setShowDeleteConfirm(false)
    }
    const deleteTagCancel = () => {
        setShowDeleteConfirm(false)
    }

    const searchTagName = (e) => {
        if (e.currentTarget === e.target) {
            const condition = {
                ...searchObjectInit,
                ...{
                    tags: [{id:props.id, name: props.name}],
                }
            }
            router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
        }
    }

    return (
        <Box
            display="flex-inline"
            sx={{
                m: 1
                , p: 1
                , background: "rgba(57, 138, 185, 0.1)"
                , '&:hover': {
                    background: "rgba(57, 138, 185, 0.4)"
                }
                , cursor: "pointer"
            }}
            onClick={searchTagName}
        >
            {props.name}
            {!(userState.isAuthenticated && userState.user.userName) ? null :
                <IconButton aria-label="delete" onClick={showDeleteConfirmDialog}>
                    <DeleteIcon/>
                </IconButton>
            }
            <DeleteConfirm open={showDeleteConfirm} question={question} onConfirm={deleteTag} onCancel={deleteTagCancel}/>
        </Box>
    )
}
