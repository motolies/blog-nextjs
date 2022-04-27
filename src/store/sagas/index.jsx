import {all} from 'redux-saga/effects'
import userSagas from './userSagas'


function* rootSaga() {
    yield all([
        userSagas(),

    ])
}

export default rootSaga
