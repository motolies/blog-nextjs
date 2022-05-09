import axiosClient from './axiosClient'

const tagService = {
    allTags: () => {
        return axiosClient.get(`/api/tag/all`)
    },
}

export default tagService