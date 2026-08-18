import type { AxiosRequestConfig } from 'axios';
import axiosClient from './axiosClient';

const searchEngineService = {
  getAll: (config?: AxiosRequestConfig) => {
    return axiosClient.get(`/api/post/search-engine`, config);
  },
};

export default searchEngineService;
