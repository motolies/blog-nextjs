import axiosClient from './axiosClient'
import {base64Encode} from "../util/base64Util"
import type { AxiosRequestConfig } from 'axios'
import type { Post, SearchAllParam } from '@/types/post'

const postService = {
    mainPost: (config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/post`, config)
    },
    getPost: ({postId}: { postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/post/${postId}`, config)
    },
    getPrevNext: ({postId}: { postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/post/prev-next/${postId}`, config)
    },
    deletePost: ({postId}: { postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.delete(`/api/post/admin/${postId}`, config)
    },
    setPublicPost: ({postId, publicStatus}: { postId: string; publicStatus: boolean }, config?: AxiosRequestConfig) => {
        return axiosClient.post(`/api/post/admin/public`, {
            id: postId,
            publicStatus: publicStatus
        }, config)
    },
    deleteTag: ({postId, tagId}: { postId: string; tagId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.delete(`/api/post/admin/${postId}/tag/${tagId}`, config)
    },
    addTag: ({postId, tagName}: { postId: string; tagName: string }, config?: AxiosRequestConfig) => {
        return axiosClient.post(`/api/post/admin/${postId}/tag`, {
            name: tagName
        }, config)
    },
    search: ({searchAllParam}: { searchAllParam: SearchAllParam }, config?: AxiosRequestConfig) => {
        return axiosClient.get('/api/post/search', {
            params: {
                query: base64Encode(JSON.stringify(searchAllParam))
            },
            ...(config || {})
        })
    },
    getRelatedPosts: ({postId}: { postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/post/${postId}/related`, config)
    },
    new: (config?: AxiosRequestConfig) => {
        return axiosClient.post('/api/post/admin', undefined, config)
    },
    save: ({post}: { post: Post }, config?: AxiosRequestConfig) => {
        return axiosClient.put(`/api/post/admin/${post.id}`, post, config)
    },
    deleteDraft: ({postId}: { postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.delete(`/api/post/admin/${postId}/draft`, config)
    }
}

export default postService
