import Link from "next/link"
import {Box, Divider, Grid, TextField} from "@mui/material"
import {useRouter} from "next/router"
import {useSelector} from 'react-redux'
import IconButton from "@mui/material/IconButton"
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LoginIcon from '@mui/icons-material/Login'

export default function Header({children}) {
    const router = useRouter()
    const userState = useSelector((state) => state.user)

    const onClickLogin = () => {
        router.push('/login')
    }

    const onClickAdmin = () => {
        router.push('/admin')
    }

    return (
        <>
            <nav className="top header-back-color">
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
                                           sx={{
                                               mr: 1
                                               , maxWidth: '400px'
                                           }}
                                           onKeyDown={(e) => {
                                               if (e.key === 'Enter') {
                                                   router.push(`/search?q=${e.target.value}`)
                                               }
                                           }}
                                />

                                <Divider orientation="vertical" variant="middle" flexItem/>

                                {router.pathname === '/login' || userState.user.userName ? null :
                                    <IconButton aria-label="delete" onClick={onClickLogin}>
                                        <LoginIcon/>
                                    </IconButton>
                                }
                                {!userState.user.userName ? null :
                                    <IconButton aria-label="delete" onClick={onClickAdmin}>
                                        <AdminPanelSettingsIcon/>
                                    </IconButton>
                                }


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

                  @media ( min-width: 576px) {
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
        </>
    )
}