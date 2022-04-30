import {MenuItem, TextField} from "@mui/material"
import {useEffect, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import {getCategoryFlatAction} from "../../store/actions/categoryActions"

// TODO : 검토리스트
// https://www.npmjs.com/package/react-dropdown-tree-select

export default function SearchCategory({onChangeCategory, defaultCategories}) {
    const dispatch = useDispatch()
    const categoryState = useSelector((state) => state.category.categoryFlat)
    const [selectCategory, setSelectCategory] = useState([])

    // 선택되어진 카테고리 항목
    const [categories, setCategories] = useState([])

    useEffect(() => {
        dispatch(getCategoryFlatAction())
    }, [])

    useEffect(() => {
        setSelectCategory(categoryState)
    }, [categoryState])

    useEffect(() => {
        if (defaultCategories !== undefined) {
            setCategories(defaultCategories)
        }
    }, [defaultCategories])

    const onChangeLocalCategory = (event) => {
        const category = event.target.value
        // 여긴 더하기만, 대신 redux에서 관리하는 항목에 있어야 함
        setCategories([...categories, category])

        // 부모에게 전달
        onChangeCategory(category)
    }

    return (
        <TextField
            select
            label="카테고리 선택"
            onChange={onChangeLocalCategory}
            fullWidth
            value={categories}
        >
            {selectCategory.map(option => (
                <MenuItem key={option.id} value={option.id}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    )
}