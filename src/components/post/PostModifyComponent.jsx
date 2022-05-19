// https://mui.com/material-ui/react-drawer/#responsive-drawer
import {Button, Grid, MenuItem, TextField} from "@mui/material"
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import {useSnackbar} from "notistack"
import {useState} from "react"
import CustomEditor from "../editor/CustomEditor"
import {useDispatch, useSelector} from "react-redux"
import {POST_LOCAL_MODIFY_BODY, POST_LOCAL_MODIFY_CATEGORY_ID, POST_LOCAL_MODIFY_PUBLIC, POST_LOCAL_MODIFY_SUBJECT} from "../../store/types/postTypes"
import {uuidV4Generator} from "../../util/uuidUtil"

export default function PostModifyComponent() {

    const post = useSelector(state => state.post.modifyPost)
    const dispatch = useDispatch()
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const [insertData, setInsertData] = useState('')

    const publicOptions = [{value: true, label: '공개'}, {value: false, label: '비공개'}]

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
        console.log("body", body)
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
                    <CustomEditor postId={post.id} defaultData={post.body} onChangeData={onChangeBody} insertData={insertData}/>
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
                            <h3>이전글 넣기</h3>
                            <Button variant="outlined" onClick={() => setInsertData(`<p>${uuidV4Generator()}</p>`)}>이전글</Button>
                        </Grid>
                        <Grid item xs={12}>
                            <h3>파일리스트</h3>
                        </Grid>
                        <Grid item xs={12}>
                            <h3>태그리스트</h3>
                        </Grid>
                        <Grid item xs={12}>
                            <h3>저장버튼 자리</h3>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    </Grid>)
}