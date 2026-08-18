import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'

const seriesService = {
    getAll: (config?: AxiosRequestConfig) => {
        return axiosClient.get('/api/series', config)
    },
    getDetail: ({seriesId}: { seriesId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/series/${seriesId}`, config)
    },
    getByPostId: ({postId}: { postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/series/by-post/${postId}`, config)
    },
    create: ({title, description}: { title: string; description?: string }, config?: AxiosRequestConfig) => {
        return axiosClient.post('/api/series/admin', {title, description}, config)
    },
    update: ({seriesId, title, description}: { seriesId: string; title: string; description?: string }, config?: AxiosRequestConfig) => {
        return axiosClient.put(`/api/series/admin/${seriesId}`, {title, description}, config)
    },
    delete: ({seriesId}: { seriesId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.delete(`/api/series/admin/${seriesId}`, config)
    },
    addPost: ({seriesId, postId}: { seriesId: string; postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.post(`/api/series/admin/${seriesId}/posts`, {postId: Number(postId)}, config)
    },
    removePost: ({seriesId, postId}: { seriesId: string; postId: string }, config?: AxiosRequestConfig) => {
        return axiosClient.delete(`/api/series/admin/${seriesId}/posts/${postId}`, config)
    },
    reorderPosts: ({seriesId, postIds}: { seriesId: string; postIds: number[] }, config?: AxiosRequestConfig) => {
        return axiosClient.put(`/api/series/admin/${seriesId}/posts/reorder`, {postIds}, config)
    },
}

export default seriesService
