// https://mui.com/material-ui/react-drawer/#responsive-drawer
import {Button, Grid, MenuItem, TextField} from "@mui/material"
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import {useSnackbar} from "notistack"
import {useEffect, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import {POST_LOCAL_MODIFY_BODY, POST_LOCAL_MODIFY_CATEGORY_ID, POST_LOCAL_MODIFY_FILE, POST_LOCAL_MODIFY_PUBLIC, POST_LOCAL_MODIFY_SUBJECT} from "../../store/types/postTypes"
import {uuidV4Generator} from "../../util/uuidUtil"
import DynamicEditor from "../editor/DynamicEditor"
import service from "../../service"
import {cancelLoading, setLoading} from "../../store/actions/commonActions"
import {useRouter} from "next/router"
import TagGroupComponent from "./TagGroupComponent"
import FileUploadComponent from "../editor/FileUploadComponent"
import {FileComponent} from "./FileComponent"
import {fileLink} from "../../util/fileLink"

export default function PostModifyComponent() {
    const router = useRouter()
    const post = useSelector(state => state.post.modifyPost)
    const dispatch = useDispatch()
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const [insertData, setInsertData] = useState('')
    const [triggerGetData, setTriggerGetData] = useState('')
    const [saveAble, setSaveAble] = useState(false)
    const publicOptions = [{value: true, label: '공개'}, {value: false, label: '비공개'}]
    const [tags, setTags] = useState([])

    useEffect(() => {
        setTags(post.tag)
    }, [post.tag])

    useEffect(() => {
        if (!saveAble)
            return

        dispatch(setLoading())
        service.post.save({post: post}).then(res => {
            router.push(`/post/${post.id}`)
        }).catch(err => {
            enqueueSnackbar("저장에 실패하였습니다.", {variant: "error"})
            console.log("content save error", err)
        }).finally(() => {
            dispatch(cancelLoading())
        })
    }, [post, saveAble])

    const onChangeCategory = (category) => {
        if (category?.id) {
            dispatch({
                type: POST_LOCAL_MODIFY_CATEGORY_ID,
                categoryId: category.id,
            })
        } else {
            enqueueSnackbar("카테고리는 필수로 선택해야 합니다.", {variant: "error"})
        }
    }

    const onChangeBody = (body) => {
        dispatch({
            type: POST_LOCAL_MODIFY_BODY,
            body: body,
        })
        setSaveAble(true)
    }

    const onChangeFile = (file) => {
        if (file === undefined)
            return

        const body = new FormData()
        body.append("file", file)
        body.append("contentId", post.id)
        dispatch(setLoading())
        service.file.upload({formData: body})
            .then(res => {
                dispatch({
                    type: POST_LOCAL_MODIFY_FILE,
                    file: [...post.file, res.data],
                })
                enqueueSnackbar("파일 업로드에 성공하였습니다.", {variant: "success"})
            })
            .catch(err => {
                enqueueSnackbar("파일 업로드에 실패하였습니다.", {variant: "error"})
            })
            .finally(() => {
                dispatch(cancelLoading())
            })

    }

    const onDeleteFile = (file) => {
        dispatch(setLoading())
        service.file.delete({fileId: file.id})
            .then(res => {
                const newFile = post.file.filter((f) => f.id !== res.data.id)
                dispatch({
                    type: POST_LOCAL_MODIFY_FILE,
                    file: newFile,
                })
                enqueueSnackbar("파일을 삭제하였습니다.", {variant: "success"})
            })
            .catch(err => {
                enqueueSnackbar("파일 삭제에 실패하였습니다.", {variant: "error"})
            })
            .finally(() => {
                dispatch(cancelLoading())
            })
    }

    const onInsertFile = (file) => {
        if (file.type.startsWith('image')) {
            const html = `<figure class="image">
                                <img src="${file.resourceUri}">
                            </figure>`
            setInsertData(html)
        } else {
            const html = fileLink(file.resourceUri, file.originFileName)
            setInsertData(html)
        }
    }


    return (<Grid container spacing={3}>
        <Grid item xs={12}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={12} md={9} elevation={3}>
                    <TextField
                        label="Title"
                        value={post.subject}
                        onChange={(e) =>
                            dispatch({
                                type: POST_LOCAL_MODIFY_SUBJECT,
                                subject: e.target.value,
                            })
                        }
                        fullWidth
                        sx={{
                            marginBottom: "1rem"
                        }}
                    />
                    <DynamicEditor postId={post.id} defaultData={post.body} onChangeData={onChangeBody} insertData={insertData} getDataTrigger={triggerGetData}/>
                </Grid>
                <Grid item xs={12} sm={12} md={3}
                      sx={{
                          position: {xs: 'static', sm: 'static', md: 'sticky'}, top: {xs: 0, sm: 0, md: '4rem'}, height: '450px'
                      }}>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <CategoryAutoComplete onChangeCategory={onChangeCategory} setCategoryId={post.categoryId} label={'Category'}/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                id="outlined-select-currency"
                                select
                                fullWidth
                                label="isPublic"
                                value={post.isPublic}
                                onChange={(e) =>
                                    dispatch({
                                        type: POST_LOCAL_MODIFY_PUBLIC,
                                        isPublic: e.target.value,
                                    })
                                }>
                                {publicOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Button fullWidth size="large" variant="outlined"
                                    onClick={() => {
                                        enqueueSnackbar("모달창에서 검색해서 선택할 수 있도록 하자.", {variant: "warning"})
                                        setInsertData(`${uuidV4Generator()}`)
                                    }}>이전 글 넣기</Button>
                        </Grid>
                        <Grid item xs={12}>
                            <FileUploadComponent onChange={onChangeFile} sx={{mb: 1}}/>
                            {post.file?.filter(f => f.type.startsWith('image')).map((file) => (
                                <FileComponent key={file.id} file={file} onDeleteFile={onDeleteFile} onInsertFile={onInsertFile}/>
                            ))}
                            {post.file?.filter(f => !f.type.startsWith('image')).map((file) => (
                                <FileComponent key={file.id} file={file} onDeleteFile={onDeleteFile} onInsertFile={onInsertFile}/>
                            ))}
                        </Grid>
                        <Grid item xs={12}>
                            <TagGroupComponent postId={post.id} tagList={tags} writePage={true}/>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container spacing={3}>
                                <Grid item xs={6}>
                                    <Button fullWidth size="large" variant="contained" onClick={() => setTriggerGetData(uuidV4Generator)}>저장</Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button fullWidth size="large" color="error" variant="contained">취소</Button>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Grid>)
}