import axiosClient from './axiosClient'
import {base64Encode} from "../util/base64Util"

const postService = {
    mainPost: () => {
        return axiosClient.get(`/api/post`)
    },
    getPost: ({postId}) => {
        return axiosClient.get(`/api/post/${postId}`)
    },
    deletePost: ({postId}) => {
        return axiosClient.delete(`/api/post/${postId}`)
    },
    setPublicPost: ({postId, publicStatus}) => {
        return axiosClient.post(`/api/post/public`, {
            id: postId,
            publicStatus: publicStatus
        })
    },
    deleteTag: ({postId, tagId}) => {
        return axiosClient.delete(`/api/post/${postId}/tag/${tagId}`)
    },
    searchSingle: ({text, type, category, page, pageSize}) => {
        return axiosClient.get('/api/post/search', {
            params: {
                searchText: text,
                searchType: type,
                categoryId: category,
                page: page,
                pageSize: pageSize
            }
        })
    },
    searchMultiple: ({searchObject}) => {

        const searchParams = {
            searchType: "TITLE | CONTENT | FULL",
            searchCondition: {
                keywords: [
                    "검색",
                    "검색어"
                ],
                logic: "AND | OR"
            },
            categoryIds: [
                "CATEGORY_ID1",
                "CATEGORY_ID2",
                "CATEGORY_ID3"
            ],
            tagIds: ["TAG1", "TAG2", "TAG3"],
            page: 1,
            pageSize: 10
        }

        return axiosClient.get('/api/post/search/detail', {
            params:{
                query: base64Encode(JSON.stringify(searchParams))
            }
        })
    }
}

export default postService