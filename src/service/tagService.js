import axiosClient from './axiosClient'

const tagService = {
    allTags: (config) => {
        return axiosClient.get(`/api/tag/all`, config)
    },
}

export default tagService
