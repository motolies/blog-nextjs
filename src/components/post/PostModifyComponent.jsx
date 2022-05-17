// https://mui.com/material-ui/react-drawer/#responsive-drawer
import {Grid, TextField} from "@mui/material"
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import {useSnackbar} from "notistack"
import {useState} from "react"
import CustomEditor from "./CustomEditor"

export default function PostModifyComponent({post}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const [subject, setSubject] = useState(post.subject)
    const [body, setBody] = useState(post.body)
    const [categoryId, setCategoryId] = useState(post.categoryId)
    const [isPublic, setIsPublic] = useState(post.public)

    const onChangeCategory = (category) => {
        if (category?.id) {
            setCategoryId(category.id)
        }else{
            enqueueSnackbar("카테고리는 필수로 선택해야 합니다.", {variant: "error"})
        }
    }

    const onChangeBody = (body) => {
        setBody(body)
        console.log("body", body)
    }

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
                <CategoryAutoComplete onChangeCategory={onChangeCategory} setCategoryId={categoryId} label={'Category'}/>
            </Grid>
            <Grid item xs={12} md={8}>
                <TextField
                    label="제목"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    fullWidth
                    autoComplete="email"
                    autoFocus
                />
            </Grid>
            <Grid item xs={12}>
                <CustomEditor defaultData={post.body} onChangeData={onChangeBody} />
            </Grid>
        </Grid>
    )
}