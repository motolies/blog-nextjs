import axiosClient from './axiosClient'

const tagService = {
    allTags: (config) => {
        return axiosClient.get(`/api/tag/all`, config)
    },
    createTag: (data) => {
        return axiosClient.post(`/api/tag/admin`, data)
    },
    updateTag: (tagId, data) => {
        return axiosClient.put(`/api/tag/admin/${tagId}`, data)
    },
    deleteTag: (tagId) => {
        return axiosClient.delete(`/api/tag/admin/${tagId}`)
    },
    deleteUnusedTags: () => {
        return axiosClient.delete(`/api/tag/admin/unused`)
    },
    mergeTags: (data) => {
        return axiosClient.post(`/api/tag/admin/merge`, data)
    },
}

export default tagService
