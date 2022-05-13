import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import forge from "node-forge"
import {
    LOAD_USER_REQUEST,
    LOAD_USER_REQUEST_ERROR,
    LOAD_USER_REQUEST_SUCCESS,
    SERVER_LOAD_USER_REQUEST_SUCCESS,
    USER_LOGIN_ERROR_MESSAGE,
    USER_LOGIN_ERROR_MESSAGE_SUCCESS,
    USER_LOGIN_REQUEST,
    USER_LOGIN_REQUEST_ERROR,
    USER_LOGIN_REQUEST_SUCCESS
} from '../types/userTypes'

function encryptPassword(resPublicKey, pass) {
    try {
        const publicKey = forge.pki.publicKeyFromPem('-----BEGIN PUBLIC KEY----- ' + resPublicKey + ' -----END PUBLIC KEY-----')
        const encData = publicKey.encrypt(pass, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha1.create()
            }
        })
        return forge.util.encode64(encData)
    } catch (err) {
        return err
    }
}

function* login({username, password}) {
    try {
        const rsa = yield call(service.user.shake)
        const publicKey = rsa.data.rsaKey
        const encPassword = encryptPassword(publicKey, password)
        const auth = yield call(service.user.login, {
            username,
            encPassword,
            publicKey
        })
        yield put({
            type: USER_LOGIN_REQUEST_SUCCESS,
            payload: auth.data
        })

    } catch (err) {
        yield put({type: USER_LOGIN_REQUEST_ERROR, payload: 'Login failed'})
    }
}

function* loginErrorMessage({msg}) {
    yield put({
        type: USER_LOGIN_ERROR_MESSAGE_SUCCESS,
        payload: msg
    })
}

function* loadUser() {
    try {
        const auth = yield call(service.user.profile)
        yield put({
            type: LOAD_USER_REQUEST_SUCCESS,
            payload: auth.data
        })
    } catch (err) {
        // 사용자 로드를 실패하면 아무런 메시지를 주지 않는다.
        yield put({type: LOAD_USER_REQUEST_ERROR, payload: 'Login failed'})
    }
}

function* serverLoadUser({user}) {
    yield put({
        type: LOAD_USER_REQUEST_SUCCESS,
        payload: user
    })
}

function* userRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(USER_LOGIN_REQUEST, login)
    yield takeLatest(USER_LOGIN_ERROR_MESSAGE, loginErrorMessage)
    yield takeLatest(LOAD_USER_REQUEST, loadUser)
    yield takeLatest(SERVER_LOAD_USER_REQUEST_SUCCESS, serverLoadUser)
}

export default function* userSaga() {
    yield all([userRequest()])
}
