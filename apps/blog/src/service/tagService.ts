import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'

const tagService = {
    allTags: (config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/tag/all`, config)
    },
    createTag: (data: Record<string, unknown>) => {
        return axiosClient.post(`/api/tag/admin`, data)
    },
    updateTag: (tagId: string, data: Record<string, unknown>) => {
        return axiosClient.put(`/api/tag/admin/${tagId}`, data)
    },
    deleteTag: (tagId: string) => {
        return axiosClient.delete(`/api/tag/admin/${tagId}`)
    },
    deleteUnusedTags: () => {
        return axiosClient.delete(`/api/tag/admin/unused`)
    },
    mergeTags: (data: Record<string, unknown>) => {
        return axiosClient.post(`/api/tag/admin/merge`, data)
    },
}

export default tagService
