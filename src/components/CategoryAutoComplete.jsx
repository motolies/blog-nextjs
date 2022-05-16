import {Box, TextField} from "@mui/material"
import {useDispatch, useSelector} from "react-redux"
import {Autocomplete} from "@mui/lab"
import {useEffect, useState} from "react"
import {getCategoryFlatAction} from "../store/actions/categoryActions"

export default function CategoryAutoComplete({onChangeCategory, setCategoryId, label}) {
    const categoryState = useSelector((state) => state.category.categoryFlat)
    const dispatch = useDispatch()
    const [value, setValue] = useState({label: 'init...'})

    useEffect(() => {
        if (categoryState.length === 0) {
            dispatch(getCategoryFlatAction())
        }
    }, [categoryState])

    useEffect(() => {
        if (setCategoryId !== null) {
            const cat = categoryState.find(c => c.id === setCategoryId)
            setValue(cat)
        }
    }, [setCategoryId])

    const onChangeCategoryName = (event, newValue) => {
        onChangeCategory(newValue)
    }

    return (
        <Box>
            <Autocomplete
                value={value}
                disablePortal
                options={categoryState}
                onChange={onChangeCategoryName}
                fullWidth
                renderInput={(params) => <TextField {...params} label={label} />}
            />
        </Box>
    )
}