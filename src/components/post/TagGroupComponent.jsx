import {Box, Grid, TextField} from "@mui/material"
import {useEffect, useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import {Tag} from "./TagComponent"
import {getAllTags} from "../../store/actions/tagActions"
import {Autocomplete} from "@mui/lab"
import {useSnackbar} from "notistack"
import _ from "lodash"
import service from "../../service"


export default function TagGroupComponent({postId, tagList, clickable, listHeight}) {
    const {enqueueSnackbar, closeSnackbar} = useSnackbar()
    const dispatch = useDispatch()

    const userState = useSelector((state) => state.user)

    // redux에서 검색된 태그
    const tagState = useSelector(state => state.tag.tags)
    const [reduxTags, setReduxTags] = useState([])

    // 포스트에 딸린 태그
    const [postTags, setPostTags] = useState(tagList)

    // new tag
    const [newTag, setNewTag] = useState(tagList)

    const [isAddTag, setIsAddTag] = useState(true)


    useEffect(() => {
        dispatch(getAllTags())
    }, [])

    useEffect(() => {
        if (tagList === undefined) {
            return
        }

        setPostTags(tagList)

        // 이미 포스트에 붙어있는 것은 제외하고 나머지를 보여준다.
        // https://stackoverflow.com/questions/54219162/lodash-differenceby-with-different-identity
        const filteredArray = _.differenceBy(tagState, tagList, (tag) => tag.id)
        setReduxTags(filteredArray)
    }, [tagList, tagState])

    const onChangeTagName = (event, value) => {
        if (value === undefined || value === null) {
            return false
        }
        if (postTags.filter(t => t.id === value.id).length > 0) {
            enqueueSnackbar('동일 태그는 한 번만 추가할 수 있습니다.', {variant: 'warning'})
            return false
        }
        addTagOnPost(value.name)
    }

    const addTagOnPost = (tagName) => {
        // mac에서 한글로 엔터를 치면 두 번 호출되는 현상이 있다. add 중이면 막는 기능이 필요하다.
        if (!isAddTag)
            return

        setIsAddTag(false)
        service.post.addTag({postId: postId, tagName: tagName})
            .then(res => {
                if (res.status === 200) {
                    const newTag = res.data

                    const filteredPostArray = _.unionBy(postTags, [newTag], 'id')
                    setPostTags(filteredPostArray)

                    // 이미 가지고 있는 경우가 있으니 병합한다.
                    // const newRedux = _.unionBy(reduxTags, [newTag], 'id')
                    // 아니 빼줘야 함
                    const filteredReduxArray = _.differenceBy(reduxTags, [newTag], (tag) => tag.id)
                    setReduxTags(filteredReduxArray)

                    enqueueSnackbar(`태그가 추가되었습니다.`, {variant: 'success'})
                }
            })
            .finally(() => {
                setIsAddTag(true)
            })
    }

    const deletePostTag = ({tagId}) => {
        const oldTags = postTags.filter(t => t.id === tagId)
        service.post.deleteTag({postId: postId, tagId: tagId})
            .then(res => {
                if (res.status === 200) {
                    const filteredArray = postTags.filter(t => t.id !== tagId)
                    setPostTags(filteredArray)
                    enqueueSnackbar("태그 삭제에 성공하였습니다.", {variant: "success"})

                    // 삭제한 걸 다시 선택할 수 있으니 reduxTags에 돌려줘야 한다.
                    const newRedux = _.unionBy(reduxTags, oldTags, 'id')
                    setReduxTags(newRedux)
                }
            }).catch(() => {
            enqueueSnackbar("태그 삭제에 실패하였습니다.", {variant: "error"})
        })
    }

    return (
        <Grid
            container
            direction="row"
            spacing={2}
        >
            {!(userState.isAuthenticated && userState.user.username) ? null :
                <Grid item xs={12}>
                    <Autocomplete
                        disablePortal
                        options={reduxTags}
                        onChange={onChangeTagName}
                        onInputChange={(event, newInputValue) => {
                            setNewTag(newInputValue.trim())
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                if (newTag.trim().length > 1) {
                                    addTagOnPost(newTag)
                                } else {
                                    enqueueSnackbar(`태그는 두 글자 이상이어야 합니다.`, {variant: 'error'})
                                }
                            }
                        }}
                        fullWidth
                        renderInput={(params) => <TextField {...params} label="Add Tags"/>}
                    />
                </Grid>
            }

            <Grid item xs={12} sx={listHeight}>
                <Box
                    display="flex"
                    sx={{
                        mr: 1
                        , width: '100%'
                        , flexWrap: 'wrap'
                    }}
                >
                    {postTags ? postTags.map((tag) => <Tag key={tag.id} id={tag.id} name={tag.name} deletePostTag={deletePostTag} clickable={clickable}/>) : null}
                </Box>
            </Grid>
        </Grid>
    )
}