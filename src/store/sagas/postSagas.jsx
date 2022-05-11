import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import {
    POST_SEARCH_REQUEST,
    POST_SEARCH_REQUEST_ERROR,
    POST_SEARCH_REQUEST_SUCCESS,
} from "../types/postTypes"

function* searchPost({searchAllParam}) {
    try {
        const searchedPost = yield call(service.post.search, {searchAllParam: searchAllParam})
        yield put({
            type: POST_SEARCH_REQUEST_SUCCESS,
            payload: searchedPost.data
        })

    } catch (err) {
        yield put({type: POST_SEARCH_REQUEST_ERROR})
    }
}

function* postRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(POST_SEARCH_REQUEST, searchPost)
}

export default function* postSaga() {
    yield all([postRequest()])
}
