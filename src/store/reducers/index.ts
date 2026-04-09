import {combineReducers} from 'redux'
import {HYDRATE} from "next-redux-wrapper"
import userReducers from "./userReducers"
import categoryReducers from "./categoryReducers"
import postReducers from "./postReducers"
import tagReducers from "./tagReducers"
import commonReducers from "./commonReducers"
import type { RootState } from '@/types/store'


const rootReducer = (state: RootState | undefined, action: { type: string; payload?: unknown }) => {
    switch (action.type) {
        case HYDRATE:
            return {...state, ...action.payload as RootState}
        default:
            return combineReducers({
                user: userReducers
                , category: categoryReducers
                , post: postReducers
                , tag: tagReducers
                , common: commonReducers
            })(state, action)
    }
}

export default rootReducer
