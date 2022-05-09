import {Box, MenuItem, TextField} from "@mui/material"

export default function SearchTagObject({onChangeTag, defaultTag}) {

    // TODO : 태그들을 한 번에 가져온 다음에 auto complete 기능을 추가해서 사용함


    return (
        <Box>
            <TextField
                select
                label="카테고리 선택(하위포함 검색)"
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