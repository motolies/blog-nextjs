import {POST_SEARCH_REQUEST} from "../types/postTypes"

export const searchMultiple = ({searchAllParam}) => ({
    type: POST_SEARCH_REQUEST,
    searchAllParam: searchAllParam,
})