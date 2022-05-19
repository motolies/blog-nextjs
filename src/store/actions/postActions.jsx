import {POST_LOAD_FOR_MODIFY_REQUEST, POST_SEARCH_REQUEST} from "../types/postTypes"

export const searchMultiple = ({searchAllParam}) => ({
    type: POST_SEARCH_REQUEST,
    searchAllParam: searchAllParam,
})


export const loadContentForModify = ({postId}) => ({
    type: POST_LOAD_FOR_MODIFY_REQUEST,
    postId: postId,
})