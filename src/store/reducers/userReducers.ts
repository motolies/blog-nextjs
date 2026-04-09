import {
    LOAD_USER_REQUEST_ERROR,
    LOAD_USER_REQUEST_SUCCESS,
    SERVER_LOAD_USER_REQUEST_SUCCESS,
    USER_LOGIN_REQUEST,
    USER_LOGIN_REQUEST_ERROR,
    USER_LOGIN_ERROR_MESSAGE_SUCCESS,
    USER_LOGIN_REQUEST_SUCCESS,
    USER_LOGOUT_REQUEST,
    USER_LOGOUT_REQUEST_ERROR,
    USER_LOGOUT_REQUEST_SUCCESS
} from '../types/userTypes'
import type { UserState } from '@/types/store'
import type { User } from '@/types/user'

const initialState: UserState = {
    isAuthenticated: null,
    isLoading: false,
    user: {},
    error: ''
}

export default function userReducers(stats: UserState = initialState, action: { type: string; payload?: unknown }): UserState {
    switch (action.type) {

        case USER_LOGIN_ERROR_MESSAGE_SUCCESS:
            return {
                ...stats,
                error: action.payload as string,
            }
        case USER_LOGIN_REQUEST:
            return {
                ...stats,
                isLoading: true
            }
        case SERVER_LOAD_USER_REQUEST_SUCCESS:
        case LOAD_USER_REQUEST_SUCCESS:
        case USER_LOGIN_REQUEST_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: true,
                user: action.payload as User,
                error: ''
            }
        case LOAD_USER_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: false,
                user: {},
                error: ''
            }
        case USER_LOGIN_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: false,
                error: action.payload as string
            }
        case USER_LOGOUT_REQUEST:
            return {
                ...stats,
                isLoading: true
            }
        case USER_LOGOUT_REQUEST_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: false,
                user: {},
                error: ''
            }
        case USER_LOGOUT_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: true,
                error: action.payload as string
            }
        default:
            return stats
    }
}
