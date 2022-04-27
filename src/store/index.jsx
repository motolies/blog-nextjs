import {applyMiddleware, compose, createStore} from 'redux'
import {createWrapper} from 'next-redux-wrapper'
import {composeWithDevTools} from 'redux-devtools-extension'
import createSagaMiddleware from 'redux-saga'
import reducers from './reducers'
import sagas from './sagas'

// Create a makeStore function
const makeStore = () => {
    const sagaMiddleware = createSagaMiddleware()

    const enhancer =
        process.env.NODE_ENV === 'production'
            ? compose(applyMiddleware(sagaMiddleware))
            : composeWithDevTools(applyMiddleware(sagaMiddleware))

    const store = createStore(reducers, enhancer)

    // Run Redux Saga
    sagaMiddleware.run(sagas)
    return store
}

// Export an assembled wrapper
// export const wrapper = createWrapper(makeStore)

export const wrapper = createWrapper(makeStore, {
    debug: process.env.NODE_ENV === 'development',
})