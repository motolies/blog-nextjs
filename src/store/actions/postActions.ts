import {POST_LOAD_FOR_MODIFY_REQUEST, POST_SEARCH_REQUEST} from "../types/postTypes"
import type { SearchAllParam } from '@/types/post'

export const searchMultiple = ({searchAllParam}: { searchAllParam: SearchAllParam }) => ({
    type: POST_SEARCH_REQUEST,
    searchAllParam: searchAllParam,
})


export const loadContentForModify = ({postId}: { postId?: string }) => ({
    type: POST_LOAD_FOR_MODIFY_REQUEST,
    postId: postId,
})
