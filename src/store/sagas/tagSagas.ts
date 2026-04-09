import {all, call, put, takeLatest} from 'typed-redux-saga'
import service from '../../service'
import {TAG_ALL_REQUEST, TAG_ALL_REQUEST_ERROR, TAG_ALL_REQUEST_SUCCESS} from "../types/tagTypes"

function* getAllTag() {
    try {
        const tags = yield* call(service.tag.allTags)
        yield* put({
            type: TAG_ALL_REQUEST_SUCCESS,
            payload: tags.data
        })

    } catch (err) {
        yield* put({type: TAG_ALL_REQUEST_ERROR})
    }
}

function* tagRequest() {
    yield* takeLatest(TAG_ALL_REQUEST, getAllTag)
}

export default function* tagSaga() {
    yield* all([tagRequest()])
}
