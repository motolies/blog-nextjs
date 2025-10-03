import axiosClient from './axiosClient'

const searchEngineService = {
    getAll: (config) => {
        return axiosClient.get(`/api/post/search-engine`, config)
    },
}

export default searchEngineService
