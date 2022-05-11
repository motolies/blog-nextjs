import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import {POST_MULTIPLE_SEARCH_REQUEST, POST_SINGLE_SEARCH_REQUEST, POST_SINGLE_SEARCH_REQUEST_ERROR, POST_SINGLE_SEARCH_REQUEST_SUCCESS} from "../types/postTypes"

function* searchPost({searchText, searchType, category, page, pageSize}) {
    try {
        const searchedPost = yield call(service.post.searchSingle, {text: searchText, type: searchType, category, page, pageSize})
        yield put({
            type: POST_SINGLE_SEARCH_REQUEST_SUCCESS,
            payload: searchedPost.data
        })

    } catch (err) {
        yield put({type: POST_SINGLE_SEARCH_REQUEST_ERROR})
    }
}

function* searchMultiplePost({searchAllParam}) {
    try {
        const searchedPost = yield call(service.post.searchMultiple, {searchAllParam: searchAllParam})
        yield put({
            type: POST_SINGLE_SEARCH_REQUEST_SUCCESS,
            payload: searchedPost.data
        })

    } catch (err) {
        yield put({type: POST_SINGLE_SEARCH_REQUEST_ERROR})
    }
}

function* postRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(POST_SINGLE_SEARCH_REQUEST, searchPost)
    yield takeLatest(POST_MULTIPLE_SEARCH_REQUEST, searchMultiplePost)
}

export default function* postSaga() {
    yield all([postRequest()])
}
