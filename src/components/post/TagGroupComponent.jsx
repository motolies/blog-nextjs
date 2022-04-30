import {Box, Grid} from "@mui/material"
import {useEffect, useState} from "react"
import {useSelector} from "react-redux"
import {useSnackbar} from "notistack"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import DeleteConfirm from "../confirm/DeleteConfirm"
import {Tag} from "./TagComponent"


export default function TagGroupComponent({tagList, deletePostTag}) {
    const userState = useSelector((state) => state.user)
    const [tags, setTags] = useState(tagList)

    useEffect(() => {
        setTags(tagList)
    }, [tagList])

    return (
        <Grid
            container
            direction="row"
            spacing={2}
        >
            <Grid item>
                <h3>#tags</h3>
            </Grid>

            {!(userState.isAuthenticated && userState.user.userName) ? null :
                <Grid item xs={12}>
                    태그 추가 기능 넣을 곳
                </Grid>
            }

            <Grid item xs={12}>
                <Box
                    display="flex"
                    sx={{
                        mr: 1
                        , width: '100%'
                        , flexWrap: 'wrap'
                    }}
                >
                    {tags.map((tag) => <Tag key={tag.id} id={tag.id} name={tag.name} deletePostTag={deletePostTag}/>)}
                </Box>
            </Grid>
        </Grid>
    )
}