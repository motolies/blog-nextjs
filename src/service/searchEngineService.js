import axiosClient from './axiosClient'

const searchEngineService = {
    getAll: () => {
        return axiosClient.get(`/api/post/search-engine`)
    },
}

export default searchEngineService