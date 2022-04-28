import Link from "next/link";
import {Box, Button, Grid, TextField} from "@mui/material";
import {useRouter} from "next/router";
import {useDispatch, useSelector} from 'react-redux'

export default function Header({children}) {
    const router = useRouter();
    const userState = useSelector((state) => state.user)

    const loginClick = () => {
        router.push('/login')
    };

    return (
        <>
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
                            <span>{userState.user.userName}</span>
                        </Grid>
                        <Grid item xs={8} display="flex">
                            {/*여기가 검색과 로그인 버튼 자리*/}
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="flex-end"
                                sx={{mr: 1, width: '100%'}}
                            >
                                <TextField item="true" sx={{
                                    mr: 1
                                    , '& .MuiInputBase-root': {
                                        'background': '#fff'
                                    }
                                    , maxWidth: '400px'
                                }}
                                           fullWidth
                                           id="outlined-search"
                                           label="Search"
                                           type="search"/>
                                <Button item="true" variant="contained"
                                        sx={{mr: 1, height: '56px'}}
                                        color="primary">Search
                                </Button>

                                {router.pathname === '/login' ? null :
                                    <Button item="true" variant="contained"
                                            sx={{height: '56px'}}
                                            color="primary"
                                            onClick={loginClick}>Login
                                    </Button>
                                }

                            </Box>

                        </Grid>
                    </Grid>

                </div>
            </nav>
            <style jsx>
                {`
                  .top {
                    height: 4.5rem;
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
                    line-height: 4.5rem;
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
                      line-height: 4.5rem;
                    }
                  }
                `}
            </style>
        </>
    );
}