import {combineReducers} from 'redux'
import {HYDRATE} from "next-redux-wrapper"
import userReducers from "./userReducers"
import categoryReducers from "./categoryReducers"
import postReducers from "./postReducers"
import tagReducers from "./tagReducers"
import commonReducers from "./commonReducers"


const rootReducer = (state, action) => {
    switch (action.type) {
        case HYDRATE:
            // 서버에서 받은 내용으로 클라이언트 redux를 초기화한다.
            return {...state, ...action.payload}
        default:
            return combineReducers({
                // reducers
                user: userReducers
                , category: categoryReducers
                , post: postReducers
                , tag: tagReducers
                , common: commonReducers
            })(state, action)
    }
}

export default rootReducer