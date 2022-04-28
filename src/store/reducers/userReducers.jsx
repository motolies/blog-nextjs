import {
    LOAD_USER_REQUEST_SUCCESS,
    SET_USER_SUCCESS,
    USER_LOGIN,
    USER_LOGIN_ERROR,
    USER_LOGIN_ERROR_MESSAGE_SUCCESS,
    USER_LOGIN_SUCCESS,
    USER_LOGOUT,
    USER_LOGOUT_ERROR,
    USER_LOGOUT_SUCCESS
} from '../types/userTypes'

export default function userReducers(stats = {
    isAuthenticated: false,
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
        case USER_LOGIN:
            return {
                ...stats,
                isLoading: true
            }
        case LOAD_USER_REQUEST_SUCCESS:
        case USER_LOGIN_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: true,
                user: action.payload
            }
        case USER_LOGIN_ERROR:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: false,
                error: action.payload
            }
        case USER_LOGOUT:
            return {
                ...stats,
                isLoading: true
            }
        case USER_LOGOUT_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isAuthenticated: false,
                user: {}
            }
        case USER_LOGOUT_ERROR:
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
