import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import {getBackendBaseUrl} from '../lib/backendUrl'

const CLIENT_TIMEZONE_HEADER = 'X-Client-Timezone'
const CLIENT_UTC_OFFSET_HEADER = 'X-Client-Utc-Offset-Minutes'

const axiosClient = axios.create({
    withCredentials: true,
})

axiosClient.defaults.headers.post['Content-Type'] = 'application/json'

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.baseURL = typeof window === 'undefined'
        ? getBackendBaseUrl()
        : ''

    if (typeof window !== 'undefined') {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const offsetMinutes = -new Date().getTimezoneOffset()

        config.headers = config.headers ?? {} as any
        config.headers[CLIENT_TIMEZONE_HEADER] = timeZone
        config.headers[CLIENT_UTC_OFFSET_HEADER] = String(offsetMinutes)
    }

    return config
})

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        if (response.data && 'data' in response.data && 'status' in response.data) {
            response.data = response.data.data;
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient
