import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'

const searchEngineService = {
    getAll: (config?: AxiosRequestConfig) => {
        return axiosClient.get(`/api/post/search-engine`, config)
    },
}

export default searchEngineService
