import {all} from 'redux-saga/effects'
import userSagas from './userSagas'
import categorySaga from "./categorySagas"
import postSaga from "./postSagas"
import tagSaga from "./tagSagas"
import commonSaga from "./commonSagas"
import fileSaga from "./fileSagas"


function* rootSaga() {
    yield all([
        userSagas()
        , categorySaga()
        , postSaga()
        , tagSaga()
        , commonSaga()
        , fileSaga()
    ])
}

export default rootSaga
