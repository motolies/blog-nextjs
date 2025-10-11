import {Alert, Box, Button, Grid, TextField} from "@mui/material"
import {useDispatch, useSelector} from 'react-redux'
import {loginAction, loginErrorMessage} from '../store/actions/userActions'
import {useEffect, useState} from "react"
import {useRouter} from 'next/router'
import {LOAD_USER_REQUEST} from "../store/types/userTypes"

export default function LoginPage() {

    const router = useRouter()
    const dispatch = useDispatch()
    const userState = useSelector((state) => state.user)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        // 로그인 완료 후 이동
        if (userState.isAuthenticated && userState.user.username) {
            router.push('/')
        }
    }, [userState])

    useEffect(() => {
        // 우선 사용자를 로드해보고
        dispatch({
            type: LOAD_USER_REQUEST,
        })

        if (userState.isAuthenticated && userState.user.username) {
            // 사용자 정보가 있으면 admin으로 이동
            router.push('/admin')
        }

        return () => {
            dispatch(loginErrorMessage({msg: ''}))
        }
    }, [])

    const onChangeUsername = (e) => {
        setUsername(e.target.value)
    }

    const onChangePassword = (e) => {
        setPassword(e.target.value)
    }

    const onClickLogin = () => {

        if (username.length === 0 || password.length === 0) {
            dispatch(loginErrorMessage({msg: 'Username and password are required'}))
            return
        }

        dispatch(loginAction({
            username: username
            , password: password
        }))
    }

    return (
        <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{minHeight: '50vh'}}
        >
            <Grid
                item
                xs={3}
            >
                <Box
                    noValidate
                    sx={{
                        mt: 1
                        , p: 5
                    }}
                >
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="UserName"
                        name="username"
                        autoComplete="email"
                        autoFocus
                        onChange={onChangeUsername}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        onChange={onChangePassword}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onClickLogin()
                            }
                        }}
                    />
                    <Button
                        disabled={userState.isLoading}
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mt: 3, mb: 2}}
                        onClick={onClickLogin}
                    >
                        Login
                    </Button>
                    {userState.error !== '' && <Alert severity="error">{userState.error}</Alert>}
                </Box>
            </Grid>
        </Grid>
    )
}

