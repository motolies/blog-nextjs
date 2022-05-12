import {LOADING_FALSE, LOADING_TRUE} from "../types/commonTypes"

export default function commonReducers(stats = {
    isLoading: false,
}, action) {
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
