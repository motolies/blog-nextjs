import {Grid, MenuItem, Paper, TextField} from "@mui/material"
import {useEffect, useState} from "react"
import {useSnackbar} from "notistack"
import SearchCategory from "./SearchCategory"

const searchTypes = [
    {
        name: "제목",
        value: "TITLE"
    },
    {
        name: "내용",
        value: "CONTENT"
    },
    {
        name: "제목+내용",
        value: "FULL"
    },
]

export default function SearchFilter({onSearch, defaultText, defaultType, defaultCategories, defaultTags}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const [text, setText] = useState('')
    const [type, setType] = useState('')
    const [category, setCategory] = useState('ROOT')
    const [tags, setTags] = useState([])

    const onSearchStart = () => {
        if (text.length < 2) {
            enqueueSnackbar('검색어는 2글자 이상이어야 합니다.', {variant: 'error'})
            return
        }

        onSearch({
            text,
            type,
            categories: category,
            tags
        })
    }

    const onChangeCategory = (category) => {
        setCategory(category)
    }

    const onChangeType = (e) => {
        setType(e.target.value)
    }

    const onChangeText = (e) => {
        setText(e.target.value)
    }

    useEffect(() => {
        if (defaultType !== undefined) {
            setType(defaultType)
        }
        if (defaultText !== undefined) {
            setText(defaultText)
        }
        if (defaultCategories !== undefined) {
            setCategory(defaultCategories)
        }
        if (defaultTags !== undefined) {
            setTags(defaultTags)
        }
    }, [defaultText, defaultType, defaultCategories, defaultTags])

    return (

        <Paper variant="outlined"
               sx={{
                   m: 1
                   , px: 3
                   , pb: 2
               }}>
            <Grid container
                  direction="row"
                  justify="center"
                  alignItems="center"
                  spacing={2}
                  style={{marginTop: '10px'}}
            >
                <Grid item sx={{m: 0, p: 0}} xs={12}>
                    <TextField
                        select
                        label="검색 범위"
                        value={type}
                        onChange={onChangeType}
                        fullWidth
                    >
                        {searchTypes.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={12}>
                    <TextField
                        label="검색어"
                        value={text}
                        onChange={onChangeText}
                        fullWidth
                        autoComplete="email"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSearchStart()
                            }
                        }}
                    >
                        {searchTypes.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={12}>
                    <SearchCategory onChangeCategory={onChangeCategory} defaultCategory={category}/>
                </Grid>

            </Grid>
        </Paper>
    )
}