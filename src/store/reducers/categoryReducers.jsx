import {
    CATEGORY_FLAT_REQUEST
    , CATEGORY_FLAT_REQUEST_SUCCESS
    , CATEGORY_FLAT_REQUEST_ERROR, CATEGORY_TREE_REQUEST, CATEGORY_TREE_REQUEST_SUCCESS, CATEGORY_TREE_REQUEST_ERROR
} from '../types/categoryTypes'

export default function categoryReducers(stats = {
    isFetching: false,
    isLoading: false,
    categoryFlat: [],
    categoryTree: {},
}, action) {
    switch (action.type) {
        case CATEGORY_FLAT_REQUEST:
            return {
                ...stats,
                isLoading: true
            }
        case CATEGORY_FLAT_REQUEST_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isFetching: true,
                categoryFlat: action.payload
            }
        case CATEGORY_FLAT_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isFetching: false,
                categoryFlat: []
            }
        case CATEGORY_TREE_REQUEST:
            return {
                ...stats,
                isLoading: true
            }
        case CATEGORY_TREE_REQUEST_SUCCESS:
            return {
                ...stats,
                isLoading: false,
                isFetching: true,
                categoryTree: action.payload
            }
        case CATEGORY_TREE_REQUEST_ERROR:
            return {
                ...stats,
                isLoading: false,
                isFetching: false,
                categoryTree: []
            }
        default:
            return stats
    }
}
