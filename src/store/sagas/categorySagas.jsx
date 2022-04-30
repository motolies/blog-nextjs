import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import {
    CATEGORY_FLAT_REQUEST,
    CATEGORY_FLAT_REQUEST_SUCCESS,
    CATEGORY_FLAT_REQUEST_ERROR,
    CATEGORY_TREE_REQUEST,
    CATEGORY_TREE_REQUEST_SUCCESS,
    CATEGORY_TREE_REQUEST_ERROR
} from '../types/categoryTypes'

function* getCategoryFlat() {
    try {
        const category = yield call(service.category.getCategoryFlat)
        yield put({
            type: CATEGORY_FLAT_REQUEST_SUCCESS,
            payload: category.data
        })

    } catch (err) {
        yield put({type: CATEGORY_FLAT_REQUEST_ERROR})
    }
}

function* getCategoryTree() {
    try {
        const category = yield call(service.category.getCategoryRoot)
        yield put({
            type: CATEGORY_TREE_REQUEST_SUCCESS,
            payload: category.data
        })

    } catch (err) {
        yield put({type: CATEGORY_TREE_REQUEST_ERROR})
    }
}

function* categoryRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(CATEGORY_FLAT_REQUEST, getCategoryFlat)
    yield takeLatest(CATEGORY_TREE_REQUEST, getCategoryTree)
}

export default function* categorySaga() {
    yield all([categoryRequest()])
}
