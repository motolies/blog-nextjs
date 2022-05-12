import {LOADING_FALSE, LOADING_TRUE} from "../types/commonTypes"

export const setLoading = () => ({
    type: LOADING_TRUE,
});

export const cancelLoading = () => ({
    type: LOADING_FALSE,
});