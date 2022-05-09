import {all} from 'redux-saga/effects'
import userSagas from './userSagas'
import categorySaga from "./categorySagas"
import postSaga from "./postSagas"
import tagSaga from "./tagSagas"


function* rootSaga() {
    yield all([
        userSagas()
        , categorySaga()
        , postSaga()
        , tagSaga()
    ])
}

export default rootSaga
