import {POST_SINGLE_SEARCH_REQUEST} from "../types/postTypes"

export const searchSingle = ({searchText, searchType, category, page, pageSize}) => ({
    type: POST_SINGLE_SEARCH_REQUEST,
    searchType:searchType,
    searchText:searchText,
    category:category,
    page:page,
    pageSize:pageSize
})
