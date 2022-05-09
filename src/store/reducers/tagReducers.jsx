import {TAG_ALL_REQUEST, TAG_ALL_REQUEST_ERROR, TAG_ALL_REQUEST_SUCCESS} from "../types/tagTypes"

export default function tagReducers(stats = {
    isFetching: false,
    isLoading: false,
    tags: [],

}, action) {
    switch (action.type) {
        case TAG_ALL_REQUEST:
            return {
                ...stats,
                isLoading: true
            }
        case TAG_ALL_REQUEST_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isFetching: true,
                tags: action.payload
            }
        case TAG_ALL_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isFetching: false,
                tags: []
            }
        default:
            return stats
    }
}
