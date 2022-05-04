import axiosClient from './axiosClient'

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
    searchSingle:({text, type, category, page, pageSize}) =>{
        return axiosClient.post('/api/post/search',{
            searchText: text,
            searchType: type,
            categoryId: category,
            page:page,
            pageSize:pageSize
        })

    }
}

export default postService