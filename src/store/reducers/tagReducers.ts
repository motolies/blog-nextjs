import {TAG_ALL_REQUEST, TAG_ALL_REQUEST_ERROR, TAG_ALL_REQUEST_SUCCESS} from "../types/tagTypes"
import type { TagState } from '@/types/store'
import type { Tag } from '@/types/tag'

const initialState: TagState = {
    isFetching: false,
    isLoading: false,
    tags: [],
}

export default function tagReducers(stats: TagState = initialState, action: { type: string; payload?: unknown }): TagState {
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
                tags: action.payload as Tag[]
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
