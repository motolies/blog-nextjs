import {
    CATEGORY_FLAT_REQUEST
    , CATEGORY_FLAT_REQUEST_SUCCESS
    , CATEGORY_FLAT_REQUEST_ERROR, CATEGORY_TREE_REQUEST, CATEGORY_TREE_REQUEST_SUCCESS, CATEGORY_TREE_REQUEST_ERROR
} from '../types/categoryTypes'
import type { CategoryState } from '@/types/store'
import type { Category, CategoryTreeNode } from '@/types/category'

const initialState: CategoryState = {
    isFetching: false,
    isLoading: false,
    categoryFlat: [],
    categoryTree: {},
}

export default function categoryReducers(stats: CategoryState = initialState, action: { type: string; payload?: unknown }): CategoryState {
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
                categoryFlat: action.payload as Category[]
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
                categoryTree: action.payload as CategoryTreeNode
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
