import CategoryTreeView from "../../components/CategoryTreeView"
import {Box, Grid, TextField,} from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import IconButton from "@mui/material/IconButton"
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import {useState} from "react"
import {uuidV4Generator} from "../../util/uuidUtil"
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import DeleteConfirm from "../../components/confirm/DeleteConfirm"
import {useSnackbar} from "notistack"


const initCategory = {
    id: uuidV4Generator(),
    name: '',
    pId: ''
}

export default function CategoriesPage() {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [question, setQuestion] = useState('')


    const [category, setCategory] = useState(initCategory)
    const [isEditing, setIsEditing] = useState(false)

    const addNewCategory = () => {
        setCategory(initCategory)
        setIsEditing(true)
    }

    const onChangeCategory = (category) => {
        console.log(category)
        setIsEditing(false)
        setCategory(category)
    }

    const onChangeParentCategory = (parentCategory) => {
        if (parentCategory.id === category.id) {
            enqueueSnackbar("동일 카테고리는 부모 카테고리에 설정할 수 없습니다.", {variant: "error"})
            return
        }

        if (parentCategory !== null)
            setCategory({...category, pId: parentCategory.id})
    }
    const onSaveCategory = () => {
        console.log(category)
        // TODO: save category
        // dispatch(flat, tree)
    }

    const onDeleteCategory = () => {
        if (!isEditing) {
            setQuestion(`${category.name} 카테고리를 삭제하시겠습니까?`)
            setShowDeleteConfirm(true)
        } else {
            setCategory(initCategory)
        }
    }
    const deleteCategory = () => {
        // TODO: delete category
        setShowDeleteConfirm(false)
        // dispatch(flat, tree)
    }
    const deleteCategoryCancel = () => {
        setShowDeleteConfirm(false)
    }

    return (
        <>
            <h1>categories</h1>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={7} elevation={3}>
                    <Box sx={{
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        height: {xs: '60vh', sm: '60vh', md: 'auto'},
                    }}>
                        <CategoryTreeView onChangeCategory={onChangeCategory}/>
                    </Box>

                </Grid>
                <Grid item xs={12} sm={12} md={5}
                      sx={{
                          position: {xs: 'static', sm: 'static', md: 'sticky'},
                          top: {xs: 0, sm: 0, md: '4rem'},
                          height: '450px'
                      }}>
                    <h3>#status</h3>
                    <Grid item>
                        <IconButton onClick={addNewCategory}>
                            <AddIcon/>
                        </IconButton>
                        <IconButton onClick={onSaveCategory}>
                            <SaveIcon/>
                        </IconButton>
                        <IconButton onClick={onDeleteCategory}>
                            <DeleteIcon/>
                        </IconButton>
                    </Grid>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sx={{mt: 2}}>
                            <TextField
                                disabled={true}
                                fullWidth
                                id="outlined-required"
                                label="Id(Automatically filled when new)"
                                value={category.id}
                                onChange={(e) => setCategory({...category, id: e.target.value})}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <CategoryAutoComplete onChangeCategory={onChangeParentCategory} setCategoryId={category.pId} label={'Parent Category'}/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                id="outlined-required"
                                label="Name"
                                value={category.name}
                                onChange={(e) => setCategory({...category, name: e.target.value.trim()})}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <DeleteConfirm open={showDeleteConfirm} question={question} onConfirm={deleteCategory} onCancel={deleteCategoryCancel}/>
        </>
    )
}