import {all, call, put, takeLatest} from 'redux-saga/effects'
import {FILE_LIST_BY_POST_REQUEST, FILE_LIST_BY_POST_REQUEST_ERROR, FILE_LIST_BY_POST_REQUEST_SUCCESS} from "../types/fileTypes"
import service from "../../service"

function* fileListByPostId({postId}) {
    try {
        const auth = yield call(service.file.fileByPostId, {postId: postId})
        yield put({
            type: FILE_LIST_BY_POST_REQUEST_SUCCESS,
            payload: auth.data
        })
    } catch (err) {
        yield put({type: FILE_LIST_BY_POST_REQUEST_ERROR})
    }
}

function* fileRequest() {
    yield takeLatest(FILE_LIST_BY_POST_REQUEST, fileListByPostId)
}

export default function* fileSaga() {
    yield all([fileRequest()])
}
