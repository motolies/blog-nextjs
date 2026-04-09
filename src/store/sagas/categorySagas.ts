import {all, call, put, takeLatest} from 'typed-redux-saga'
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
        const category = yield* call(service.category.getCategoryFlat)
        yield* put({
            type: CATEGORY_FLAT_REQUEST_SUCCESS,
            payload: category.data
        })

    } catch (err) {
        yield* put({type: CATEGORY_FLAT_REQUEST_ERROR})
    }
}

function* getCategoryTree() {
    try {
        const category = yield* call(service.category.getCategoryRoot)
        yield* put({
            type: CATEGORY_TREE_REQUEST_SUCCESS,
            payload: category.data
        })

    } catch (err) {
        yield* put({type: CATEGORY_TREE_REQUEST_ERROR})
    }
}

function* categoryRequest() {
    yield* takeLatest(CATEGORY_FLAT_REQUEST, getCategoryFlat)
    yield* takeLatest(CATEGORY_TREE_REQUEST, getCategoryTree)
}

export default function* categorySaga() {
    yield* all([categoryRequest()])
}
