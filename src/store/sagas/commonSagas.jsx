import {all, put, takeEvery, takeLatest} from 'redux-saga/effects'
import {LOADING_FALSE, LOADING_TRUE} from "../types/commonTypes"

export function* setLoading() {
    yield put({
        type: LOADING_TRUE,
    })
}

export function* cancelLoading() {
    yield put({
        type: LOADING_FALSE,
    })
}

function* setCommonRequest() {
    yield takeEvery(
        (action) => action.type.substring(action.type.lastIndexOf('_') + 1) === 'REQUEST',
        setLoading
    )
    yield takeEvery(
        (action) =>
            action.type.substring(action.type.lastIndexOf('_') + 1) === 'ERROR' ||
            action.type.substring(action.type.lastIndexOf('_') + 1) === 'RESET' ||
            action.type.substring(action.type.lastIndexOf('_') + 1) === 'SUCCESS',
        cancelLoading
    )
}

function* commonRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
}

export default function* commonSaga() {
    yield all([commonRequest(), setCommonRequest()])
}
