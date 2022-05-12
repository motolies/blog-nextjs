import {Box, MenuItem, TextField} from "@mui/material"
import {useEffect, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import {getCategoryFlatAction} from "../../store/actions/categoryActions"

// TODO : 검토리스트
// https://www.npmjs.com/package/react-dropdown-tree-select

// mui TextField select 에서는 id 값을 기준으로 움직인다.

export default function SearchCategory({onChangeCategory, defaultCategory}) {
    const dispatch = useDispatch()
    const categoryState = useSelector((state) => state.category.categoryFlat)
    const [selectCategories, setSelectCategories] = useState([])

    // 선택되어진 카테고리 항목
    const [category, setCategory] = useState('ROOT')

    useEffect(() => {
        dispatch(getCategoryFlatAction())
    }, [])

    useEffect(() => {
        setSelectCategories(categoryState)
    }, [categoryState])

    useEffect(() => {
        if (defaultCategory !== undefined) {
            setCategory(defaultCategory)
        }
    }, [defaultCategory])

    const onChangeLocalCategory = (event) => {
        const category = event.target.value
        setCategory(category)
        // 부모에게 전달
        const categoryObject = selectCategories.filter(c => c.id === event.target.value)[0]
        onChangeCategory(categoryObject)
    }

    return (<Box>
            <TextField
                select
                label="카테고리 선택(하위 카테고리 포함 검색, 여러개 선택시 OR 조건으로 검색)"
                onChange={onChangeLocalCategory}
                fullWidth
                value={category}
            >
                {selectCategories.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                        {option.treeName}
                    </MenuItem>
                ))}
            </TextField>
            {/* TODO : 여러개 선택은 여기에 표출한다.*/}
        </Box>
    )
}