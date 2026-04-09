import {USER_LOGIN_REQUEST, USER_LOGIN_ERROR_MESSAGE} from '../types/userTypes'

export const loginAction = ({username, password}: { username: string; password: string }) => ({
    type: USER_LOGIN_REQUEST,
    username,
    password,
})

export const loginErrorMessage = ({msg}: { msg: string }) => ({
    type: USER_LOGIN_ERROR_MESSAGE,
    msg
})
