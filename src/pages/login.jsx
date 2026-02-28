import {useDispatch, useSelector} from 'react-redux'
import {loginAction, loginErrorMessage} from '../store/actions/userActions'
import {useEffect, useState} from "react"
import {Input} from '../components/ui/input'
import {Button} from '../components/ui/button'

export default function LoginPage() {

    const dispatch = useDispatch()
    const userState = useSelector((state) => state.user)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        return () => {
            dispatch(loginErrorMessage({msg: ''}))
        }
    }, [dispatch])

    const onChangeUsername = (e) => {
        setUsername(e.target.value)
    }

    const onChangePassword = (e) => {
        setPassword(e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onClickLogin()
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
        <div className="flex items-center justify-center" style={{minHeight: '50vh'}}>
            <h1 className="visually-hidden">로그인</h1>
            <form
                noValidate
                onSubmit={handleSubmit}
                className="mt-1 p-10 w-full max-w-sm space-y-4"
            >
                <div className="space-y-1">
                    <label htmlFor="username" className="text-sm font-medium">UserName</label>
                    <Input
                        id="username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        onChange={onChangeUsername}
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        onChange={onChangePassword}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onClickLogin()
                            }
                        }}
                    />
                </div>
                <Button
                    disabled={userState.isLoading}
                    type="submit"
                    className="w-full mt-3"
                    onClick={onClickLogin}
                >
                    Login
                </Button>
                {userState.error !== '' && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3 text-sm">
                        {userState.error}
                    </div>
                )}
            </form>
        </div>
    )
}
