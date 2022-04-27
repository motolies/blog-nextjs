import {all, call, put, takeLatest} from 'redux-saga/effects'
import service from '../../service'
import forge from "node-forge"
import {USER_LOGIN, USER_LOGIN_ERROR, USER_LOGIN_ERROR_MESSAGE, USER_LOGIN_ERROR_MESSAGE_SUCCESS, USER_LOGIN_SUCCESS} from '../types/userTypes'

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
            type: USER_LOGIN_SUCCESS,
            payload: auth.data
        })

    } catch (err) {
        yield put({type: USER_LOGIN_ERROR, payload: 'Login failed'})
    }
}

function* loginErrorMessage(msg) {
    yield put({
        type: USER_LOGIN_ERROR_MESSAGE_SUCCESS,
        payload: msg
    })
}


function* userRequest() {
    // 액션의 type과 saga의 함수를 이어주는 부분
    yield takeLatest(USER_LOGIN, login)
    yield takeLatest(USER_LOGIN_ERROR_MESSAGE, loginErrorMessage)
}

export default function* userSaga() {
    yield all([userRequest()])
}
