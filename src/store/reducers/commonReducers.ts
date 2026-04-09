import {LOADING_FALSE, LOADING_TRUE} from "../types/commonTypes"
import type { CommonState } from '@/types/store'

const initialState: CommonState = {
    isLoading: false,
}

export default function commonReducers(stats: CommonState = initialState, action: { type: string }): CommonState {
    switch (action.type) {
        case LOADING_TRUE:
            return {
                ...stats,
                isLoading: true,
            }
        case LOADING_FALSE:
            return {
                ...stats,
                isLoading: false,
            }
        default:
            return stats
    }
}
