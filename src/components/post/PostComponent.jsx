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
import Link from "next/link"
import {searchObjectInit} from "../../model/searchObject"
import {base64Encode} from "../../util/base64Util"
import {fileLink} from "../../util/fileLink"
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import {usePostNavigationShortcut} from "../../util/usePostNavigationShortcut"

export default function PostComponent({post, prevNext}) {
    const router = useRouter()
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const userState = useSelector((state) => state.user)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showPublicConfirm, setShowPublicConfirm] = useState(false)
    const [postPublic, setPostPublic] = useState(post.isPublic)
    const [tags, setTags] = useState(post.tag)
    const [publicConfirmQuestion, setPublicConfirmQuestion] = useState('')
    const [postBody, setPostBody] = useState()

    const onKeyPress = (event) => {
        if (event.ctrlKey && event.key === 'ArrowLeft') {
            if (prevNext.prev !== 0)
                router.push(`/post/${prevNext.prev}`)
        } else if (event.ctrlKey && event.key === 'ArrowRight') {
            if (prevNext.prev !== 0)
                router.push(`/post/${prevNext.next}`)
        }
    }

    usePostNavigationShortcut(['ArrowLeft', 'ArrowRight'], onKeyPress)

    useEffect(() => {
        setPostPublic(post.isPublic)
        setTags(post.tag)
    }, [post])

    useEffect(() => {
        postImagePopup()
        postIconChange()
    }, [postBody])

    useEffect(() => {
        const doc = new DOMParser().parseFromString(post.body, 'text/html')
        initVsCode(doc)
        setPostBody(doc.head.innerHTML + doc.body.innerHTML)
    }, [post.body])

    const postIconChange = () => {
        document.querySelectorAll('i.fa-file').forEach(icon => {
            if (icon.parentNode.nodeName === 'A') {
                const url = icon.parentNode.getAttribute('href')
                const name = icon.parentNode.innerHTML.replaceAll('<i class="far fa-file"></i>', '').trim()
                icon.parentNode.outerHTML = fileLink(url, name)
            }
        })

    }

    const postImagePopup = () => {
        const imgs = document.querySelectorAll('#post-content img')
        for (let i = 0; i < imgs.length; i++) {
            let currentImg = imgs[i]
            currentImg.addEventListener('click', function (e) {
                const imgPopupHtml = `<html>
                                  <head>
                                    <meta name="viewport" content="user-scalable=yes, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, width=device-width" />
                                  </head>
                                  <body style="margin:0; background:#000;height:100%;" onclick="javascript:window.close('simpleLightbox');">
                                      <table border="0" width="100%" height="100%">
                                          <tr>
                                              <td valign="middle" align="center">
                                                <img style="position:relative;z-index:2;width:100%" src="${currentImg.src}"/>
                                              </td>
                                          </tr>
                                      </table>
                                  </body>
                                  </html>`
                window.open('', 'simpleLightbox').document.write(imgPopupHtml)
            })
        }
    }


    const initVsCode = (doc) => {
        Array.prototype.slice.call(doc.getElementsByTagName("div"), 0).forEach(div => {
            if (div.style && div.style.backgroundColor && div.style.backgroundColor == "rgb(30, 30, 30)") {
                if (getRootElement(div)) {
                    div.style.padding = "15px"
                    div.style.scrollPadding = "15px"
                    div.style.overflowX = "scroll"
                    // TODO : overflow 되는 부분의 right padding이 동작하지 않는다
                }
            }
        })
    }
    const getRootElement = (element) => {
        let rtn = true
        while (element.parentNode) {
            if (element.parentNode.style && element.parentNode.style.backgroundColor && element.parentNode.style.backgroundColor == "rgb(30, 30, 30)") {
                rtn = false
                break
            }
            element = element.parentNode
        }
        return rtn
    }

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
                    // router.push("/")
                    location.reload()
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
        router.push(`/admin/write/${post.id}`)
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

    const searchCategory = () => {
        const condition = {
            ...searchObjectInit,
            ...{
                categories: [{id: post.categoryId, name: post.categoryName}],
            }
        }
        return `/search?q=${base64Encode(JSON.stringify(condition))}`
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
                            <Link href={searchCategory()}>
                                <a>
                                    <Box sx={{
                                        px: 3
                                        , py: 1
                                        , background: "rgba(17, 153, 142, .2)"
                                        , borderRadius: '.5rem'
                                        , display: 'inline-flex'
                                        , fontSize: '1.5rem'
                                    }}>
                                        {post.categoryName}
                                    </Box>
                                </a>
                            </Link>
                        </Grid>
                        <Grid item={true} xs={4} align={'right'} sx={{alignItems: 'center', display: 'flex'}}>
                            {!(userState.isAuthenticated && userState.user.userName) ? null :
                                <>
                                    {postPublic ?
                                        <IconButton onClick={showPublicConfirmDialog} sx={{display: 'flex', marginLeft: 'auto'}}>
                                            <PublicIcon/>
                                        </IconButton>
                                        :
                                        <IconButton onClick={showPublicConfirmDialog} sx={{display: 'flex', marginLeft: 'auto'}}>
                                            <PublicOffIcon/>
                                        </IconButton>
                                    }
                                    <IconButton aria-label="edit" onClick={onEditor} sx={{display: 'flex'}}>
                                        <EditIcon/>
                                    </IconButton>
                                    <IconButton aria-label="delete" onClick={showDeleteConfirmDialog} sx={{display: 'flex'}}>
                                        <DeleteIcon/>
                                    </IconButton>
                                </>
                            }

                        </Grid>
                    </Grid>
                    <hr/>
                    <TagGroupComponent postId={post.id} tagList={tags} clickable={true}/>
                    <hr/>
                    <Box sx={{mt: 5, mb: 5}}>
                        <Box className="content" id={'post-content'} dangerouslySetInnerHTML={{__html: postBody}}
                             sx={{overflowWrap: 'break-word'}}/>
                    </Box>
                    <Box sx={{pt: 5, pb: 5, display: 'flex', clear: 'both'}}>
                        {prevNext.prev === 0 ? null :
                            <IconButton onClick={() => router.push(`/post/${prevNext.prev}`)} sx={{display: 'inline-flex'}}>
                                <ArrowBackIosNewIcon/>
                            </IconButton>}
                        {prevNext.next === 0 ? null :
                            <IconButton onClick={() => router.push(`/post/${prevNext.next}`)} sx={{display: 'inline-flex', marginLeft: 'auto'}}>
                                <ArrowForwardIosIcon/>
                            </IconButton>
                        }
                    </Box>

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

