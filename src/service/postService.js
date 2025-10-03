import axiosClient from './axiosClient'
import {base64Encode} from "../util/base64Util"

const postService = {
    mainPost: (config) => {
        return axiosClient.get(`/api/post`, config)
    },
    getPost: ({postId}, config) => {
        return axiosClient.get(`/api/post/${postId}`, config)
    },
    getPrevNext: ({postId}, config) => {
        return axiosClient.get(`/api/post/prev-next/${postId}`, config)
    },
    deletePost: ({postId}, config) => {
        return axiosClient.delete(`/api/post/admin/${postId}`, config)
    },
    setPublicPost: ({postId, publicStatus}, config) => {
        return axiosClient.post(`/api/post/admin/public`, {
            id: postId,
            publicStatus: publicStatus
        }, config)
    },
    deleteTag: ({postId, tagId}, config) => {
        return axiosClient.delete(`/api/post/admin/${postId}/tag/${tagId}`, config)
    },
    addTag: ({postId, tagName}, config) => {
        return axiosClient.post(`/api/post/admin/${postId}/tag`, {
            name: tagName
        }, config)
    },
    search: ({searchAllParam}, config) => {
        return axiosClient.get('/api/post/search', {
            params: {
                query: base64Encode(JSON.stringify(searchAllParam))
            },
            ...(config || {})
        })
    },
    new: (config) => {
        return axiosClient.post('/api/post/admin', undefined, config)
    },
    save: ({post}, config) => {
        return axiosClient.put(`/api/post/admin/${post.id}`, post, config)
    }
}

export default postService
