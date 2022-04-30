import {Box, Grid} from "@mui/material"
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PublicIcon from '@mui/icons-material/Public'
import PublicOffIcon from '@mui/icons-material/PublicOff'
import DeleteConfirm from "../confirm/DeleteConfirm"
import {useEffect, useState} from "react"
import service from "../../service"
import {useRouter} from "next/router"
import {useSnackbar} from "notistack"
import {useSelector} from "react-redux"
import PublicConfirm from "../confirm/PublicConfirm"
import TagGroupComponent from "./TagGroupComponent"


export default function PostComponent({post}) {
    const router = useRouter()
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const userState = useSelector((state) => state.user)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showPublicConfirm, setShowPublicConfirm] = useState(false)
    const [postPublic, setPostPublic] = useState(post.public)
    const [tags, setTags] = useState(post.tag)
    const [publicConfirmQuestion, setPublicConfirmQuestion] = useState('')

    const showDeleteConfirmDialog = () => {
        setShowDeleteConfirm(true)
    }
    const showPublicConfirmDialog = () => {
        if (postPublic) {
            setPublicConfirmQuestion('현재 포스트를 비공개 상태로 변경하시겠습니까?')
        } else {
            setPublicConfirmQuestion('현재 포스트를 공개 상태로 변경하시겠습니까?')
        }
        setShowPublicConfirm(true)
    }
    const deletePost = async () => {
        await service.post.deletePost({postId: post.id})
            .then(res => {
                if (res.data.id === post.id.toString()) {
                    enqueueSnackbar("삭제에 성공하였습니다.", {variant: "success"})
                    router.push("/")
                }
            }).catch(() => {
                enqueueSnackbar("삭제에 실패하였습니다.", {variant: "error"})
            })

        setShowDeleteConfirm(false)
    }
    const deletePostCancel = () => {
        setShowDeleteConfirm(false)
    }
    const publicPostCancel = () => {
        setShowPublicConfirm(false)
    }
    const onEditor = () => {
        enqueueSnackbar("수정기능 생기겄지.....", {variant: "warning"})
        // router.push(`/editor?id=${post.id}`)
    }

    const setPublicStatus = async () => {
        if (postPublic) {
            await service.post.setPublicPost({postId: post.id, publicStatus: false}).then(res => {
                if (res.status === 200) {
                    setPostPublic(false)
                    enqueueSnackbar("공개를 비공개로 변경하였습니다.", {variant: "success"})
                }
            }).catch(() => {
                enqueueSnackbar("공개를 비공개로 변경하지 못했습니다.", {variant: "error"})
            })
        } else {
            await service.post.setPublicPost({postId: post.id, publicStatus: true}).then(res => {
                if (res.status === 200) {
                    setPostPublic(true)
                    enqueueSnackbar("비공개를 공개로 변경하였습니다.", {variant: "success"})
                }
            }).catch(() => {
                enqueueSnackbar("비공개를 공개로 변경하지 못했습니다.", {variant: "error"})
            })
        }
        setShowPublicConfirm(false)
    }

    const deletePostTag = async ({tagId}) => {
        await service.post.deleteTag({postId: post.id, tagId: tagId})
            .then(res => {
                if (res.status === 200) {
                    enqueueSnackbar("태그 삭제에 성공하였습니다.", {variant: "success"})
                    const newTags = tags.filter((tag) => {
                        return tag.id !== tagId
                    })
                    setTags(newTags)
                }
            }).catch(() => {
                enqueueSnackbar("태그 삭제에 실패하였습니다.", {variant: "error"})
            })
    }

    if (post?.id !== 0 && post?.id > 0) {
        return (
            <>
                <div className="post">
                    <div>
                        <h2>{post.subject}</h2>
                    </div>
                    <Grid container
                          direction="row"
                          spacing={2}>
                        <Grid item={true} xs={8}>
                            <h3>{post.categoryName}</h3>
                        </Grid>
                        <Grid item={true} xs={4} align={'right'}>

                            {!(userState.isAuthenticated && userState.user.userName) ? null :
                                <>
                                    {postPublic ?
                                        <IconButton onClick={showPublicConfirmDialog}>
                                            <PublicIcon/>
                                        </IconButton>
                                        :
                                        <IconButton onClick={showPublicConfirmDialog}>
                                            <PublicOffIcon/>
                                        </IconButton>
                                    }
                                    <IconButton aria-label="edit" onClick={onEditor}>
                                        <EditIcon/>
                                    </IconButton>
                                    <IconButton aria-label="delete" onClick={showDeleteConfirmDialog}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </>
                            }

                        </Grid>
                    </Grid>
                    <hr/>
                    <Box sx={{mt: 5, mb: 5}}>
                        <div className="content" dangerouslySetInnerHTML={{__html: post.body}}/>
                    </Box>
                    <hr/>
                    <TagGroupComponent tagList={tags} deletePostTag={deletePostTag}/>
                </div>
                <DeleteConfirm open={showDeleteConfirm} question={'현재 포스트를 삭제하시겠습니까?'} onConfirm={deletePost} onCancel={deletePostCancel}/>
                <PublicConfirm open={showPublicConfirm} question={publicConfirmQuestion} onConfirm={setPublicStatus} onCancel={publicPostCancel}/>
            </>
        )
    } else {
        return (
            <div className="post">
                <div>
                    <h2>No post found</h2>
                </div>
            </div>
        )
    }

}

