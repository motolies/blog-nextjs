import {
    POST_SEARCH_REQUEST,
    POST_SEARCH_REQUEST_ERROR,
    POST_SEARCH_REQUEST_SUCCESS,
} from "../types/postTypes"


export default function postReducers(stats = {
    isLoading: false,
    searchedPost: {},
    modifyPost: {},
    error: ''
}, action) {
    switch (action.type) {

        case POST_SEARCH_REQUEST:
            return {
                ...stats,
                isLoading: true
            }
        case POST_SEARCH_REQUEST_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                searchedPost: action.payload
            }
        case POST_SEARCH_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                searchedPost: {}
            }

        default:
            return stats
    }
}
