import {Box, MenuItem, TextField} from "@mui/material"
import {useDispatch, useSelector} from "react-redux"
import {useEffect, useState} from "react"
import {getAllTags} from "../../store/actions/tagActions"
import {ConditionComponent} from "../ConditionComponent"
import {Autocomplete} from "@mui/lab"
import {useSnackbar} from "notistack"

export default function SearchTagObject({onChangeAddTag, onChangeDeleteTag, defaultTag}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const dispatch = useDispatch()
    const tagState = useSelector(state => state.tag.tags)

    // 전체 태그 리스트
    const [tags, setTags] = useState([])

    // 최종 선택된 태그 리스트
    const [selectTags, setSelectTags] = useState([])


    useEffect(() => {
        dispatch(getAllTags())
    }, [])

    useEffect(() => {
        setTags(tagState)
    }, [tagState])

    useEffect(() => {
        if (defaultTag !== undefined) {
            setSelectTags(defaultTag)
        }
    }, [defaultTag])

    const onDeleteTag = (deleteTagId) => {
        onChangeDeleteTag(deleteTagId)
    }

    const onChangeTagName = (event, value) => {
        if (value === undefined || value === null) {
            return false
        }
        if (selectTags.filter(t => t.id === value.id).length > 0) {
            enqueueSnackbar('동일 태그는 한 번만 추가할 수 있습니다.', {variant: 'warning'})
            return false
        }
        // setSelectTags([...selectTags, value])
        onChangeAddTag(value)
    }

    return (
        <Box>
            <Autocomplete
                disablePortal
                options={tags}
                onChange={onChangeTagName}
                fullWidth
                renderInput={(params) => <TextField {...params} label="태그 선택"/>}
            />
            {/* TODO : 여러개 선택은 여기에 표출한다.*/}
            <Box display="flex"
                 sx={{
                     mr: 1
                     , width: '100%'
                     , flexWrap: 'wrap'
                 }}>
                {selectTags.map((t) =>
                    <ConditionComponent key={t.id} id={t.id} name={t.name} onDelete={onDeleteTag}/>
                )}
            </Box>
        </Box>
    )
}