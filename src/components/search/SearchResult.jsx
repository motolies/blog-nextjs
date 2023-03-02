import {useSelector} from "react-redux"
import {Box, Grid} from "@mui/material"
import {useState, useEffect} from "react"
import moment from "moment"
import Link from "next/link"


export default function SearchResult(props) {

    const postState = useSelector((state) => state.post.searchedPost.list)

    const [searchedPost, setSearchedPost] = useState([])

    useEffect(() => {
        if (postState !== undefined) {
            setSearchedPost(postState)
        } else {
            setSearchedPost([])
        }

    }, [postState])

    const timestampFormat = (timestamp) => {
        return moment(timestamp).format("YYYY-MM-DD HH:mm:ss")
    }

    return (
        <Grid container
              direction="row"
              justify="center"
              alignItems="center"
              spacing={2}
              sx={{marginTop: '10px', p: 1}}
        >
            {searchedPost.map(post => (
                <Grid container key={post.id} item sx={{m: 0, p: 1}} xs={12}>
                    <Grid item xs={12}>
                        <Link href={`/post/${post.id}`} legacyBehavior>
                            <a>{post.subject}</a>
                        </Link>
                    </Grid>
                    <Grid item xs={12} sm={8}
                          sx={{fontSize: 15}}>
                        {post.categoryName}
                    </Grid>
                    <Grid item xs={12} sm={4} textAlign={'right'}
                          sx={{fontSize: 12}}>
                        {timestampFormat(post.createDate)}
                    </Grid>
                </Grid>
            ))}
            {searchedPost.length === 0 && (
                <Grid container item sx={{m: 1, p: 1}} xs={12}>
                    검색 결과가 없습니다.
                </Grid>
            )}
        </Grid>
    )
}