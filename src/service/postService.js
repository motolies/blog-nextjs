import axiosClient from './axiosClient'
import {base64Encode} from "../util/base64Util"

const postService = {
    mainPost: () => {
        return axiosClient.get(`/api/post`)
    },
    getPost: ({postId}) => {
        return axiosClient.get(`/api/post/${postId}`)
    },
    getPrevNext: ({postId}) => {
        return axiosClient.get(`/api/post/prev-next/${postId}`)
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
    addTag: ({postId, tagName}) => {
        return axiosClient.post(`/api/post/${postId}/tag`, {
            tagName: tagName
        })
    },
    search: ({searchAllParam}) => {
        return axiosClient.get('/api/post/search', {
            params: {
                query: base64Encode(JSON.stringify(searchAllParam))
            }
        })
    },
    new: () => {
        return axiosClient.post('/api/post')
    },
    save: ({post}) => {
        return axiosClient.put(`/api/post/${post.id}`, post)
    }
}

export default postService