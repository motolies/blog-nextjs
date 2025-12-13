import {
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

export default function userReducers(stats = {
    isAuthenticated: null,
    isLoading: false,
    user: {},
    error: ''
}, action) {
    switch (action.type) {

        case USER_LOGIN_ERROR_MESSAGE_SUCCESS:
            return {
                ...stats,
                error: action.payload,
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
                user: action.payload
            }
        case USER_LOGIN_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: false,
                error: action.payload
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
                user: {}
            }
        case USER_LOGOUT_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: true,
                error: action.payload
            }
        default:
            return stats
    }
}
