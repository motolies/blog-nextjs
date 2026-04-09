import axiosClient from './axiosClient'
import type { AxiosRequestConfig } from 'axios'
import type { SystemLogSearchRequest, ApiLogSearchRequest } from '@/types/log'

const LOG_API_BASE = '/api/log/admin'

class LogService {
  searchSystemLogs = async ({searchRequest}: { searchRequest: SystemLogSearchRequest }, config?: AxiosRequestConfig) => {
    const response = await axiosClient.post(
      `${LOG_API_BASE}/system/search`,
      searchRequest,
      config
    )
    return response.data
  }

  searchApiLogs = async ({searchRequest}: { searchRequest: ApiLogSearchRequest }, config?: AxiosRequestConfig) => {
    const response = await axiosClient.post(
      `${LOG_API_BASE}/api/search`,
      searchRequest,
      config
    )
    return response.data
  }
}

const logService = new LogService()
export default logService
