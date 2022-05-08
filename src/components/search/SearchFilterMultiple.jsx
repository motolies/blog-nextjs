import {Box, Grid, MenuItem, Paper, TextField} from "@mui/material"
import {useEffect, useState} from "react"
import {useSnackbar} from "notistack"
import {ConditionComponent} from "../ConditionComponent"
import {uuidV4Generator} from "../../util/uuidUtil"
import SearchCategoryObject from "./SearchCategoryObject"

const searchTypes = [
    {name: "제목", value: "TITLE"},
    {name: "내용", value: "CONTENT"},
    {name: "제목+내용", value: "FULL"},
]
const searchLogic = [
    {name: "AND", value: "AND"},
    {name: "OR", value: "OR"}
]

export default function SearchFilterMultiple({onSearch, defaultLogic, defaultKeyword, defaultSearchType, defaultCategories, defaultTags}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const [logic, setLogic] = useState('')
    const [keywords, setKeywords] = useState([])
    const [searchType, setSearchType] = useState('')
    const [categories, setCategories] = useState([])
    const [tags, setTags] = useState([])

    // init useState
    useEffect(() => {
        if (defaultLogic !== undefined) {
            setLogic(defaultLogic)
        }
        if (defaultKeyword !== undefined) {
            setKeywords(defaultKeyword)
        }
        if (defaultSearchType !== undefined) {
            setSearchType(defaultSearchType)
        }
        if (defaultCategories !== undefined) {
            // id와 name으로 나누어져 있는데 여기서 초기화 시키면 되려나?
            setCategories(defaultCategories)
        }
        if (defaultTags !== undefined) {
            setTags(defaultTags)
        }
    }, [defaultLogic, defaultKeyword, defaultSearchType, defaultCategories, defaultTags])

    // local input variable
    const [keyword, setKeyword] = useState('')


    // keyword
    const onDeleteKeyword = (deleteKeywordId) => {
        const newKeywords = keywords.filter(keyword => keyword.id !== deleteKeywordId)
        setKeywords(newKeywords)
    }
    const addKeyword = () => {
        if (keyword.length < 2) {
            enqueueSnackbar('검색어는 2글자 이상이어야 합니다.', {variant: 'error'})
            setKeyword('')
            return
        }
        const newKeyword = {id: uuidV4Generator(), name: keyword.trim()}
        setKeywords([...keywords, newKeyword])
        setKeyword('')
    }
    const onChangeKeyword = (e) => {
        setKeyword(e.target.value)
    }

    // searchType
    const onChangeSearchType = (e) => {
        setSearchType(e.target.value)
    }

    // searchLogic
    const onChangeLogic = (e) => {
        setLogic(e.target.value)
    }

    // categories
    const onChangeCategory = (category) => {
        // add
        setCategories([...categories, {id: category.id, name: category.name}])
    }
    const onDeleteCategory = (deleteCategoryId) => {
        const newCategories = categories.filter(cat => cat.id !== deleteCategoryId)
        setCategories(newCategories)
    }

    const onSearchStart = () => {
        if (text.length < 2) {
            enqueueSnackbar('검색어는 2글자 이상이어야 합니다.', {variant: 'error'})
            return
        }
        // onSearch({
        //     text,
        //     type,
        //     category,
        //     tags
        // })
    }


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
                        value={searchType}
                        onChange={onChangeSearchType}
                        fullWidth
                    >
                        {searchTypes.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={3}>
                    <TextField
                        select
                        label="AND | OR"
                        value={logic}
                        onChange={onChangeLogic}
                        fullWidth
                    >
                        {searchLogic.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={9}>
                    <TextField
                        label="검색어"
                        value={keyword}
                        onChange={onChangeKeyword}
                        fullWidth
                        autoComplete="email"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addKeyword()
                            }
                        }}
                    />
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={12}>
                    <Box display="flex"
                         sx={{
                             mr: 1
                             , width: '100%'
                             , flexWrap: 'wrap'
                         }}>
                        {keywords.map((keyword, idx) =>
                            <ConditionComponent key={keyword.id} id={keyword.id} name={keyword.name} onDelete={onDeleteKeyword}/>
                        )}
                    </Box>
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={12}>
                    <SearchCategoryObject onChangeCategory={onChangeCategory}/>
                </Grid>
                <Grid item sx={{m: 0, p: 0}} xs={12}>
                    <Box display="flex"
                         sx={{
                             mr: 1
                             , width: '100%'
                             , flexWrap: 'wrap'
                         }}>
                        {categories.map((cat) =>
                            <ConditionComponent key={cat.id} id={cat.id} name={cat.name} onDelete={onDeleteCategory}/>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Paper>
    )
}