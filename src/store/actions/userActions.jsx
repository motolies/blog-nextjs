import {USER_LOGIN, USER_LOGIN_ERROR_MESSAGE} from '../types/userTypes'

export const loginAction = ({username, password}) => ({
    type: USER_LOGIN,
    username,
    password,
})

export const loginErrorMessage = ({msg}) => ({
    type: USER_LOGIN_ERROR_MESSAGE,
    msg
})