import {all} from 'redux-saga/effects'
import userSagas from './userSagas'
import categorySaga from "./categorySagas"
import postSaga from "./postSagas"


function* rootSaga() {
    yield all([
        userSagas()
        , categorySaga()
        , postSaga()
    ])
}

export default rootSaga
