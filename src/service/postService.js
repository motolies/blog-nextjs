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
    search: ({searchAllParam}) => {
        return axiosClient.get('/api/post/search', {
            params:{
                query: base64Encode(JSON.stringify(searchAllParam))
            }
        })
    }
}

export default postService