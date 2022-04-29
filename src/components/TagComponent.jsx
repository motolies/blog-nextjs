import {Box, Grid} from "@mui/material"
import {useEffect, useState} from "react"
import {useSelector} from "react-redux"
import {useSnackbar} from "notistack"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import DeleteConfirm from "./DeleteConfirm"

const Tag = (props) => {
    const userState = useSelector((state) => state.user)
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    // TODO : 이름에는 태그이름으로 검색한 결과가 나오는 페이지로 이동
    // TODO : 권한이 있는 경우 삭제기능 활성화

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
            enqueueSnackbar(`이걸로 태그명으로 검색페이지로 넘겨버린다아, ${props.name}`, {variant: "success"})
        }
    }

    return (
        <Box
            display="flex-inline"
            sx={{
                p: 1
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

export default function TagComponent({tagList, deletePostTag}) {
    const userState = useSelector((state) => state.user)
    const [tags, setTags] = useState(tagList)

    useEffect(() => {
        console.log('요때 변경된다?')
        setTags(tagList)
    }, [...tagList])

    return (
        <Grid
            container
            direction="row"
            spacing={2}
        >
            <Grid item>
                <h3>#tags</h3>
            </Grid>

            {!(userState.isAuthenticated && userState.user.userName) ? null :
                <Grid item xs={12}>
                    태그 추가 기능 넣을 곳
                </Grid>
            }

            <Grid item xs={12}>
                <Box
                    display="flex"
                    sx={{
                        mr: 1
                        , width: '100%'
                        , flexWrap: 'wrap'
                    }}
                >
                    {tags.map((tag) => <Tag key={tag.id} id={tag.id} name={tag.name} deletePostTag={deletePostTag}/>)}
                </Box>
            </Grid>
        </Grid>
    )
}