// https://mui.com/material-ui/react-drawer/#responsive-drawer
import {Grid, TextField} from "@mui/material"
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import {useSnackbar} from "notistack"
import {useState} from "react"
import CustomEditor from "../editor/CustomEditor"

export default function PostModifyComponent({post}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const [subject, setSubject] = useState(post.subject)
    const [body, setBody] = useState(post.body)
    const [categoryId, setCategoryId] = useState(post.categoryId)
    const [isPublic, setIsPublic] = useState(post.public)

    const onChangeCategory = (category) => {
        if (category?.id) {
            setCategoryId(category.id)
        } else {
            enqueueSnackbar("카테고리는 필수로 선택해야 합니다.", {variant: "error"})
        }
    }

    const onChangeBody = (body) => {
        setBody(body)
        console.log("body", body)
    }

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={12} md={9} elevation={3}>
                        <TextField
                            label="제목"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            fullWidth
                            autoComplete="email"
                            autoFocus
                            sx={{
                                marginBottom: "1rem"
                            }}
                        />
                        <CustomEditor postId={post.id} defaultData={post.body} onChangeData={onChangeBody}/>
                    </Grid>
                    <Grid item xs={12} sm={12} md={3}
                          sx={{
                              position: {xs: 'static', sm: 'static', md: 'sticky'},
                              top: {xs: 0, sm: 0, md: '4rem'},
                              minHeight: '450px'
                          }}>
                        <Grid item xs={12}>
                            <CategoryAutoComplete onChangeCategory={onChangeCategory} setCategoryId={categoryId} label={'Category'}/>
                        </Grid>
                        <h3>공개여부</h3>
                        <h3>이전글 넣기</h3>
                        <h3>파일리스트</h3>
                        <h3>태그리스트</h3>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}