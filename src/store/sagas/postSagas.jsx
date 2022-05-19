import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import {
    POST_LOAD_FOR_MODIFY_REQUEST,
    POST_LOAD_FOR_MODIFY_REQUEST_ERROR,
    POST_LOAD_FOR_MODIFY_REQUEST_SUCCESS,
    POST_LOCAL_MODIFY_BODY, POST_LOCAL_MODIFY_BODY_SUCCESS,
    POST_LOCAL_MODIFY_CATEGORY_ID, POST_LOCAL_MODIFY_CATEGORY_ID_SUCCESS,
    POST_LOCAL_MODIFY_PUBLIC, POST_LOCAL_MODIFY_PUBLIC_SUCCESS,
    POST_LOCAL_MODIFY_SUBJECT, POST_LOCAL_MODIFY_SUBJECT_SUCCESS,
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

function* loadContentForModify({postId}) {
    try {
        if (postId) {
            const modifyPost = yield call(service.post.getPost, {postId: postId})
            yield put({
                type: POST_LOAD_FOR_MODIFY_REQUEST_SUCCESS,
                payload: modifyPost.data
            })
        } else {
            const newPost = yield call(service.post.new)
            yield put({
                type: POST_LOAD_FOR_MODIFY_REQUEST_SUCCESS,
                payload: newPost.data
            })
        }
    } catch (err) {
        yield put({type: POST_LOAD_FOR_MODIFY_REQUEST_ERROR})
    }
}

function* localModifySubject({subject}) {
    yield put({
        type: POST_LOCAL_MODIFY_SUBJECT_SUCCESS,
        payload: subject
    })
}

function* localModifyCategoryId({categoryId}) {
    yield put({
        type: POST_LOCAL_MODIFY_CATEGORY_ID_SUCCESS,
        payload: categoryId
    })
}

function* localModifyBody({body}) {
    yield put({
        type: POST_LOCAL_MODIFY_BODY_SUCCESS,
        payload: body
    })
}

function* localModifyPublic({isPublic}) {
    yield put({
        type: POST_LOCAL_MODIFY_PUBLIC_SUCCESS,
        payload: isPublic
    })
}


function* postRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(POST_SEARCH_REQUEST, searchPost)
    yield takeLatest(POST_LOAD_FOR_MODIFY_REQUEST, loadContentForModify)

    yield takeLatest(POST_LOCAL_MODIFY_SUBJECT, localModifySubject)
    yield takeLatest(POST_LOCAL_MODIFY_CATEGORY_ID, localModifyCategoryId)
    yield takeLatest(POST_LOCAL_MODIFY_BODY, localModifyBody)
    yield takeLatest(POST_LOCAL_MODIFY_PUBLIC, localModifyPublic)
}

export default function* postSaga() {
    yield all([postRequest()])
}
