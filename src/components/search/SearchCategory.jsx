import {Box, MenuItem, TextField} from "@mui/material"
import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {getAllTags} from "../../store/actions/tagActions"
import {ConditionComponent} from "../ConditionComponent"
import {Autocomplete} from "@mui/lab"
import {useSnackbar} from "notistack"
import {getCategoryFlatAction} from "../../store/actions/categoryActions"

export default function SearchCategory({onChangeAddCategory, onChangeDeleteCategory, defaultCategory}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const dispatch = useDispatch()
    const categoryState = useSelector((state) => state.category.categoryFlat)

    // 전체 태그 리스트
    const [categories, setCategories] = useState([])

    // 최종 선택된 태그 리스트
    const [selectCategories, setSelectCategories] = useState([])


    useEffect(() => {
        dispatch(getCategoryFlatAction())
    }, [])

    useEffect(() => {
        setCategories(categoryState)
    }, [categoryState])

    useEffect(() => {
        if (defaultCategory !== undefined) {
            setSelectCategories(defaultCategory)
        }
    }, [defaultCategory])

    const onDeleteTag = (deleteCategoryId) => {
        onChangeDeleteCategory(deleteCategoryId)
    }

    const onChangeCategoryName = (event, value) => {
        if (value === undefined || value === null) {
            return false
        }
        if (selectCategories.filter(t => t.id === value.id).length > 0) {
            enqueueSnackbar('동일 카테고리는 한 번만 추가할 수 있습니다.', {variant: 'warning'})
            return false
        }
        // setSelectTags([...selectTags, value])
        onChangeAddCategory(value)
    }

    return (
        <Box>
            <Autocomplete
                disablePortal
                options={categories}
                onChange={onChangeCategoryName}
                fullWidth
                renderInput={(params) => <TextField {...params} label="카테고리(하위포함, OR 조건)"/>}
            />
            <Box display="flex"
                 sx={{
                     mr: 1
                     , width: '100%'
                     , flexWrap: 'wrap'
                 }}>
                {selectCategories.map((t) =>
                    <ConditionComponent key={t.id} id={t.id} name={t.name} onDelete={onDeleteTag}/>
                )}
            </Box>
        </Box>
    )
}