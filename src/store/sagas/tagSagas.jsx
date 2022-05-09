import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import {TAG_ALL_REQUEST, TAG_ALL_REQUEST_ERROR, TAG_ALL_REQUEST_SUCCESS} from "../types/tagTypes"

function* getAllTag() {
    try {
        const tags = yield call(service.tag.allTags)
        yield put({
            type: TAG_ALL_REQUEST_SUCCESS,
            payload: tags.data
        })

    } catch (err) {
        yield put({type: TAG_ALL_REQUEST_ERROR})
    }
}

function* tagRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(TAG_ALL_REQUEST, getAllTag)
}

export default function* tagSaga() {
    yield all([tagRequest()])
}
