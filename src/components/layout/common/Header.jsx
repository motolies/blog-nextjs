import Link from "next/link"
import {Box, Divider, Grid, TextField} from "@mui/material"
import {useRouter} from "next/router"
import {useSelector} from 'react-redux'
import IconButton from "@mui/material/IconButton"
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LoginIcon from '@mui/icons-material/Login'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import {useEffect, useState} from "react"
import MemoDialog from "../../memo/MemoDialog"
import {base64Encode} from "../../../util/base64Util"
import { getTsid } from 'tsid-ts'
import {searchObjectInit} from "../../../model/searchObject"
import styles from './Header.module.css'

export default function Header({children}) {
    const router = useRouter()
    const userState = useSelector((state) => state.user)
    const [searchText, setSearchText] = useState('')
    const [memoDialogOpen, setMemoDialogOpen] = useState(false)

    useEffect(() => {
        if (!router.pathname.startsWith('/search')) {
            setSearchText('')
        }
    }, [router.pathname])

    const onSearchTextKeyDown = (e) => {
        if (e.key === 'Enter') {
            const condition = {
                ...searchObjectInit,
                ...{
                    searchCondition: {
                        keywords: [{id: getTsid().toString(), name: searchText}],
                        logic: 'AND'
                    }
                }
            }
            router.push({pathname: '/search', query: {q: base64Encode(JSON.stringify(condition))}})
        }
    }
    const onChangeText = (e) => {
        setSearchText(e.target.value)
    }

    const onClickLogin = () => {
        router.push('/login')
    }

    const onClickAdmin = () => {
        router.push('/admin')
    }

    return (
        <nav className={`${styles.top} back-color`}>
            <div className={styles.back}>
                <Grid
                    container
                    direction="row"
                    spacing={2}
                >
                    <Grid item xs={4}>
                        <Link href={`/`} className={styles.mainLink} >
                            motolies
                        </Link>
                    </Grid>
                    <Grid item xs={8} display="flex">
                        {/*여기가 검색과 로그인 버튼 자리*/}
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="flex-end"
                            sx={{mr: 1, width: '100%'}}
                        >

                            <TextField label="Search" variant="standard"
                                       size="small"
                                       fullWidth={true}
                                       value={searchText}
                                       type={'search'}
                                       sx={{
                                           mr: 1, maxWidth: '400px'
                                       }}
                                       onChange={onChangeText}
                                       onKeyDown={onSearchTextKeyDown}
                            />

                            {!userState.user.username ? null : <IconButton onClick={() => setMemoDialogOpen(true)} title="메모 작성">
                                <NoteAddIcon/>
                            </IconButton>}

                            <Divider orientation="vertical" variant="middle" flexItem sx={{
                                display: {md: 'none', lg: 'none'}
                            }}/>

                            {router.pathname === '/login' || userState.user.username ? null : <IconButton aria-label="delete" onClick={onClickLogin}>
                                <LoginIcon/>
                            </IconButton>}

                            {!userState.user.username ? null : <IconButton onClick={onClickAdmin}>
                                <AdminPanelSettingsIcon/>
                            </IconButton>}


                        </Box>
                        <MemoDialog open={memoDialogOpen} onClose={() => setMemoDialogOpen(false)}/>

                    </Grid>
                </Grid>

            </div>
        </nav>
    )
}