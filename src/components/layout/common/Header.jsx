import Link from "next/link"
import {Box, Divider, Grid, TextField} from "@mui/material"
import {useRouter} from "next/router"
import {useSelector} from 'react-redux'
import IconButton from "@mui/material/IconButton"
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LoginIcon from '@mui/icons-material/Login'
import {useEffect, useState} from "react"
import {base64Encode} from "../../../util/base64Util"
import {uuidV4Generator} from "../../../util/uuidUtil"
import {searchObjectInit} from "../../../model/searchObject"

export default function Header({children}) {
    const router = useRouter()
    const userState = useSelector((state) => state.user)
    const [searchText, setSearchText] = useState('')

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
                        keywords: [{id: uuidV4Generator(), name: searchText}],
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

    return (<>
        <nav className="top back-color">
            <div className="back">
                <Grid
                    container
                    direction="row"
                    spacing={2}
                >
                    <Grid item xs={4}>
                        <Link href={`/`}>
                            <a className="main-link">motolies</a>
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
                                       sx={{
                                           mr: 1, maxWidth: '400px'
                                       }}
                                       onChange={onChangeText}
                                       onKeyDown={onSearchTextKeyDown}
                            />

                            <Divider orientation="vertical" variant="middle" flexItem sx={{
                                display: {md: 'none', lg: 'none'}
                            }}/>

                            {router.pathname === '/login' || userState.user.userName ? null : <IconButton aria-label="delete" onClick={onClickLogin}>
                                <LoginIcon/>
                            </IconButton>}
                            {!userState.user.userName ? null : <IconButton onClick={onClickAdmin}>
                                <AdminPanelSettingsIcon/>
                            </IconButton>}


                        </Box>

                    </Grid>
                </Grid>

            </div>
        </nav>
        <style jsx>
            {`
              .top {
                height: 4rem;
                position: fixed;
                top: 0;
                right: 0;
                left: 0;
                z-index: 1024;
              }

              .back {
                display: inline-block;
                position: relative;
                width: 100%;
                height: 100%;
                line-height: 4rem;
              }

              .main-link {
                margin-left: 1rem;
                font-size: 1.25rem;
                color: #fff;
                text-decoration: none;
              }

              @media (min-width: 600px) {
                .top {
                  position: fixed;
                  top: 0;
                  right: 0;
                  left: 0;
                  z-index: 1024;
                }

                .back {
                  line-height: 4rem;
                }
              }
            `}
        </style>
    </>)
}