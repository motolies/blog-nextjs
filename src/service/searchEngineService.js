import axiosClient from './axiosClient'

const searchEngineService = {
    getAll: () => {
        return axiosClient.get(`/api/search`)
    },
}

export default searchEngineService