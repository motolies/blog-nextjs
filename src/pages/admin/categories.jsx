import CategoryTreeView from "../../components/CategoryTreeView"
import {Box, Grid, TextField,} from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import IconButton from "@mui/material/IconButton"
import SaveIcon from '@mui/icons-material/Save'
import DeleteIcon from '@mui/icons-material/Delete'
import {useState} from "react"
import { getTsid } from 'tsid-ts'
import CategoryAutoComplete from "../../components/CategoryAutoComplete"
import DeleteConfirm from "../../components/confirm/DeleteConfirm"
import {useSnackbar} from "notistack"
import service from "../../service"
import {useDispatch} from "react-redux"
import {getCategoryFlatAction, getCategoryTreeAction} from "../../store/actions/categoryActions"


const initCategory = {
    id: getTsid().toString(),
    name: '',
    parentId: 'ROOT'
}

export default function CategoriesPage() {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const dispatch = useDispatch()

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [question, setQuestion] = useState('')


    const [category, setCategory] = useState(initCategory)
    const [isEditing, setIsEditing] = useState(false)

    const addNewCategory = () => {
        const newCategory = {...initCategory, ...{parentId: category.id}}
        setCategory(newCategory)
        setIsEditing(true)
    }

    const onChangeCategory = (category) => {
        setIsEditing(false)
        setCategory(category)
    }

    const onChangeParentCategory = (parentCategory) => {
        if (parentCategory?.id === category.id) {
            enqueueSnackbar("동일 카테고리는 부모 카테고리에 설정할 수 없습니다.", {variant: "error"})
            return
        }

        if (parentCategory !== null)
            setCategory({...category, parentId: parentCategory.id})
    }
    const onSaveCategory = async () => {
        // todo : save/update 분리 필요
        await service.category.save({category}).then(() => {
            enqueueSnackbar("카테고리가 저장되었습니다.", {variant: "success"})
            setIsEditing(false)
            refresh()
        }).catch(() => {
            enqueueSnackbar("카테고리 저장에 실패하였습니다.", {variant: "error"})
        })
    }

    const refresh = () => {
        dispatch(getCategoryFlatAction())
        dispatch(getCategoryTreeAction())
    }

    const onDeleteCategory = () => {
        if(category.name.trim() === '')
            return

        if (!isEditing) {
            setQuestion(`${category.name} 카테고리를 삭제하시겠습니까?`)
            setShowDeleteConfirm(true)
        } else {
            setCategory(initCategory)
            setIsEditing(false)
        }
    }
    const deleteCategory = async () => {
        // TODO: delete category
        setShowDeleteConfirm(false)
        await service.category.delete({id: category.id}).then(() => {
            enqueueSnackbar("카테고리가 삭제되었습니다.", {variant: "success"})
            setCategory(initCategory)
            refresh()
        }).catch(() => {
            enqueueSnackbar("카테고리 삭제에 실패하였습니다.", {variant: "error"})
        })
    }
    const deleteCategoryCancel = () => {
        setShowDeleteConfirm(false)
    }

    return (
        <Box sx={{m: 2}}>
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
                    <h3>#status{isEditing ? '(new)' : '(modify)'}</h3>
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
                            <CategoryAutoComplete onChangeCategory={onChangeParentCategory} setCategoryId={category.parentId} label={'Parent Category'}/>
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
        </Box>
    )
}