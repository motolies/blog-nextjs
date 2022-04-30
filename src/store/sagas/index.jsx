import {all} from 'redux-saga/effects'
import userSagas from './userSagas'
import categorySaga from "./categorySagas"


function* rootSaga() {
    yield all([
        userSagas()
        , categorySaga()

    ])
}

export default rootSaga
