import {Button, Grid, MenuItem, Paper, TextField} from "@mui/material"
import {useEffect, useState} from "react"

const searchTypes = [
    {
        name: "제목",
        value: "TITLE"
    },
    {
        name: "내용만",
        value: "CONTENT"
    },
    {
        name: "제목+내용",
        value: "FULL"
    },
]

export default function SearchFilter({searchText, searchType, searchCategories, searchTags}) {
    const [category, setCategory] = useState('')

    const categoryChange = (event) => {
        console.log(`change: ${event.target.value}`)

        setCategory(event.target.value)
    }

    useEffect(() => {
        if(searchType !== undefined) {
            setCategory(searchType)
        }

        console.log(`filter: ${searchType}`)
    }, [searchType])

    const testButton = () => {
        setCategory('FULL')
    }

    return (

        <Paper variant="outlined"
               sx={{
                   m: 1
                   , px: 3
                   , pb: 2
               }}>
            <Button onClick={testButton}>text</Button>
            <Grid container
                  direction="row"
                  justify="center"
                  alignItems="center"
                  spacing={2}
                  style={{marginTop: '10px'}}
            >
                <Grid item sx={{m:0, p:0}} xs={12}>
                    <TextField
                        select
                        label="검색 범위"
                        value={category}
                        onChange={categoryChange}
                        fullWidth
                    >
                        {searchTypes.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>
        </Paper>
    )
}